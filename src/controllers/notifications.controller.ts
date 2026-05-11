import type { Request, Response, NextFunction } from 'express';
import { FcmToken } from '../models/fcm-token.model';
import { sendNotification } from '../services/notifications';

// POST /api/notifications/register-token
export async function registerToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, deviceId } = req.body as { token?: string; deviceId?: string };
    if (!token || !deviceId) {
      res.status(400).json({ error: 'token and deviceId are required' });
      return;
    }
    await FcmToken.findOneAndUpdate(
      { deviceId },
      { token },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/notifications/send  (manual trigger / testing)
export async function sendManual(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, title, body, data } = req.body as {
      token?: string;
      title?: string;
      body?: string;
      data?: Record<string, string>;
    };
    if (!token || !title || !body) {
      res.status(400).json({ error: 'token, title, and body are required' });
      return;
    }
    await sendNotification({ token, title, body, data });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
