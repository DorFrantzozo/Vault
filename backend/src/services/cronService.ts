import cron from 'node-cron';
import webpush from 'web-push';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { RecurringBilling, IRecurringBilling } from '../models/RecurringBilling.js';
import { PushSubscription } from '../models/PushSubscription.js';
import { UserSettings, getOrCreateUserSettings } from '../models/UserSettings.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = 'Asia/Jerusalem';

export const initCronJobs = () => {
  // Run hourly at top of the hour
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running hourly push notification check...');
    try {
      const settings = await getOrCreateUserSettings();
      const nowIL = dayjs().tz(TIMEZONE);

      // Reminder date window calculated strictly in Asia/Jerusalem timezone
      const startOfToday = nowIL.startOf('day').toDate();
      const endOfWindow = nowIL.add(settings.reminderDaysBefore, 'day').endOf('day').toDate();

      // Query active billings whose next billing date falls within the reminder window
      const eligibleBillings = await RecurringBilling.find({
        isActive: true,
        nextBillingDate: {
          $gte: startOfToday,
          $lte: endOfWindow,
        },
      });

      if (eligibleBillings.length === 0) {
        console.log('[CRON] No upcoming billings within notification window.');
        return;
      }

      // Filter billings based on lastNotifiedAt and remindersPerDay
      const billingsToNotify: IRecurringBilling[] = [];

      for (const billing of eligibleBillings) {
        if (!billing.lastNotifiedAt) {
          billingsToNotify.push(billing);
          continue;
        }

        const lastNotifiedIL = dayjs(billing.lastNotifiedAt).tz(TIMEZONE);

        if (settings.remindersPerDay === 1) {
          // If 1 reminder/day, check if last notification was before start of today in IL time
          if (lastNotifiedIL.isBefore(nowIL.startOf('day'))) {
            billingsToNotify.push(billing);
          }
        } else if (settings.remindersPerDay === 2) {
          // If 2 reminders/day, check if at least 12 hours have passed since last notification
          const hoursSinceLast = nowIL.diff(lastNotifiedIL, 'hour');
          if (hoursSinceLast >= 12) {
            billingsToNotify.push(billing);
          }
        }
      }

      if (billingsToNotify.length === 0) {
        console.log('[CRON] All eligible billings already notified for current cycle.');
        return;
      }

      console.log(`[CRON] Dispatching push notifications for ${billingsToNotify.length} billing(s)...`);

      // Gather subscriptions from UserSettings and standalone PushSubscriptions
      const dbPushSubs = await PushSubscription.find();
      const allSubscriptionsMap = new Map<string, { endpoint: string; keys: { p256dh: string; auth: string } }>();

      // Add subscriptions from UserSettings pushSubscriptions
      if (settings.pushSubscriptions) {
        for (const sub of settings.pushSubscriptions) {
          if (sub.endpoint && sub.keys?.p256dh && sub.keys?.auth) {
            allSubscriptionsMap.set(sub.endpoint, sub);
          }
        }
      }

      // Add subscriptions from PushSubscription model
      for (const sub of dbPushSubs) {
        if (sub.endpoint && sub.keys?.p256dh && sub.keys?.auth) {
          allSubscriptionsMap.set(sub.endpoint, sub);
        }
      }

      const subscriptions = Array.from(allSubscriptionsMap.values());

      if (subscriptions.length === 0) {
        console.log('[CRON] No push subscriptions found to notify.');
        return;
      }

      for (const billing of billingsToNotify) {
        const daysUntil = dayjs(billing.nextBillingDate).tz(TIMEZONE).diff(nowIL.startOf('day'), 'day');
        const dateStr = dayjs(billing.nextBillingDate).tz(TIMEZONE).format('DD/MM/YYYY');
        
        let title = 'תזכורת חיוב קרוב';
        let body = `הלקוח ${billing.clientName} אמור לשלם ${billing.amount}₪ עבור ${billing.serviceDescription || 'מנוי תקופתי'} בתאריך ${dateStr}`;
        
        if (daysUntil === 0) {
          title = '🚨 חיוב תקופתי היום!';
          body = `היום הוא מועד החיוב של ${billing.clientName} בסך ${billing.amount}₪ עבור ${billing.serviceDescription || 'מנוי תקופתי'}`;
        }

        const payload = JSON.stringify({ title, body });

        const notifications = subscriptions.map((sub) =>
          webpush
            .sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.keys.p256dh,
                  auth: sub.keys.auth,
                },
              },
              payload
            )
            .catch(async (err) => {
              console.error(`[CRON] Push failed for endpoint: ${sub.endpoint}`, err);
              if (err.statusCode === 410 || err.statusCode === 404) {
                console.log(`[CRON] Removing dead subscription (HTTP ${err.statusCode}): ${sub.endpoint}`);
                // Remove expired subscription from UserSettings.pushSubscriptions array
                await UserSettings.updateMany(
                  {},
                  { $pull: { pushSubscriptions: { endpoint: sub.endpoint } } }
                );
                // Remove expired subscription from PushSubscription collection
                await PushSubscription.deleteMany({ endpoint: sub.endpoint });
              }
            })
        );

        await Promise.allSettled(notifications);

        // Update lastNotifiedAt to prevent duplicate notifications in current cycle
        billing.lastNotifiedAt = new Date();
        await billing.save();
      }

      console.log('[CRON] Hourly push notification check completed.');
    } catch (error) {
      console.error('[CRON] Error running hourly billing check:', error);
    }
  }, {
    timezone: TIMEZONE,
  });
};
