import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { shopifyService } from '../services/shopify.service';

const router = Router();

function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-admin-key'];
  if (key !== env.ADMIN_API_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

router.post('/', adminAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await shopifyService.syncAllStores();
    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
});

export default router;
