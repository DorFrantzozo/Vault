import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Save, ShieldCheck, Smartphone, Check, RefreshCw } from 'lucide-react';
import {
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
  useSubscribeToPushNotificationsMutation,
} from '../store/api/settingsApi.js';
import { useGetVapidPublicKeyQuery, useSendTestPushMutation } from '../store/api/pushApi.js';
import { useModal } from '../components/common/ModalContext.js';

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
    <div className="space-y-6 text-white pb-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-[#6B51FF]" />
            <span>הגדרות התראות ופוש</span>
          </h1>
          <p className="text-xs text-[#8A879E] mt-0.5">
            ניהול תזמון ותדירות התראות פוש עבור חיובי מנויים תקופתיים
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-[#8A879E] text-xs">טוען הגדרות...</div>
      ) : (
        <div className="max-w-2xl space-y-6">
          {/* Deep Space Glass Container */}
          <form
            onSubmit={handleSaveSettings}
            className="bg-[#1A1826]/60 backdrop-blur-xl border border-white/[0.05] rounded-[1.25rem] shadow-2xl p-6 space-y-6"
          >
            {/* Section 1: Reminder Days Before */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white">
                מספר ימים לפני התראה
              </label>
              <p className="text-xs text-[#8A879E] leading-relaxed">
                כמה ימים לפני מועד החיוב התקופתי של הלקוח תתחיל המערכת לשלוח התראות פוש?
              </p>
              <div className="flex items-center space-x-3 space-x-reverse pt-2">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={reminderDaysBefore}
                  onChange={(e) => setReminderDaysBefore(Number(e.target.value))}
                  className="w-24 bg-[#12101D] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-bold text-center focus:outline-none focus:border-[#6B51FF] transition-all"
                />
                <span className="text-xs text-[#8A879E] font-medium">ימים לפני מועד החיוב</span>
              </div>
            </div>

            <div className="h-px bg-white/[0.05]" />

            {/* Section 2: Frequency per Day */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white">
                תדירות התראות ביום
              </label>
              <p className="text-xs text-[#8A879E] leading-relaxed">
                בחר כמה פעמים ביום תשלח המערכת תזכורת פוש במידה והחיוב טרם סומן כשולם
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setRemindersPerDay(1)}
                  className={`flex items-center justify-between p-4 rounded-xl border text-right transition-all ${
                    remindersPerDay === 1
                      ? 'bg-[#6B51FF]/15 border-[#6B51FF] text-white shadow-lg shadow-[#6B51FF]/10'
                      : 'bg-[#12101D]/60 border-white/[0.05] text-[#8A879E] hover:border-white/10 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">פעם אחת ביום (1)</div>
                    <div className="text-[10px] text-[#8A879E] mt-0.5">התראה יומית בשעה 08:00</div>
                  </div>
                  {remindersPerDay === 1 && (
                    <div className="w-5 h-5 rounded-full bg-[#6B51FF] flex items-center justify-center text-white">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setRemindersPerDay(2)}
                  className={`flex items-center justify-between p-4 rounded-xl border text-right transition-all ${
                    remindersPerDay === 2
                      ? 'bg-[#6B51FF]/15 border-[#6B51FF] text-white shadow-lg shadow-[#6B51FF]/10'
                      : 'bg-[#12101D]/60 border-white/[0.05] text-[#8A879E] hover:border-white/10 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">פעמיים ביום (2)</div>
                    <div className="text-[10px] text-[#8A879E] mt-0.5">כל 12 שעות (בוקר וערב)</div>
                  </div>
                  {remindersPerDay === 2 && (
                    <div className="w-5 h-5 rounded-full bg-[#6B51FF] flex items-center justify-center text-white">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div className="h-px bg-white/[0.05]" />

            {/* Section 3: Device Registration */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#6B51FF]" />
                <span>חיבור מכשיר זה להתראות פוש (PWA)</span>
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#12101D]/80 border border-white/[0.05]">
                <div>
                  <div className="text-xs font-medium text-white flex items-center gap-2">
                    <span>סטטוס דפדפן:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        pushStatus === 'granted'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : pushStatus === 'denied'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {pushStatus === 'granted' ? 'פעיל ומורשה' : pushStatus === 'denied' ? 'חסום' : 'טרם אושר'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8A879E] mt-1">
                    מכשירים רשומים במערכת: {settingsData?.data?.activeSubscriptionsCount ?? 0}
                  </p>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  {pushStatus === 'granted' && (
                    <button
                      type="button"
                      onClick={handleSendTestPush}
                      disabled={isTesting || testCountdown !== null}
                      className="flex items-center justify-center space-x-1.5 space-x-reverse px-4 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-xs font-semibold text-[#6B51FF] border border-[#6B51FF]/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTesting || testCountdown !== null ? 'animate-spin' : ''}`} />
                      <span>
                        {testCountdown !== null
                          ? `התראה בעוד ${testCountdown} שניות...`
                          : isTesting
                          ? 'שולח...'
                          : 'בדיקת התראה (8 שניות)'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleEnablePushNotifications}
                    disabled={isSubscribing}
                    className="flex items-center justify-center space-x-1.5 space-x-reverse px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <BellRing className="w-3.5 h-3.5 text-[#6B51FF]" />
                    <span>{isSubscribing ? 'רושם מכשיר...' : 'הפעל התראות במכשיר זה'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Save CTA */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isUpdating}
                className="flex items-center space-x-2 space-x-reverse bg-[#6B51FF] hover:bg-[#5A41D9] text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-[#6B51FF]/25 transition-all text-xs active:scale-95 disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>שומר הגדרות...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>שמור הגדרות התראה</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security & System Info Badge */}
          <div className="flex items-center space-x-2 space-x-reverse text-xs text-[#8A879E] px-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ההתראות נשלחות בזמן אמת באמצעות פרוטוקול Web Push תקני וללא תלות בספקי צד ג'.</span>
          </div>
        </div>
      )}
    </div>
  );
}
