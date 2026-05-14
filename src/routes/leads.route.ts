import { Router } from 'express';
import { adminAuth } from '../middlewares/adminAuth';
import { listLeads, updateLeadStatus, deleteLead, getLeadCount } from '../controllers/leads.controller';

const router = Router();

router.use(adminAuth);

router.get('/',           listLeads);
router.get('/count',      getLeadCount);
router.patch('/:id',      updateLeadStatus);
router.delete('/:id',     deleteLead);

export default router;
