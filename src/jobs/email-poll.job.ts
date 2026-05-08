import cron from 'node-cron';
import { pollInbox } from '../services/imap.service';

export function startEmailPollJob(): void {
  // Poll every 3 minutes
  cron.schedule('*/3 * * * *', async () => {
    await pollInbox();
  });

  console.log('[CronJob] Email inbox polling scheduled — runs every 3 minutes');

  // Also run immediately on startup
  pollInbox().catch((err) => console.error('[IMAP] Initial poll error:', err));
}
