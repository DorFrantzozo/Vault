import { Request, Response, NextFunction } from 'express';
import { getOrCreateUserSettings } from '../models/UserSettings.js';
import { PushSubscription } from '../models/PushSubscription.js';
import { AppError } from '../utils/AppError.js';

export const getNotificationSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await getOrCreateUserSettings();
    res.status(200).json({
      status: 'success',
      data: {
        reminderDaysBefore: settings.reminderDaysBefore,
        remindersPerDay: settings.remindersPerDay,
        activeSubscriptionsCount: settings.pushSubscriptions ? settings.pushSubscriptions.length : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateNotificationSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reminderDaysBefore, remindersPerDay } = req.body;

    const settings = await getOrCreateUserSettings();

    if (typeof reminderDaysBefore === 'number' && reminderDaysBefore >= 1 && reminderDaysBefore <= 30) {
      settings.reminderDaysBefore = reminderDaysBefore;
    }

    if (remindersPerDay === 1 || remindersPerDay === 2) {
      settings.remindersPerDay = remindersPerDay;
    }

    await settings.save();

    res.status(200).json({
      status: 'success',
      data: {
        reminderDaysBefore: settings.reminderDaysBefore,
        remindersPerDay: settings.remindersPerDay,
        activeSubscriptionsCount: settings.pushSubscriptions ? settings.pushSubscriptions.length : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const subscribeNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return next(new AppError('Invalid push subscription object', 400));
    }

    const settings = await getOrCreateUserSettings();
    if (!settings.pushSubscriptions) {
      settings.pushSubscriptions = [];
    }

    // Check if endpoint already exists in UserSettings pushSubscriptions array
    const existingIndex = settings.pushSubscriptions.findIndex(
      (sub) => sub.endpoint === subscription.endpoint
    );

    if (existingIndex > -1) {
      settings.pushSubscriptions[existingIndex] = subscription;
    } else {
      settings.pushSubscriptions.push(subscription);
    }

    await settings.save();

    // Sync with PushSubscription collection for backwards compatibility
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      subscription,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      status: 'success',
      message: 'Push subscription saved successfully.',
      data: { activeSubscriptionsCount: settings.pushSubscriptions.length },
    });
  } catch (error) {
    next(error);
  }
};
