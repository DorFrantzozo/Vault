import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Save, ShieldCheck, Smartphone, Check, RefreshCw } from 'lucide-react';
import {
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
  useSubscribeToPushNotificationsMutation,
} from '../store/api/settingsApi.js';
import { useGetVapidPublicKeyQuery, useSendTestPushMutation } from '../store/api/pushApi.js';
import { useModal } from '../components/common/ModalContext.js';

import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';

export default function SettingsPage() {
  const { showAlert } = useModal();
  const { data: settingsData, isLoading } = useGetNotificationSettingsQuery();
  const { data: vapidData } = useGetVapidPublicKeyQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateNotificationSettingsMutation();
  const [subscribeToPush, { isLoading: isSubscribing }] = useSubscribeToPushNotificationsMutation();
  const [sendTestPush, { isLoading: isTesting }] = useSendTestPushMutation();

  const [reminderDaysBefore, setReminderDaysBefore] = useState<number>(3);
  const [remindersPerDay, setRemindersPerDay] = useState<number>(1);
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [testCountdown, setTestCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (settingsData?.data) {
      setReminderDaysBefore(settingsData.data.reminderDaysBefore ?? 3);
      setRemindersPerDay(settingsData.data.remindersPerDay ?? 1);
    }
  }, [settingsData]);

  useEffect(() => {
    if ('Notification' in window) {
      setPushStatus(Notification.permission as any);
    }
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        reminderDaysBefore,
        remindersPerDay,
      }).unwrap();
      await showAlert('ההגדרות שנשמרו בהצלחה!', 'הגדרות התראות', 'success');
    } catch (err) {
      console.error('Failed to update settings:', err);
      await showAlert('אירעה שגיאה בעת שמירת ההגדרות.', 'שגיאה', 'danger');
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      await showAlert('דפדפן זה אינו תומך בהתראות פוש.', 'התראות פוש', 'warning');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission as any);

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || vapidData?.data?.publicKey;

        if (!vapidPublicKey) {
          await showAlert('מפתח VAPID אינו מוגדר. אנא הגדר VITE_VAPID_PUBLIC_KEY בקובץ ה-env.', 'שגיאה', 'danger');
          return;
        }

        // Force unsubscribe from any existing subscription to ensure we register with the new VAPID key
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          await existingSubscription.unsubscribe();
        }

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });

        await subscribeToPush(subscription.toJSON()).unwrap();
        await showAlert('המכשיר נרשם בהצלחה לקבלת התראות פוש!', 'הצלחה', 'success');
      } else if (permission === 'denied') {
        await showAlert('הרשאת התראות נחסמה בדפדפן. יש לאשר התראות בהגדרות הדפדפן.', 'התראות פוש', 'warning');
      }
    } catch (error) {
      console.error('Error setting up push notifications:', error);
      await showAlert('אירעה שגיאה בחיבור התראות הפוש.', 'שגיאה', 'danger');
    }
  };

  const handleSendTestPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      await showAlert('דפדפן זה אינו תומך בהתראות פוש.', 'התראות פוש', 'warning');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        await showAlert('המכשיר אינו רשום לקבלת התראות. אנא לחץ תחילה על "הפעל התראות במכשיר זה".', 'שגיאה', 'danger');
        return;
      }

      await sendTestPush({ subscription: subscription.toJSON() }).unwrap();
      setTestCountdown(8);
      
      const interval = setInterval(() => {
        setTestCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      await showAlert(
        'התראת הבדיקה תוזמנה לעוד 8 שניות! כעת תוכל לנעול את המכשיר או לצאת מהדפדפן כדי לבדוק שהיא מגיעה כראוי.',
        'התראת בדיקה תוזמנה',
        'success'
      );
    } catch (error) {
      console.error('Error sending test push:', error);
      await showAlert('אירעה שגיאה בשיגור התראת הבדיקה.', 'שגיאה', 'danger');
    }
  };

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return (
    <div className="space-y-8 text-[ink-black] pb-8 font-sans" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[ink-black]/10">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-[ink-black] font-heading flex items-center gap-2">
            <Bell className="w-6 h-6 text-[ink-black]" />
            <span>הגדרות התראות ופוש</span>
          </h1>
          <p className="text-xs text-[slate-gray] mt-1 font-sans">
            ניהול תזמון ותדירות התראות פוש עבור חיובי מנויים תקופתיים
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-[slate-gray] text-xs">טוען הגדרות...</div>
      ) : (
        <div className="max-w-2xl space-y-6">
          <Card className="p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Section 1: Reminder Days Before */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[ink-black] font-heading">
                  מספר ימים לפני התראה
                </label>
                <p className="text-xs text-[slate-gray] leading-relaxed">
                  כמה ימים לפני מועד החיוב התקופתי של הלקוח תתחיל המערכת לשלוח התראות פוש?
                </p>
                <div className="flex items-center space-x-3 space-x-reverse pt-2">
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={reminderDaysBefore}
                    onChange={(e) => setReminderDaysBefore(Number(e.target.value))}
                    className="w-24 text-center font-bold"
                  />
                  <span className="text-xs text-[slate-gray] font-medium">ימים לפני מועד החיוב</span>
                </div>
              </div>

              <div className="h-px bg-[ink-black]/10" />

              {/* Section 2: Frequency per Day */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-[ink-black] font-heading">
                  תדירות התראות ביום
                </label>
                <p className="text-xs text-[slate-gray] leading-relaxed">
                  בחר כמה פעמים ביום תשלח המערכת תזכורת פוש במידה והחיוב טרם סומן כשולם
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setRemindersPerDay(1)}
                    className={`flex items-center justify-between p-4 rounded-xl border text-right transition-all ${
                      remindersPerDay === 1
                        ? 'bg-ink-black border-ink-black text-white shadow-xs'
                        : 'bg-lifted-cream border-ink-black/15 text-ink-black hover:border-ink-black/40'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold font-heading">פעם אחת ביום (1)</div>
                      <div className={`text-[10px] mt-0.5 ${remindersPerDay === 1 ? 'text-[#D1CDC7]' : 'text-slate-gray'}`}>התראה יומית בשעה 08:00</div>
                    </div>
                    {remindersPerDay === 1 && (
                      <div className="w-5 h-5 rounded-full bg-lifted-cream text-ink-black flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRemindersPerDay(2)}
                    className={`flex items-center justify-between p-4 rounded-xl border text-right transition-all ${
                      remindersPerDay === 2
                        ? 'bg-ink-black border-ink-black text-white shadow-xs'
                        : 'bg-lifted-cream border-ink-black/15 text-ink-black hover:border-ink-black/40'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold font-heading">פעמיים ביום (2)</div>
                      <div className={`text-[10px] mt-0.5 ${remindersPerDay === 2 ? 'text-[#D1CDC7]' : 'text-slate-gray'}`}>כל 12 שעות (בוקר וערב)</div>
                    </div>
                    {remindersPerDay === 2 && (
                      <div className="w-5 h-5 rounded-full bg-lifted-cream text-ink-black flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              <div className="h-px bg-[ink-black]/10" />

              {/* Section 3: Device Registration */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-[ink-black] font-heading flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[ink-black]" />
                  <span>חיבור מכשיר זה להתראות פוש (PWA)</span>
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-canvas-cream/60 border border-ink-black/10">
                  <div>
                    <div className="text-xs font-medium text-ink-black flex items-center gap-2">
                      <span>סטטוס דפדפן:</span>
                      <Badge variant={pushStatus === 'granted' ? 'default' : 'destructive'}>
                        {pushStatus === 'granted' ? 'פעיל ומורשה' : pushStatus === 'denied' ? 'חסום' : 'טרם אושר'}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-gray mt-1">
                      מכשירים רשומים במערכת: {settingsData?.data?.activeSubscriptionsCount ?? 0}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {pushStatus === 'granted' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSendTestPush}
                        disabled={isTesting || testCountdown !== null}
                        className="w-full sm:w-auto justify-center"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ml-1 ${isTesting || testCountdown !== null ? 'animate-spin' : ''}`} />
                        <span>
                          {testCountdown !== null
                            ? `התראה בעוד ${testCountdown} שניות...`
                            : isTesting
                            ? 'שולח...'
                            : 'בדיקת התראה (8 שניות)'}
                        </span>
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleEnablePushNotifications}
                      disabled={isSubscribing}
                      className="w-full sm:w-auto justify-center"
                    >
                      <BellRing className="w-3.5 h-3.5 text-white ml-1.5" />
                      <span>{isSubscribing ? 'רושם מכשיר...' : 'הפעל התראות במכשיר זה'}</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Save CTA */}
              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="default"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                      <span>שומר הגדרות...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      <span>שמור הגדרות התראה</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* Security & System Info Badge */}
          <div className="flex items-center space-x-2 space-x-reverse text-xs text-[slate-gray] px-2">
            <ShieldCheck className="w-4 h-4 text-[ink-black] shrink-0" />
            <span>ההתראות נשלחות בזמן אמת באמצעות פרוטוקול Web Push תקני וללא תלות בספקי צד ג'.</span>
          </div>
        </div>
      )}
    </div>
  );
}

