import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-admin-key'] as string | undefined;
  if (!key || key !== env.ADMIN_API_KEY) {
    res.status(401).json({ error: 'Unauthorized — include x-admin-key header' });
    return;
  }
  next();
}
