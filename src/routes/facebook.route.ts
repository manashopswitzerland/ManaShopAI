import { Router } from 'express';
import { verifyFacebookWebhook, handleFacebookWebhook } from '../controllers/facebook.controller';

const router = Router();

router.get('/',  verifyFacebookWebhook);
router.post('/', handleFacebookWebhook);

export default router;
