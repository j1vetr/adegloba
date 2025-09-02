import webpush from 'web-push';
import { storage } from '../storage';
import type { InsertPushSubscription } from '@shared/schema';

// Web Push VAPID Configuration
// These should be environment variables in production
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BJ2qhSSjDDHuOYWTaqN-EVoRL7zpiaQOrQLyycOW1AtamXwfp-sh48DwfbSFWxY66hBXLB9WGdWp7DBLW8sNIYo';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '__iXqZ6_zS4E8ESwm4xv43dXjNud_1Tcr0_OPN-Ugd0';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'starlink@adegloba.space';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  `mailto:${VAPID_EMAIL}`,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  url?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
}

export class PushNotificationService {
  
  /**
   * Subscribe a user to push notifications
   */
  static async subscribeUser(
    userId: string, 
    subscription: PushSubscriptionJSON,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
        throw new Error('Invalid push subscription object');
      }

      // Remove existing subscriptions for this user with same endpoint
      await storage.deletePushSubscriptionsForUser(userId, subscription.endpoint);

      // Create new subscription
      const insertData: InsertPushSubscription = {
        userId,
        endpoint: subscription.endpoint,
        p256dhKey: subscription.keys.p256dh,
        authKey: subscription.keys.auth,
        userAgent,
        ipAddress,
        isActive: true
      };

      await storage.createPushSubscription(insertData);
      console.log(`📱 Push subscription created for user ${userId}`);
      
    } catch (error) {
      console.error('🚨 Error subscribing user to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe a user from push notifications
   */
  static async unsubscribeUser(userId: string, endpoint?: string): Promise<void> {
    try {
      await storage.deletePushSubscriptionsForUser(userId, endpoint);
      console.log(`📱 Push subscription removed for user ${userId}`);
    } catch (error) {
      console.error('🚨 Error unsubscribing user from push notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification to a specific user
   */
  static async sendToUser(userId: string, payload: PushNotificationPayload): Promise<void> {
    try {
      const subscriptions = await storage.getPushSubscriptionsForUser(userId);
      
      if (subscriptions.length === 0) {
        console.log(`📱 No push subscriptions found for user ${userId}`);
        return;
      }

      const results = await Promise.allSettled(
        subscriptions.map(sub => this.sendNotification(sub, payload))
      );

      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`📢 Push notification sent to user ${userId}: ${successful} successful, ${failed} failed`);
      
    } catch (error) {
      console.error(`🚨 Error sending push notification to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send notification to all users
   */
  static async sendToAllUsers(payload: PushNotificationPayload): Promise<void> {
    try {
      const subscriptions = await storage.getAllActivePushSubscriptions();
      
      if (subscriptions.length === 0) {
        console.log('📱 No active push subscriptions found');
        return;
      }

      const results = await Promise.allSettled(
        subscriptions.map(sub => this.sendNotification(sub, payload))
      );

      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`📢 Broadcast push notification sent: ${successful} successful, ${failed} failed to ${subscriptions.length} subscriptions`);
      
    } catch (error) {
      console.error('🚨 Error broadcasting push notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to users of specific ships
   */
  static async sendToShipUsers(shipIds: string[], payload: PushNotificationPayload): Promise<void> {
    try {
      const subscriptions = await storage.getPushSubscriptionsForShips(shipIds);
      
      if (subscriptions.length === 0) {
        console.log(`📱 No push subscriptions found for ships: ${shipIds.join(', ')}`);
        return;
      }

      const results = await Promise.allSettled(
        subscriptions.map(sub => this.sendNotification(sub, payload))
      );

      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`📢 Ship notification sent: ${successful} successful, ${failed} failed`);
      
    } catch (error) {
      console.error('🚨 Error sending ship notifications:', error);
      throw error;
    }
  }

  /**
   * Send a single push notification
   */
  private static async sendNotification(
    subscription: any, 
    payload: PushNotificationPayload
  ): Promise<void> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dhKey,
          auth: subscription.authKey
        }
      };

      // Prepare notification payload
      const notificationPayload = {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/pwa-icon-192.png',
        badge: payload.badge || '/pwa-icon-192.png',
        image: payload.image,
        data: {
          url: payload.url || '/',
          timestamp: Date.now(),
          ...payload.data
        },
        actions: payload.actions || [
          {
            action: 'open',
            title: 'Aç',
            icon: '/pwa-icon-192.png'
          },
          {
            action: 'close', 
            title: 'Kapat'
          }
        ],
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        tag: payload.tag || 'adegloba-notification'
      };

      // Send notification
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(notificationPayload),
        {
          urgency: 'normal',
          TTL: 86400 // 24 hours
        }
      );

    } catch (error: any) {
      // Handle subscription errors
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription expired or invalid, remove it
        console.log(`📱 Removing invalid push subscription: ${subscription.endpoint}`);
        await storage.deactivatePushSubscription(subscription.id);
      } else {
        console.error('🚨 Push notification send error:', error);
        throw error;
      }
    }
  }

  /**
   * Get public VAPID key for client subscription
   */
  static getPublicKey(): string {
    return VAPID_PUBLIC_KEY;
  }

  /**
   * Test notification function
   */
  static async sendTestNotification(userId: string): Promise<void> {
    const payload: PushNotificationPayload = {
      title: '🚢 AdeGloba Starlink Test',
      body: 'Push bildirimi sistemi başarıyla kuruldu!',
      icon: '/pwa-icon-192.png',
      data: { test: true },
      url: '/dashboard'
    };

    await this.sendToUser(userId, payload);
  }
}

export default PushNotificationService;