import cron from 'node-cron';
import { shopifyService } from '../services/shopify.service';

// Runs every 6 hours: at 0 minutes, every 6th hour
const CRON_EXPRESSION = '0 */6 * * *';

export function startShopifySyncJob(): void {
  cron.schedule(CRON_EXPRESSION, async () => {
    const startTime = new Date().toISOString();
    console.log(`[CronJob] Shopify sync started at ${startTime}`);

    try {
      const results = await shopifyService.syncAllStores();
      const endTime = new Date().toISOString();
      console.log(`[CronJob] Shopify sync completed at ${endTime}`, results);
    } catch (err) {
      console.error('[CronJob] Shopify sync failed:', err);
    }
  });

  console.log(`[CronJob] Shopify sync scheduled — runs every 6 hours (${CRON_EXPRESSION})`);
}
