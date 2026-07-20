import { useMemo, useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CalendarDays,
  CreditCard,
  ArrowUpRight,
  Activity,
  Plus,
  CalendarOff,
  BellRing,
  CheckCircle,
  X
} from 'lucide-react';
import {
  useGetTransactionSummaryQuery,
  useGetTransactionsQuery,
} from '../store/api/transactionApi.js';
import { useGetEventsQuery } from '../store/api/eventApi.js';
import {
  useGetUpcomingBillingsQuery,
  useGetBillingsQuery,
  useCreateBillingMutation,
  useUpdateBillingMutation,
  useDeleteBillingMutation,
  useMarkBillingAsPaidMutation,
  IRecurringBilling
} from '../store/api/billingApi.js';
import {
  useGetVapidPublicKeyQuery,
  useSubscribeToPushMutation
} from '../store/api/pushApi.js';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store.js';
import { Link, useNavigate } from 'react-router-dom';
import { ITransaction, IServiceEvent } from '../types/api.js';
import { ServiceBreakdownChart } from '../components/dashboard/ServiceBreakdownChart.js';

import { useModal } from '../components/common/ModalContext.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { confirm, showAlert } = useModal();

  // Queries
  const { data: summaryData, isLoading: summaryLoading } = useGetTransactionSummaryQuery();
  const { data: recentTransData } = useGetTransactionsQuery();
  const { data: eventsData } = useGetEventsQuery();
  const { data: upcomingBillingsData } = useGetUpcomingBillingsQuery();
  const { data: allBillingsData } = useGetBillingsQuery();
  const { data: vapidData } = useGetVapidPublicKeyQuery();
  
  // Mutations
  const [createBilling, { isLoading: isCreatingBilling }] = useCreateBillingMutation();
  const [updateBilling, { isLoading: isUpdatingBilling }] = useUpdateBillingMutation();
  const [deleteBilling] = useDeleteBillingMutation();
  const [markBillingAsPaid] = useMarkBillingAsPaidMutation();
  const [subscribeToPush] = useSubscribeToPushMutation();

  const summary = summaryData?.data?.summary;
  const allTransactions = recentTransData?.data?.transactions || [];
  const upcomingEvents = eventsData?.data?.events?.slice(0, 5) || [];
  const upcomingBillings = upcomingBillingsData?.data?.billings || [];
  const allBillings = allBillingsData?.data?.billings || [];

  // Local State
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [editingBillingId, setEditingBillingId] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied'>('default');

  // Billing Form State
  const [bClientName, setBClientName] = useState('');
  const [bDesc, setBDesc] = useState('');
  const [bAmount, setBAmount] = useState<number | ''>('');
  const [bCycle, setBCycle] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [bNextDate, setBNextDate] = useState('');
  
  useEffect(() => {
    if ('Notification' in window) {
      setPushStatus(Notification.permission as any);
    }
  }, []);

  const formatCurrency = (val?: number) =>
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(val || 0);

  // Push Notification Subscription
  const handleEnablePush = async () => {
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
          await showAlert('מפתחות VAPID אינם זמינים כרגע. אנא הגדר VITE_VAPID_PUBLIC_KEY בקובץ ה-env.', 'שגיאה', 'danger');
          return;
        }

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        await subscribeToPush(subscription.toJSON()).unwrap();
        await showAlert('נרשמת בהצלחה לקבלת התראות פוש!', 'הצלחה', 'success');
      }
    } catch (error) {
      console.error('Push setup error:', error);
      await showAlert('אירעה שגיאה בעת ההרשמה להתראות.', 'שגיאה', 'danger');
    }
  };

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Chart Data
  const chartData = useMemo(() => {
    const months: { label: string; income: number; expense: number; month: number; year: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString('he-IL', { month: 'short' }),
        income: 0,
        expense: 0,
        month: d.getMonth(),
        year: d.getFullYear(),
      });
    }

    allTransactions.forEach((tx: ITransaction) => {
      const txDate = new Date(tx.date);
      const dataPoint = months.find(m => m.month === txDate.getMonth() && m.year === txDate.getFullYear());
      if (dataPoint) {
        if (tx.type === 'Income') dataPoint.income += tx.amount;
        else if (tx.type === 'Expense') dataPoint.expense += tx.amount;
      }
    });

    const maxVal = Math.max(...months.map(m => Math.max(m.income, m.expense)), 1000);
    return { months, maxVal };
  }, [allTransactions]);

  const handleCreateClick = () => {
    navigate('/ledger');
  };

  // Billing Modal Handlers
  const openNewBillingModal = () => {
    setEditingBillingId(null);
    setBClientName('');
    setBDesc('');
    setBAmount('');
    setBCycle('Monthly');
    setBNextDate(new Date().toISOString().split('T')[0]);
    setIsBillingModalOpen(true);
  };

  const openEditBillingModal = (b: IRecurringBilling) => {
    setEditingBillingId(b._id);
    setBClientName(b.clientName);
    setBDesc(b.serviceDescription);
    setBAmount(b.amount);
    setBCycle(b.billingCycle);
    setBNextDate(new Date(b.nextBillingDate).toISOString().split('T')[0]);
    setIsBillingModalOpen(true);
  };

  const saveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bClientName || !bAmount || !bNextDate) return;

    try {
      const payload = {
        clientName: bClientName,
        serviceDescription: bDesc,
        amount: Number(bAmount),
        billingCycle: bCycle,
        nextBillingDate: new Date(bNextDate).toISOString()
      };

      if (editingBillingId) {
        await updateBilling({ id: editingBillingId, ...payload }).unwrap();
      } else {
        await createBilling(payload).unwrap();
      }
      setIsBillingModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBillingHandler = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'מחיקת חיוב תקופתי',
      message: 'האם אתה בטוח שברצונך למחוק חיוב תקופתי זה?',
      confirmText: 'מחק חיוב',
      type: 'danger',
    });

    if (isConfirmed) {
      await deleteBilling(id).unwrap();
      if (editingBillingId === id) setIsBillingModalOpen(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'סימון חיוב כשולם',
      message: 'האם אתה בטוח שברצונך לסמן חיוב זה כשולם? הפעולה תקדם את תאריך החיוב הבא מחזור אחד קדימה.',
      confirmText: 'סמן כשולם',
      type: 'success',
    });

    if (isConfirmed) {
      await markBillingAsPaid(id).unwrap();
    }
  };

  return (
    <div className="space-y-6 text-zinc-100 pb-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800/80">
        <div className="text-right">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>לוח בקרה</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            שלום <span className="font-semibold text-indigo-300">{user?.username || 'מנהל'}</span>, סקירה כספית ותפעולית בזמן אמת
          </p>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse self-start sm:self-auto">
          {pushStatus !== 'granted' && (
            <button
              onClick={handleEnablePush}
              className="flex items-center space-x-1.5 space-x-reverse bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold px-3.5 py-2 rounded-lg transition-all text-xs border border-zinc-700 active:scale-95"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span>הפעל התראות</span>
            </button>
          )}

          <button
            onClick={openNewBillingModal}
            className="flex items-center space-x-1.5 space-x-reverse bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold px-3.5 py-2 rounded-lg transition-all text-xs border border-zinc-700 active:scale-95"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>הוסף מעקב חיוב</span>
          </button>

          <button
            onClick={handleCreateClick}
            className="flex items-center space-x-1.5 space-x-reverse bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-4 py-2 rounded-lg shadow-md shadow-indigo-500/20 transition-all text-xs border border-indigo-400/20 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>יצירה</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#12131c] border border-zinc-800/90 rounded-xl p-4 shadow-md shadow-black/40 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">הכנסה חודשית</p>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              {summaryLoading ? '...' : formatCurrency(summary?.monthlyIncome)}
            </h3>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-[#12131c] border border-zinc-800/90 rounded-xl p-4 shadow-md shadow-black/40 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">הוצאות חודשיות</p>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              {summaryLoading ? '...' : formatCurrency(summary?.monthlyExpenses)}
            </h3>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-[#12131c] border border-zinc-800/90 rounded-xl p-4 shadow-md shadow-black/40 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">הכנסות שנתיות</p>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              {summaryLoading ? '...' : formatCurrency(summary?.annualIncome)}
            </h3>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-[#12131c] border border-zinc-800/90 rounded-xl p-4 shadow-md shadow-black/40 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">רווח שנתי נקי</p>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              {summaryLoading ? '...' : formatCurrency(summary?.annualNet)}
            </h3>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-200">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Row 2: 12-Month Bar Chart & Service Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-[#12131c] border border-zinc-800/90 rounded-xl p-5 shadow-md shadow-black/40 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">הכנסות מול הוצאות</h3>
              <p className="text-xs text-zinc-400 mt-0.5">נתונים כספיים ל-12 החודשים האחרונים</p>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse text-xs font-medium">
              <div className="flex items-center space-x-1.5 space-x-reverse px-2.5 py-1 rounded-full bg-zinc-950/80 border border-zinc-800">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span>
                <span className="text-zinc-300">הכנסות</span>
              </div>
              <div className="flex items-center space-x-1.5 space-x-reverse px-2.5 py-1 rounded-full bg-zinc-950/80 border border-zinc-800">
                <span className="w-2.5 h-2.5 rounded-sm bg-zinc-500"></span>
                <span className="text-zinc-300">הוצאות</span>
              </div>
            </div>
          </div>
          <div className="relative h-56 my-2 pt-2 flex flex-col justify-between">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-zinc-500 font-mono">
              <div className="w-full border-b border-dashed border-zinc-800/80 flex justify-between items-center pb-0.5">
                <span>{formatCurrency(chartData.maxVal)}</span>
              </div>
              <div className="w-full border-b border-dashed border-zinc-800/80 flex justify-between items-center pb-0.5">
                <span>{formatCurrency(chartData.maxVal * 0.5)}</span>
              </div>
              <div className="w-full border-b border-zinc-800 flex justify-between items-center pb-0.5">
                <span>₪0</span>
              </div>
            </div>
            <div className="relative z-10 h-full flex items-end justify-between space-x-1 space-x-reverse pt-4">
              {chartData.months.map((data, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className="absolute -top-11 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-zinc-950 text-[10px] p-2 rounded-lg border border-zinc-800 z-20 whitespace-nowrap shadow-xl pointer-events-none">
                    <div className="font-bold text-white mb-0.5">{data.label}</div>
                    <div className="text-indigo-400 font-semibold">הכנסות: {formatCurrency(data.income)}</div>
                    <div className="text-zinc-400 font-semibold">הוצאות: {formatCurrency(data.expense)}</div>
                  </div>
                  <div className="w-full flex justify-center space-x-0.5 space-x-reverse h-full items-end bg-zinc-950/40 hover:bg-zinc-950/80 rounded-t-sm px-0.5 transition-colors">
                    <div className="w-[45%] bg-indigo-500 hover:bg-indigo-400 rounded-t-[2px] transition-all duration-300" style={{ height: `${Math.max((data.income / chartData.maxVal) * 100, 3)}%` }} />
                    <div className="w-[45%] bg-zinc-600 hover:bg-zinc-500 rounded-t-[2px] transition-all duration-300" style={{ height: `${Math.max((data.expense / chartData.maxVal) * 100, 3)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 text-[10px] font-medium text-zinc-400 border-t border-zinc-800/80 pt-2 px-1">
            {chartData.months.map((data, idx) => (
              <div key={idx} className="flex-1 text-center truncate">{data.label}</div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <ServiceBreakdownChart transactions={allTransactions} />
        </div>
      </div>

      {/* Row 3: Upcoming Billings & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Upcoming Billings (5 days) */}
        <div className="bg-[#12131c] border border-zinc-800/90 rounded-xl p-5 shadow-md shadow-black/40">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-800/80 pb-2.5">
            <div className="flex items-center space-x-2 space-x-reverse">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">חיובים קרובים (5 ימים)</h3>
            </div>
            <button onClick={() => {
                if (allBillings.length > 0) openEditBillingModal(allBillings[0]);
                else openNewBillingModal();
              }} className="text-xs text-zinc-400 hover:text-white flex items-center space-x-1 space-x-reverse transition-colors">
              <span>ניהול חיובים</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingBillings.length === 0 ? (
            <div className="border border-dashed border-zinc-800/80 rounded-lg p-5 bg-zinc-950/40 flex flex-col items-center justify-center space-y-1.5 text-center my-2">
              <CheckCircle className="w-6 h-6 text-emerald-600/50 stroke-[1.5]" />
              <p className="text-xs text-zinc-400 font-medium">אין חיובים תקופתיים קרובים</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingBillings.map((b: IRecurringBilling) => (
                <div key={b._id} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                  <div>
                    <h4 className="text-xs font-bold text-white">{b.clientName}</h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      לתאריך: {new Date(b.nextBillingDate).toLocaleDateString('he-IL')} • {b.serviceDescription}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {formatCurrency(b.amount)}
                    </span>
                    <button
                      onClick={() => handleMarkAsPaid(b._id)}
                      className="text-[10px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2 py-1 rounded border border-zinc-600 transition-colors"
                    >
                      סומן כשולם
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-[#12131c] border border-zinc-800/90 rounded-xl p-5 shadow-md shadow-black/40">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-800/80 pb-2.5">
            <div className="flex items-center space-x-2 space-x-reverse">
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">אירועים קרובים</h3>
            </div>
            <Link to="/events" className="text-xs text-zinc-400 hover:text-white flex items-center space-x-1 space-x-reverse transition-colors">
              <span>לכל האירועים</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="border border-dashed border-zinc-800/80 rounded-lg p-5 bg-zinc-950/40 flex flex-col items-center justify-center space-y-1.5 text-center my-2">
              <CalendarOff className="w-6 h-6 text-zinc-600 stroke-[1.5]" />
              <p className="text-xs text-zinc-400 font-medium">אין אירועים קרובים להצגה</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((evt: IServiceEvent) => (
                <div key={evt._id} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors">
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      {evt.type === 'DJ Gig' ? 'אירוע תקליטנות' : evt.type === 'Software Development' ? 'פיתוח תוכנה' : 'תחזוקה וייעוץ'}
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {typeof evt.client === 'object' ? evt.client.name : 'לקוח כללי'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${evt.status === 'Scheduled' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' : 'bg-zinc-800 text-zinc-300 border border-zinc-700/60'}`}>
                    {evt.status === 'Scheduled' ? 'מתוכנן' : 'הושלם'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog for Recurring Billing */}
      {isBillingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm"
            onClick={() => setIsBillingModalOpen(false)}
          />
          <div className="relative z-10 bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>{editingBillingId ? 'עריכת מעקב חיוב' : 'הוספת מעקב חיוב חדש'}</span>
              </h3>
              <button
                onClick={() => setIsBillingModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveBilling} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">שם לקוח</label>
                <input
                  type="text"
                  required
                  value={bClientName}
                  onChange={(e) => setBClientName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                  placeholder="לדוגמה: iMenu"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">תיאור שירות</label>
                <input
                  type="text"
                  value={bDesc}
                  onChange={(e) => setBDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                  placeholder="לדוגמה: ריטיינר חודשי מערכת"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">סכום חיוב (₪)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={bAmount}
                    onChange={(e) => setBAmount(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">מחזור חיוב</label>
                  <select
                    value={bCycle}
                    onChange={(e) => setBCycle(e.target.value as 'Monthly' | 'Yearly')}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                  >
                    <option value="Monthly">חודשי</option>
                    <option value="Yearly">שנתי</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">תאריך חיוב קרוב</label>
                <input
                  type="date"
                  required
                  value={bNextDate}
                  onChange={(e) => setBNextDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="pt-3 flex justify-between items-center">
                {editingBillingId ? (
                  <button
                    type="button"
                    onClick={() => deleteBillingHandler(editingBillingId)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    מחק חיוב
                  </button>
                ) : <div/>}

                <div className="flex space-x-2 space-x-reverse">
                  <button
                    type="button"
                    onClick={() => setIsBillingModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingBilling || isUpdatingBilling}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-1.5 rounded-lg shadow-md shadow-emerald-500/20 transition-all text-xs border border-emerald-400/20 disabled:opacity-50"
                  >
                    {isCreatingBilling || isUpdatingBilling ? 'שומר...' : 'שמור חיוב'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
