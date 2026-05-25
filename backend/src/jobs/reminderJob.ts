import cron from 'node-cron';
import { reminderService } from '../services/ReminderService';
import logger from '../logger';

export function startReminderJob(): void {
  cron.schedule('0 8 * * *', async () => {
    logger.info('ReminderJob: running daily appointment reminder check');
    try {
      await reminderService.sendReminders();
    } catch (err) {
      logger.error({ err }, 'ReminderJob: unhandled error in reminder run');
    }
  });

  logger.info('ReminderJob: scheduled — daily at 08:00');
}
