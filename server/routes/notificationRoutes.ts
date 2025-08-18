
import express from 'express';
import { db } from '../db';
import { notifications, notificationPreferences } from '../../shared/schema';
import { eq, desc } from 'drizzle-orm';
import { notificationService } from '../services/notificationService';

const router = express.Router();

// Get user notifications
router.get('/api/notifications/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const userNotifications = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    res.json(userNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get user notification preferences
router.get('/api/notification-preferences/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const preferences = await db.select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    if (preferences.length === 0) {
      // Create default preferences
      const [defaultPrefs] = await db.insert(notificationPreferences)
        .values({ userId })
        .returning();
      
      res.json(defaultPrefs);
    } else {
      res.json(preferences[0]);
    }
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

// Update notification preferences
router.put('/api/notification-preferences/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const updates = req.body;

    const [updatedPrefs] = await db.update(notificationPreferences)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(notificationPreferences.userId, userId))
      .returning();

    res.json(updatedPrefs);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// Send test notification
router.post('/api/notifications/test/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { type, title, message } = req.body;

    await notificationService.sendNotification(userId, type, title, message);
    
    res.json({ success: true, message: 'Test notification sent' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Mark notification as read
router.put('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.notificationId);

    await db.update(notifications)
      .set({ status: 'read' })
      .where(eq(notifications.id, notificationId));

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

export default router;
