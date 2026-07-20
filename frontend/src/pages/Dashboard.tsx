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
  Briefcase
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
import { motion } from 'framer-motion';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

// Motion Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

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

  const openGigsCount = eventsData?.data?.events?.filter((e: IServiceEvent) => !e.isPaid && (e.amount || 0) > 0).length || 0;
  const openGigsAmount = eventsData?.data?.events?.filter((e: IServiceEvent) => !e.isPaid && (e.amount || 0) > 0).reduce((sum: number, e: IServiceEvent) => sum + (e.amount || 0), 0) || 0;

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

      if (permission === 'granted' && vapidData?.data?.publicKey) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidData.data.publicKey
        });

        await subscribeToPush(subscription.toJSON()).unwrap();
        await showAlert('התראות פוש הופעלו בהצלחה!', 'התראות פוש', 'info');
      }
    } catch (err) {
      console.error('Failed to enable push:', err);
    }
  };

  // 12-Month Financial Chart Calculation
  const chartData = useMemo(() => {
    const monthNames = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
    const now = new Date();
    const months: { label: string; year: number; month: number; income: number; expense: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: monthNames[d.getMonth()],
        year: d.getFullYear(),
        month: d.getMonth(),
        income: 0,
        expense: 0,
      });
    }

    allTransactions.forEach((tx: ITransaction) => {
      const txDate = new Date(tx.date);
      const match = months.find((m) => m.year === txDate.getFullYear() && m.month === txDate.getMonth());
      if (match) {
        if (tx.type === 'Income') match.income += tx.amount;
        else if (tx.type === 'Expense') match.expense += tx.amount;
      }
    });

    const maxVal = Math.max(
      ...months.map((m) => Math.max(m.income, m.expense)),
      1000
    );

    return { months, maxVal };
  }, [allTransactions]);

  const handleCreateClick = () => {
    navigate('/ledger');
  };

  const openNewBillingModal = () => {
    setEditingBillingId(null);
    setBClientName('');
    setBDesc('');
    setBAmount('');
    setBCycle('Monthly');
    setBNextDate(new Date().toISOString().split('T')[0]);
    setIsBillingModalOpen(true);
  };

  const openEditBillingModal = (billing: IRecurringBilling) => {
    setEditingBillingId(billing._id);
    setBClientName(billing.clientName);
    setBDesc(billing.serviceDescription || '');
    setBAmount(billing.amount);
    setBCycle(billing.billingCycle);
    setBNextDate(new Date(billing.nextBillingDate).toISOString().split('T')[0]);
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

  const formattedUserName = user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'משתמש';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 md:space-y-8 text-ink-black pb-8 font-sans"
    >
      {/* Header Row */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink-black/10">
        <div className="text-right">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink-black font-heading">
            לוח בקרה
          </h1>
          <p className="text-xs sm:text-sm text-slate-gray mt-1 font-sans">
            שלום <span className="font-semibold text-ink-black">{formattedUserName}</span>, סקירה כספית ותפעולית בזמן אמת
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {pushStatus !== 'granted' && (
            <motion.div whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Button variant="outline" onClick={handleEnablePush} className="w-full justify-center">
                <BellRing className="w-4 h-4 text-[#CF4500] ml-1.5" />
                <span>הפעל התראות</span>
              </Button>
            </motion.div>
          )}

          <motion.div whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
            <Button variant="outline" onClick={openNewBillingModal} className="w-full justify-center">
              <Clock className="w-4 h-4 text-[#F37338] ml-1.5" />
              <span>הוסף מעקב חיוב</span>
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
            <Button variant="default" onClick={handleCreateClick} className="w-full justify-center">
              <Plus className="w-4 h-4 stroke-[2.5] ml-1.5" />
              <span>יצירה</span>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Open Gigs Banner */}
      {openGigsCount > 0 && (
        <motion.div variants={itemVariants}>
          <div className="bg-lifted-cream border border-ink-black/10 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-ink-black">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-canvas-cream text-ink-black rounded-xl border border-ink-black/15 shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-ink-black font-heading">יש לך {openGigsCount} עבודות פתוחות לתשלום</h3>
                <p className="text-xs text-slate-gray mt-0.5 font-normal">סך כל החובות הפתוחים: <span className="font-bold text-ink-black">{formatCurrency(openGigsAmount)}</span></p>
              </div>
            </div>
            <Link to="/balances" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto bg-canvas-cream text-ink-black border-none rounded-xl">
                ניהול חובות
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* KPI Summary Cards Grid (1 col mobile, 2 col tablet, 4 col desktop) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} className="will-change-transform">
          <Card className="p-5 sm:p-6 transition-all hover:border-ink-black/25 flex items-center justify-between group h-full">
            <div>
              <p className="text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1.5 font-heading">
                הכנסה חודשית
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-ink-black font-heading">
                {summaryLoading ? '...' : formatCurrency(summary?.monthlyIncome)}
              </h3>
            </div>
            <TrendingUp className="w-6 h-6 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} className="will-change-transform">
          <Card className="p-5 sm:p-6 transition-all hover:border-ink-black/25 flex items-center justify-between group h-full">
            <div>
              <p className="text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1.5 font-heading">
                הוצאות חודשיות
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-ink-black font-heading">
                {summaryLoading ? '...' : formatCurrency(summary?.monthlyExpenses)}
              </h3>
            </div>
            <TrendingDown className="w-6 h-6 text-[#CF4500] shrink-0 group-hover:scale-110 transition-transform" />
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} className="will-change-transform">
          <Card className="p-5 sm:p-6 transition-all hover:border-ink-black/25 flex items-center justify-between group h-full">
            <div>
              <p className="text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1.5 font-heading">
                הכנסות שנתיות
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-ink-black font-heading">
                {summaryLoading ? '...' : formatCurrency(summary?.annualIncome)}
              </h3>
            </div>
            <Activity className="w-6 h-6 text-ink-black shrink-0 group-hover:scale-110 transition-transform" />
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} className="will-change-transform">
          <Card className="p-5 sm:p-6 transition-all hover:border-ink-black/25 flex items-center justify-between group h-full">
            <div>
              <p className="text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1.5 font-heading">
                רווח שנתי נקי
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-ink-black font-heading">
                {summaryLoading ? '...' : formatCurrency(summary?.annualNet)}
              </h3>
            </div>
            <CreditCard className="w-6 h-6 text-[#F37338] shrink-0 group-hover:scale-110 transition-transform" />
          </Card>
        </motion.div>
      </motion.div>

      {/* Row 2: 12-Month Bar Chart & Service Donut */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <Card className="lg:col-span-7 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>הכנסות מול הוצאות</CardTitle>
              <CardDescription className="mt-0.5">נתונים כספיים ל-12 החודשים האחרונים</CardDescription>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse text-xs font-medium shrink-0">
              <div className="flex items-center space-x-1.5 space-x-reverse">
                <span className="w-2.5 h-2.5 rounded-full bg-ink-black"></span>
                <span className="text-ink-black font-semibold">הכנסות</span>
              </div>
              <div className="flex items-center space-x-1.5 space-x-reverse">
                <span className="w-2.5 h-2.5 rounded-full bg-dust-taupe"></span>
                <span className="text-slate-gray font-medium">הוצאות</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Scrollable Container for Mobile Charts */}
            <div className="overflow-x-auto scrollbar-none pb-2">
              <div className="min-w-[500px] relative h-64 my-2 pt-14 flex flex-col justify-between">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-xs text-slate-gray font-mono">
                  <div className="w-full border-b border-dashed border-ink-black/10 flex justify-between items-center pb-0.5">
                    <span>{formatCurrency(chartData.maxVal)}</span>
                  </div>
                  <div className="w-full border-b border-dashed border-ink-black/10 flex justify-between items-center pb-0.5">
                    <span>{formatCurrency(chartData.maxVal * 0.5)}</span>
                  </div>
                  <div className="w-full border-b border-ink-black/10 flex justify-between items-center pb-0.5">
                    <span>₪0</span>
                  </div>
                </div>
                <div className="relative z-10 h-full flex items-end justify-between space-x-1.5 space-x-reverse pt-4">
                  {chartData.months.map((data, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-lifted-cream text-ink-black text-[10px] p-3 rounded-xl border border-ink-black/15 z-20 whitespace-nowrap shadow-xl pointer-events-none">
                        <div className="font-bold text-ink-black mb-0.5">{data.label} {data.year}</div>
                        <div className="text-[#CF4500] font-bold">הכנסות: {formatCurrency(data.income)}</div>
                        <div className="text-slate-gray font-medium">הוצאות: {formatCurrency(data.expense)}</div>
                      </div>
                      <div className="w-full flex justify-center space-x-1 space-x-reverse h-full items-end bg-canvas-cream hover:bg-canvas-cream/80 rounded-t-xl px-1 transition-colors">
                        <div className="w-[45%] bg-[#CF4500] hover:bg-[#CF4500]/95 rounded-t-lg transition-all duration-300 shadow-xs" style={{ height: `${Math.max((data.income / chartData.maxVal) * 100, 3)}%` }} />
                        <div className="w-[45%] bg-dust-taupe hover:bg-dust-taupe/80 rounded-t-lg transition-all duration-300" style={{ height: `${Math.max((data.expense / chartData.maxVal) * 100, 3)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="min-w-[500px] flex justify-between items-center mt-2 text-xs font-bold text-slate-gray border-t border-ink-black/10 pt-2 px-1 font-heading">
                {chartData.months.map((data, idx) => (
                  <div key={idx} className="flex-1 text-center truncate">{data.label}</div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-5">
          <ServiceBreakdownChart transactions={allTransactions} />
        </div>
      </motion.div>

      {/* Row 3: Upcoming Billings & Events (Stacked on Mobile) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Upcoming Billings (5 days) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-ink-black/10">
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <CreditCard className="w-4.5 h-4.5 text-ink-black" />
              <span>חיובים קרובים (5 ימים)</span>
            </CardTitle>
            <button onClick={() => {
                if (allBillings.length > 0) openEditBillingModal(allBillings[0]);
                else openNewBillingModal();
              }} className="text-xs text-slate-gray hover:text-ink-black flex items-center space-x-1 space-x-reverse transition-colors font-semibold">
              <span>ניהול חיובים</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </CardHeader>

          <CardContent className="pt-4">
            {upcomingBillings.length === 0 ? (
              <div className="border border-dashed border-ink-black/15 rounded-xl p-6 bg-canvas-cream/50 flex flex-col items-center justify-center space-y-1.5 text-center my-2">
                <CheckCircle className="w-7 h-7 text-[#CF4500] stroke-[1.5]" />
                <p className="text-xs text-slate-gray font-medium">אין חיובים תקופתיים קרובים</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBillings.map((b: IRecurringBilling) => (
                  <div key={b._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white border border-ink-black/10 hover:border-ink-black/30 transition-all shadow-xs gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-ink-black">{b.clientName}</h4>
                      <p className="text-[11px] text-slate-gray mt-0.5">
                        לתאריך: {new Date(b.nextBillingDate).toLocaleDateString('he-IL')} • {b.serviceDescription}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse self-end sm:self-auto">
                      <Badge variant="secondary" className="text-ink-black font-bold text-xs px-3 py-1 border border-ink-black/10 bg-canvas-cream">
                        {formatCurrency(b.amount)}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsPaid(b._id)}
                      >
                        סומן כשולם
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-ink-black/10">
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <CalendarDays className="w-4.5 h-4.5 text-ink-black" />
              <span>אירועים קרובים</span>
            </CardTitle>
            <Link to="/events" className="text-xs text-slate-gray hover:text-ink-black flex items-center space-x-1 space-x-reverse transition-colors font-semibold">
              <span>לכל האירועים</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>

          <CardContent className="pt-4">
            {upcomingEvents.length === 0 ? (
              <div className="border border-dashed border-ink-black/15 rounded-xl p-6 bg-canvas-cream/50 flex flex-col items-center justify-center space-y-1.5 text-center my-2">
                <CalendarOff className="w-7 h-7 text-slate-gray stroke-[1.5]" />
                <p className="text-xs text-slate-gray font-medium">אין אירועים קרובים להצגה</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((evt: IServiceEvent) => (
                  <div key={evt._id} className="flex items-center justify-between p-4 rounded-xl bg-white border border-ink-black/10 hover:border-ink-black/30 transition-all shadow-xs">
                    <div>
                      <h4 className="text-xs font-bold text-ink-black">
                        {evt.type === 'DJ Gig' ? 'אירוע תקליטנות' : evt.type === 'Software Development' ? 'פיתוח תוכנה' : 'תחזוקה וייעוץ'}
                      </h4>
                      <p className="text-[11px] text-slate-gray mt-0.5">
                        {typeof evt.client === 'object' ? evt.client.name : 'לקוח כללי'}
                      </p>
                    </div>
                    <Badge variant={evt.status === 'Scheduled' ? 'dark' as any : 'secondary'}>
                      {evt.status === 'Scheduled' ? 'מתוכנן' : 'הושלם'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Shadcn Dialog for Recurring Billing */}
      <Dialog open={isBillingModalOpen} onOpenChange={setIsBillingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#CF4500]" />
              <span>{editingBillingId ? 'עריכת מעקב חיוב' : 'הוספת מעקב חיוב חדש'}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={saveBilling} className="space-y-4 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">שם לקוח</label>
              <Input
                type="text"
                required
                value={bClientName}
                onChange={(e) => setBClientName(e.target.value)}
                placeholder="לדוגמה: iMenu"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">תיאור שירות</label>
              <Input
                type="text"
                value={bDesc}
                onChange={(e) => setBDesc(e.target.value)}
                placeholder="לדוגמה: ריטיינר חודשי מערכת"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">סכום חיוב (₪)</label>
                <Input
                  type="number"
                  required
                  min={0}
                  value={bAmount}
                  onChange={(e) => setBAmount(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">מחזור חיוב</label>
                <select
                  value={bCycle}
                  onChange={(e) => setBCycle(e.target.value as 'Monthly' | 'Yearly')}
                  className="w-full h-10 bg-canvas-cream border border-ink-black/15 rounded-xl px-4 py-2 text-xs text-ink-black focus:outline-none focus:border-ink-black focus:bg-lifted-cream transition-all"
                >
                  <option value="Monthly">חודשי</option>
                  <option value="Yearly">שנתי</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">תאריך חיוב קרוב</label>
              <Input
                type="date"
                required
                value={bNextDate}
                onChange={(e) => setBNextDate(e.target.value)}
              />
            </div>

            <div className="pt-3 flex justify-between items-center border-t border-ink-black/10">
              {editingBillingId ? (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => deleteBillingHandler(editingBillingId)}
                  className="p-0 text-xs text-[#CF4500]"
                >
                  מחק חיוב
                </Button>
              ) : <div/>}

              <div className="flex space-x-2 space-x-reverse">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsBillingModalOpen(false)}
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingBilling || isUpdatingBilling}
                >
                  {isCreatingBilling || isUpdatingBilling ? 'שומר...' : 'שמור חיוב'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
