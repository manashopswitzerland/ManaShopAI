import { Router } from 'express';
import { handleWebChat, pollMessages, chatSchema } from '../controllers/chat.controller';
import { validate } from '../middlewares/validate';

const router = Router();

router.post('/', validate(chatSchema), handleWebChat);
router.get('/messages/:sessionId', pollMessages);

export default router;
