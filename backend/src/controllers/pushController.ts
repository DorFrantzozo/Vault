import { Request, Response, NextFunction } from 'express';
import { PushSubscription } from '../models/PushSubscription.js';
import webpush from 'web-push';
import { AppError } from '../utils/AppError.js';

export const subscribeToPush = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subscription = req.body;
    
    // Create or update subscription (using endpoint as unique key)
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      subscription,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ status: 'success', message: 'Subscribed successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getVapidPublicKey = (req: Request, res: Response): void => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    res.status(500).json({ status: 'error', message: 'VAPID keys not configured on server.' });
    return;
  }
  res.status(200).json({ status: 'success', data: { publicKey } });
};

export const sendTestNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      res.status(400).json({ status: 'error', message: 'No subscription provided' });
      return;
    }

    // Immediately reply to user so they can close the app / lock the screen
    res.status(200).json({ status: 'success', message: 'Test notification scheduled in 8 seconds.' });

    // Set 8-second delay before sending push
    setTimeout(async () => {
      try {
        const payload = JSON.stringify({
          title: '🔔 התראת בדיקה!',
          body: 'זהו חיבור בדיקה מאובטח של התראות הפוש. המערכת מוכנה!',
        });

        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          },
          payload
        );
        console.log('[PUSH] Test notification successfully sent to endpoint:', subscription.endpoint);
      } catch (err) {
        console.error('[PUSH] Failed to send test notification:', err);
      }
    }, 8000);
  } catch (error) {
    next(error);
  }
};
