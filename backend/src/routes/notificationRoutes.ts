import express, { Request, Response } from 'express';
import { notificationService } from '../services/NotificationService';

const router = express.Router();

// GET /api/notifications
router.get('/', async (req: Request, res: Response) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      notificationService.getUnread(req.staffID!),
      notificationService.getUnreadCount(req.staffID!),
    ]);
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/notifications/read-all  (must be before /:id/read)
router.put('/read-all', async (req: Request, res: Response) => {
  try {
    await notificationService.markAllRead(req.staffID!);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    await notificationService.markRead(req.params.id, req.staffID!);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
