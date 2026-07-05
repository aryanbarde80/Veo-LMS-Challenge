import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db } from '../db';
import { users, refreshTokens } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { authenticate, AuthRequest } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please try again later' },
});

const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
  const refreshToken = uuidv4();
  return { accessToken, refreshToken };
}

router.post('/signup', authLimiter, async (req: Request, res: Response) => {
  try {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    const { name, email, password } = result.data;

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'student',
    }).returning({ id: users.id, name: users.name, email: users.email, role: users.role });

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(refreshTokens).values({ userId: user.id, token: refreshToken, expiresAt });

    return res.status(201).json({ accessToken, refreshToken, user });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    const { email, password } = result.data;

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(refreshTokens).values({ userId: user.id, token: refreshToken, expiresAt });

    return res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

    const [stored] = await db
      .select()
      .from(refreshTokens)
      .where(and(eq(refreshTokens.token, refreshToken), gt(refreshTokens.expiresAt, new Date())))
      .limit(1);

    if (!stored) return res.status(401).json({ error: 'Invalid or expired refresh token' });

    const [user] = await db.select({ id: users.id, role: users.role, name: users.name, email: users.email }).from(users).where(eq(users.id, stored.userId)).limit(1);
    if (!user) return res.status(401).json({ error: 'User not found' });

    // Rotate refresh token
    await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken));
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.role);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(refreshTokens).values({ userId: user.id, token: newRefreshToken, expiresAt });

    return res.json({ accessToken, refreshToken: newRefreshToken, user });
  } catch (err) {
    return res.status(500).json({ error: 'Token refresh failed' });
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken));
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Logout failed' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

export default router;
