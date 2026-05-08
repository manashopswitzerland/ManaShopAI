import './config/env'; // validate env first, before anything else
import { connectDatabase } from './config/db';
import { startShopifySyncJob } from './jobs/shopify-sync.job';
import { startEmailPollJob } from './jobs/email-poll.job';
import { env } from './config/env';
import app from './app';

async function bootstrap(): Promise<void> {
  // 1. Connect to MongoDB
  await connectDatabase();

  // 2. Start background jobs
  startShopifySyncJob();
  startEmailPollJob();

  // 3. Start HTTP server
  const port = parseInt(env.PORT, 10);
  app.listen(port, () => {
    console.log(`[Server] Mana AI Hub running on port ${port} (${env.NODE_ENV})`);
  });
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
