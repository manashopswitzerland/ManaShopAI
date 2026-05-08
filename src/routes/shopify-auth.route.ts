import { Router } from 'express';
import { startAuth, handleCallback } from '../controllers/shopify-auth.controller';

const router = Router();

router.get('/',          startAuth);
router.get('/callback',  handleCallback);

export default router;
