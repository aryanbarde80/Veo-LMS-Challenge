import { Router, Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../db';
import { paymentOrders, enrollments, courses } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Lazily construct the Razorpay client. Building it at module load time means a
// missing/invalid RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET throws during import and
// crashes the ENTIRE serverless function (every route, not just payments) on Vercel.
// Constructing it on first use turns that into a normal, catchable 500 on the
// payment routes only, and gives you a clear log line telling you what's missing.
let razorpay: Razorpay | null = null;
function getRazorpay(): Razorpay {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      'RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set in the environment. ' +
      'Set them in Vercel → Project → Settings → Environment Variables and redeploy.'
    );
  }
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

// POST /api/payments/create-order
router.post('/create-order', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ error: 'Course ID required' });

    const [course] = await db
      .select({ id: courses.id, title: courses.title, price: courses.price, isPublished: courses.isPublished })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course || !course.isPublished) return res.status(404).json({ error: 'Course not found' });

    // Check if already enrolled
    const [existing] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, req.user!.id), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (existing) return res.status(409).json({ error: 'Already enrolled in this course' });

    const amount = Math.round(parseFloat(course.price) * 100); // paise

    // Free course - enroll directly
    if (amount === 0) {
      const [enrollment] = await db
        .insert(enrollments)
        .values({ userId: req.user!.id, courseId, amountPaid: '0' })
        .returning();
      return res.json({ enrolled: true, enrollment });
    }

    const order = await getRazorpay().orders.create({
      amount,
      currency: 'INR',
      receipt: `veo_${Date.now()}`,
      notes: { courseId, userId: req.user!.id },
    });

    await db.insert(paymentOrders).values({
      userId: req.user!.id,
      courseId,
      razorpayOrderId: order.id,
      amount: course.price,
      currency: 'INR',
    });

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      courseName: course.title,
    });
  } catch (err: any) {
    console.error('Create order error:', err);
    if (err?.message?.includes('RAZORPAY_KEY')) {
      return res.status(500).json({ error: 'Payments are not configured on the server yet.' });
    }
    return res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// POST /api/payments/verify
router.post('/verify', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    // Verify signature - CRITICAL SECURITY STEP
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed - invalid signature' });
    }

    // Find the pending order
    const [pendingOrder] = await db
      .select()
      .from(paymentOrders)
      .where(and(eq(paymentOrders.razorpayOrderId, razorpay_order_id), eq(paymentOrders.userId, req.user!.id)))
      .limit(1);

    if (!pendingOrder) return res.status(404).json({ error: 'Order not found' });
    if (pendingOrder.status === 'paid') return res.status(409).json({ error: 'Already processed' });

    // Check not already enrolled (idempotency)
    const [existingEnrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, req.user!.id), eq(enrollments.courseId, pendingOrder.courseId)))
      .limit(1);

    if (existingEnrollment) {
      return res.json({ enrolled: true, message: 'Already enrolled' });
    }

    // Create enrollment
    const [enrollment] = await db
      .insert(enrollments)
      .values({
        userId: req.user!.id,
        courseId: pendingOrder.courseId,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amountPaid: pendingOrder.amount,
      })
      .returning();

    // Mark order as paid
    await db
      .update(paymentOrders)
      .set({ status: 'paid' })
      .where(eq(paymentOrders.id, pendingOrder.id));

    return res.json({ enrolled: true, enrollment });
  } catch (err) {
    console.error('Verify payment error:', err);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
});

export default router;
