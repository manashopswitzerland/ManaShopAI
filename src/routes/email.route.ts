import { Router } from 'express';
import { handleInboundEmail } from '../controllers/email.controller';

const router = Router();

// SendGrid Inbound Parse posts multipart/form-data; body-parser handles it via urlencoded
router.post('/', handleInboundEmail);

export default router;
