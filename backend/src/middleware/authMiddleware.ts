import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

// 1. Extend Express Request to include our authenticated user
export interface AuthRequest extends Request {
  user?: User;
}

// 2. The protect middleware (security guard)
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  // Check if header exists: Authorization: "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token string after the space
      token = req.headers.authorization.split(' ')[1];

      // Verify token signature with our secret
      const secret = process.env.JWT_SECRET || 'fallback_secret';
      const decoded = jwt.verify(token, secret) as { id: string; role: string };

      // Find user in PostgreSQL (exclude password from memory)
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        res.status(401).json({ error: 'User no longer exists' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ error: 'User account is deactivated' });
        return;
      }

      // Attach user to request so downstream routes know who this is
      req.user = user;

      // Pass control to the next handler!
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ error: 'Not authorized, token failed or expired' });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Not authorized, no token provided' });
    return;
  }
};

// 3. Role-Based Authorization Middleware (Factory function)
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Ensure req.user was already populated by protect()
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        error: `User role '${req.user?.role}' is not authorized to access this route`,
      });
      return;
    }

    // Role matches! Pass to the next function
    next();
  };
};
