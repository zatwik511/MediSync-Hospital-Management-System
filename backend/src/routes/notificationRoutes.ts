import express from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { notificationService } from '../services/NotificationService';

const router = express.Router();

// GET /api/notifications
router.get('/', asyncHandler(async (req, res) => {
    const [notifications, unreadCount] = await Promise.all([
      notificationService.getUnread(req.staffID!),
      notificationService.getUnreadCount(req.staffID!),
    ]);
    res.json({ success: true, data: { notifications, unreadCount } });
}));

// PUT /api/notifications/read-all  (must be before /:id/read)
router.put('/read-all', asyncHandler(async (req, res) => {
    await notificationService.markAllRead(req.staffID!);
    res.json({ success: true });
}));

// PUT /api/notifications/:id/read
router.put('/:id/read', asyncHandler(async (req, res) => {
    await notificationService.markRead(req.params.id, req.staffID!);
    res.json({ success: true });
}));

export default router;
