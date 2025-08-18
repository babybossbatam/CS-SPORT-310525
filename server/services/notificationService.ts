
import { db } from '../db';
import { notifications, notificationPreferences, users } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

interface NotificationData {
  matchId?: string;
  leagueId?: string;
  teamId?: string;
  fixtureId?: string;
}

export class NotificationService {
  // Send email notification using Nodemailer (example with Gmail)
  private async sendEmail(to: string, subject: string, message: string): Promise<boolean> {
    try {
      // Example using Nodemailer with Gmail
      // You'll need to install: npm install nodemailer
      // And set up environment variables: EMAIL_USER, EMAIL_PASS
      
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS // Use App Password for Gmail
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #3b82f6;">CS Sport Notification</h2>
            <p>${message}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              You received this because you have notifications enabled in your CS Sport account.
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`📧 Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // Send SMS notification using Twilio
  private async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      // Example using Twilio
      // You'll need to install: npm install twilio
      // And set up environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
      
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

      await client.messages.create({
        body: `⚽ CS Sport: ${message}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });

      console.log(`📱 SMS sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }

  // Send push notification (placeholder - integrate with push service)
  private async sendPush(userId: number, title: string, message: string): Promise<boolean> {
    try {
      // TODO: Integrate with push service (Firebase, OneSignal, etc.)
      console.log(`🔔 Push sent to user ${userId}: ${title} - ${message}`);
      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  // Create and send notification
  async sendNotification(
    userId: number,
    type: 'email' | 'sms' | 'push',
    title: string,
    message: string,
    data?: NotificationData
  ): Promise<void> {
    try {
      // Get user and preferences
      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user.length) {
        throw new Error('User not found');
      }

      const prefs = await db.select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId))
        .limit(1);

      // Check if user has enabled this notification type
      const preferences = prefs[0];
      if (preferences) {
        if (type === 'email' && !preferences.emailNotifications) return;
        if (type === 'sms' && !preferences.smsNotifications) return;
        if (type === 'push' && !preferences.pushNotifications) return;
      }

      // Create notification record
      const [notification] = await db.insert(notifications)
        .values({
          userId,
          type,
          title,
          message,
          data,
          status: 'pending'
        })
        .returning();

      let success = false;

      // Send based on type
      switch (type) {
        case 'email':
          success = await this.sendEmail(user[0].email, title, message);
          break;
        case 'sms':
          if (user[0].phoneNumber) {
            success = await this.sendSMS(user[0].phoneNumber, message);
          }
          break;
        case 'push':
          success = await this.sendPush(userId, title, message);
          break;
      }

      // Update notification status
      await db.update(notifications)
        .set({
          status: success ? 'sent' : 'failed',
          sentAt: success ? new Date() : undefined
        })
        .where(eq(notifications.id, notification.id));

    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Send match start notifications
  async sendMatchStartNotifications(fixtureId: string, homeTeam: string, awayTeam: string): Promise<void> {
    try {
      // Get users who want match start notifications
      const usersToNotify = await db.select({
        userId: users.id,
        email: users.email,
        phoneNumber: users.phoneNumber,
        emailNotifications: notificationPreferences.emailNotifications,
        smsNotifications: notificationPreferences.smsNotifications,
        pushNotifications: notificationPreferences.pushNotifications,
        matchStart: notificationPreferences.matchStart
      })
      .from(users)
      .leftJoin(notificationPreferences, eq(users.id, notificationPreferences.userId))
      .where(eq(notificationPreferences.matchStart, true));

      const title = 'Match Starting Now!';
      const message = `${homeTeam} vs ${awayTeam} is about to begin`;

      for (const user of usersToNotify) {
        // Send notifications based on user preferences
        if (user.emailNotifications) {
          await this.sendNotification(user.userId, 'email', title, message, { fixtureId });
        }
        if (user.smsNotifications) {
          await this.sendNotification(user.userId, 'sms', title, message, { fixtureId });
        }
        if (user.pushNotifications) {
          await this.sendNotification(user.userId, 'push', title, message, { fixtureId });
        }
      }
    } catch (error) {
      console.error('Error sending match start notifications:', error);
    }
  }

  // Send goal notifications
  async sendGoalNotifications(fixtureId: string, homeTeam: string, awayTeam: string, goalInfo: string): Promise<void> {
    try {
      const usersToNotify = await db.select({
        userId: users.id,
        email: users.email,
        phoneNumber: users.phoneNumber,
        emailNotifications: notificationPreferences.emailNotifications,
        smsNotifications: notificationPreferences.smsNotifications,
        pushNotifications: notificationPreferences.pushNotifications,
        goals: notificationPreferences.goals
      })
      .from(users)
      .leftJoin(notificationPreferences, eq(users.id, notificationPreferences.userId))
      .where(eq(notificationPreferences.goals, true));

      const title = 'GOAL!';
      const message = `${goalInfo} in ${homeTeam} vs ${awayTeam}`;

      for (const user of usersToNotify) {
        if (user.emailNotifications) {
          await this.sendNotification(user.userId, 'email', title, message, { fixtureId });
        }
        if (user.smsNotifications) {
          await this.sendNotification(user.userId, 'sms', title, message, { fixtureId });
        }
        if (user.pushNotifications) {
          await this.sendNotification(user.userId, 'push', title, message, { fixtureId });
        }
      }
    } catch (error) {
      console.error('Error sending goal notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();
