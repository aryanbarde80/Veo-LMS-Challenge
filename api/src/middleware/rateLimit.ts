import { Request, Response, NextFunction } from 'express';

/**
 * Rate Limiter Middleware - Prevent abuse and DDoS attacks
 * Uses token bucket algorithm for flexible rate limiting
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  statusCode?: number;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests, please try again later',
  statusCode: 429,
};

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.startCleanup();
  }

  /**
   * Get or create limit key for request
   */
  private getKey(req: Request): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }
    // Use IP address as default key
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  /**
   * Middleware function for rate limiting
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.getKey(req);
      const now = Date.now();

      // Initialize or reset if window expired
      if (!this.store[key] || this.store[key].resetTime < now) {
        this.store[key] = {
          count: 0,
          resetTime: now + this.config.windowMs,
        };
      }

      // Increment request count
      this.store[key].count++;

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': this.config.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, this.config.maxRequests - this.store[key].count).toString(),
        'X-RateLimit-Reset': new Date(this.store[key].resetTime).toISOString(),
      });

      // Check if limit exceeded
      if (this.store[key].count > this.config.maxRequests) {
        return res.status(this.config.statusCode || 429).json({
          error: this.config.message,
          retryAfter: Math.ceil((this.store[key].resetTime - now) / 1000),
        });
      }

      next();
    };
  }

  /**
   * Reset limit for specific key
   */
  reset(key: string): void {
    delete this.store[key];
  }

  /**
   * Get current limit status
   */
  getStatus(key: string) {
    return this.store[key] || null;
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      Object.keys(this.store).forEach(key => {
        if (this.store[key].resetTime < now) {
          delete this.store[key];
        }
      });
    }, 60 * 1000); // Cleanup every minute
  }
}

/**
 * Pre-configured rate limiters for different endpoints
 */
export const globalLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
});

export const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5, // Strict limit for auth endpoints
  message: 'Too many login attempts, please try again later',
});

export const apiLimiter = new RateLimiter({
  windowMs: 1 * 60 * 1000,
  maxRequests: 30, // Per-minute limit
});

export const uploadLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20,
  message: 'Upload limit exceeded, try again in an hour',
});

export const createRateLimiter = (config: Partial<RateLimitConfig>) => {
  return new RateLimiter(config);
};

export default RateLimiter;
