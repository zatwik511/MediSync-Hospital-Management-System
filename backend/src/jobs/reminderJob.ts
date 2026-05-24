import cron from 'node-cron';
import { reminderService } from '../services/ReminderService';

export function startReminderJob(): void {
  // Daily at 08:00 server local time
  cron.schedule('0 8 * * *', async () => {
    console.log('[ReminderJob] Running daily appointment reminder check...');
    try {
      await reminderService.sendReminders();
    } catch (err) {
      console.error('[ReminderJob] Unhandled error in reminder run:', err);
    }
  });

  console.log('[ReminderJob] Scheduled — daily at 08:00');
}
