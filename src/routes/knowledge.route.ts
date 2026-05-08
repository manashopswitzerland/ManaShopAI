import { Router } from 'express';
import { adminAuth } from '../middlewares/adminAuth';
import {
  listFaqs, createFaq, updateFaq, deleteFaq,
  getContext, updateContext,
} from '../controllers/knowledge.controller';

const router = Router();
router.use(adminAuth);

router.get('/faqs',         listFaqs);
router.post('/faqs',        createFaq);
router.put('/faqs/:id',     updateFaq);
router.delete('/faqs/:id',  deleteFaq);

router.get('/context',      getContext);
router.put('/context',      updateContext);

export default router;
