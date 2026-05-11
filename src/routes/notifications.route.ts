import { Router } from 'express';
import { adminAuth } from '../middlewares/adminAuth';
import { registerToken, sendManual } from '../controllers/notifications.controller';

const router = Router();

router.post('/register-token', registerToken);   // called by APK on login (no auth needed — token only, no data)
router.post('/send', adminAuth, sendManual);      // manual/test sends require admin key

export default router;
