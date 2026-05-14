import express from 'express';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './middlewares/errorHandler';
import whatsappRoute from './routes/whatsapp.route';
import chatRoute from './routes/chat.route';
import emailRoute from './routes/email.route';
import syncRoute from './routes/sync.route';
import shopifyAuthRoute from './routes/shopify-auth.route';
import dashboardRoute from './routes/dashboard.route';
import knowledgeRoute from './routes/knowledge.route';
import notificationsRoute from './routes/notifications.route';
import leadsRoute from './routes/leads.route';

const app = express();

// CORS — allow Shopify storefronts and any origin for the widget
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));

// Body parsers — urlencoded required for Twilio + SendGrid Inbound Parse
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// API routes BEFORE static — express.static in Express 5 returns 405
// for POST requests on matched paths if placed first.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/webhooks/whatsapp', whatsappRoute);
app.use('/chat/web', chatRoute);
app.use('/webhooks/email', emailRoute);
app.use('/admin/sync-shopify', syncRoute);
app.use('/auth/shopify', shopifyAuthRoute);
app.use('/api/dashboard',      dashboardRoute);
app.use('/api/knowledge',      knowledgeRoute);
app.use('/api/notifications',  notificationsRoute);
app.use('/api/leads',          leadsRoute);

// Static files AFTER API routes
app.use(express.static(path.join(__dirname, '..', 'public')));

// Global error handler — must be last
app.use(errorHandler);

export default app;
