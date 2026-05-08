import { Router } from 'express';
import { adminAuth } from '../middlewares/adminAuth';
import {
  listConversations,
  getConversation,
  handoffConversation,
  replyToConversation,
  resolveConversation,
} from '../controllers/dashboard.controller';

const router = Router();

router.use(adminAuth);

router.get('/conversations', listConversations);
router.get('/conversations/:id', getConversation);
router.post('/conversations/:id/handoff', handoffConversation);
router.post('/conversations/:id/reply', replyToConversation);
router.post('/conversations/:id/resolve', resolveConversation);

export default router;
