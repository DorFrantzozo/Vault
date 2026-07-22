import React, { useState } from 'react';
import { Plus, Trash2, Pencil, Calendar, History, CheckCircle, CreditCard } from 'lucide-react';
import {
  useGetBillingsQuery,
  useCreateBillingMutation,
  useUpdateBillingMutation,
  useDeleteBillingMutation,
  useMarkBillingAsPaidMutation,
  useGetBillingHistoryQuery,
  IRecurringBilling
} from '../store/api/billingApi.js';
import { useGetClientsQuery } from '../store/api/clientApi.js';
import { useModal } from '../components/common/ModalContext.js';
import { motion } from 'framer-motion';

import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { format } from 'date-fns';

export default function RecurringBillings() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingBilling, setEditingBilling] = useState<IRecurringBilling | null>(null);
  const [selectedBillingIdForHistory, setSelectedBillingIdForHistory] = useState<string | null>(null);

  // Form State
  const [clientId, setClientId] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [nextBillingDate, setNextBillingDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  const { data: billingsData, isLoading } = useGetBillingsQuery();
  const { data: clientsData } = useGetClientsQuery();
  const [createBilling, { isLoading: isCreating }] = useCreateBillingMutation();
  const [updateBilling, { isLoading: isUpdating }] = useUpdateBillingMutation();
  const [deleteBilling] = useDeleteBillingMutation();
  const [markAsPaid] = useMarkBillingAsPaidMutation();
  const { confirm } = useModal();

  const { data: historyData, isLoading: isHistoryLoading } = useGetBillingHistoryQuery(selectedBillingIdForHistory || '', {
    skip: !selectedBillingIdForHistory,
  });

  const billings = billingsData?.data?.billings || [];
  const clients = clientsData?.data?.clients || [];
  const historyTransactions = historyData?.data?.transactions || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !amount || !nextBillingDate) return;

    const payload = {
      client: clientId,
      serviceDescription,
      amount: Number(amount),
      billingCycle,
      nextBillingDate,
      isActive,
    };

    try {
      if (editingBilling) {
        await updateBilling({ id: editingBilling._id, ...payload } as any).unwrap();
      } else {
        await createBilling(payload as any).unwrap();
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save billing', err);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setEditingBilling(null);
    setIsModalOpen(true);
  };

  const openEditModal = (billing: IRecurringBilling) => {
    setClientId(billing.client?._id || '');
    setServiceDescription(billing.serviceDescription || '');
    setAmount(billing.amount);
    setBillingCycle(billing.billingCycle);
    setNextBillingDate(new Date(billing.nextBillingDate).toISOString().split('T')[0]);
    setIsActive(billing.isActive);
    setEditingBilling(billing);
    setIsModalOpen(true);
  };

  const openHistoryModal = (billingId: string) => {
    setSelectedBillingIdForHistory(billingId);
    setIsHistoryModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'הסרת חיוב קבוע',
      message: 'האם אתה בטוח שברצונך להסיר חיוב תקופתי זה? (תנועות עבר שנוצרו יישמרו בספר התנועות)',
      confirmText: 'מחק חיוב',
      type: 'danger',
    });

    if (isConfirmed) {
      try {
        await deleteBilling(id).unwrap();
      } catch (err) {
        console.error('Failed to delete billing', err);
      }
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'אישור תשלום קבוע',
      message: 'האם אתה מאשר שקיבלת את התשלום? המערכת תוסיף הכנסה לספר התנועות ותקדם את התאריך לחודש/שנה הבאה.',
      confirmText: 'אשר תשלום',
      type: 'info',
    });

    if (isConfirmed) {
      try {
        await markAsPaid(id).unwrap();
      } catch (err) {
        console.error('Failed to mark as paid', err);
      }
    }
  };

  const resetForm = () => {
    setClientId(clients[0]?._id || '');
    setServiceDescription('');
    setAmount('');
    setBillingCycle('Monthly');
    setNextBillingDate(new Date().toISOString().split('T')[0]);
    setIsActive(true);
    setEditingBilling(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6 sm:space-y-8 text-[ink-black] pb-8 font-sans"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[ink-black]/10">
        <div className="text-right">
          <h1 className="text-2.5xl sm:text-3xl font-medium tracking-tight text-[ink-black] font-heading flex items-center gap-2">
            <span>חיובים קבועים ומנויים</span>
          </h1>
          <p className="text-xs text-[slate-gray] mt-1 font-sans">ניהול שירותים תקופתיים, גביית ריטיינר והיסטוריית חיובים</p>
        </div>
        <motion.div whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
          <Button variant="default" onClick={openCreateModal} className="w-full justify-center">
            <Plus className="w-4 h-4 stroke-[2.5] ml-1.5" />
            <span>הוסף חיוב תקופתי</span>
          </Button>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-[slate-gray] text-xs font-medium">טוען חיובים...</div>
      ) : billings.length === 0 ? (
        <div className="border border-dashed border-[ink-black]/15 rounded-2xl p-10 bg-canvas-cream/50 flex flex-col items-center justify-center space-y-2 text-center my-4">
          <CreditCard className="w-8 h-8 text-[slate-gray] stroke-[1.5]" />
          <p className="text-xs text-[slate-gray] font-bold font-heading">אין חיובים תקופתיים במערכת</p>
          <span className="text-[10px] text-[slate-gray]">לחץ על "הוסף חיוב תקופתי" ליצירת ריטיינר חדש</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {billings.map((b) => (
            <motion.div key={b._id} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} className="will-change-transform">
              <Card className="p-5 sm:p-6 space-y-4 relative group hover:border-[ink-black]/30 transition-all rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="p-3 bg-canvas-cream text-[ink-black] rounded-xl border border-[ink-black]/10">
                        <CreditCard className="w-5 h-5 text-[ink-black]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[ink-black] text-sm font-heading">{b.client?.name || b.clientName || 'לקוח לא ידוע'}</h3>
                        <div className="text-xs text-[slate-gray] mt-0.5">{b.serviceDescription || 'ללא תיאור שירות'}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(b)} title="ערוך">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(b._id)} className="hover:text-[#CF4500]" title="הסר">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[ink-black]/10 text-xs">
                    <div>
                      <div className="text-[slate-gray] text-[10px] mb-1 uppercase tracking-wide">סכום וסוג</div>
                      <div className="font-bold flex items-center space-x-1 space-x-reverse">
                        <span>₪{b.amount.toLocaleString()}</span>
                        <Badge variant="outline" className="text-[10px] py-0 h-5">
                          {b.billingCycle === 'Monthly' ? 'חודשי' : 'שנתי'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <div className="text-[slate-gray] text-[10px] mb-1 uppercase tracking-wide">תאריך חיוב קרוב</div>
                      <div className="flex items-center space-x-1 space-x-reverse font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{format(new Date(b.nextBillingDate), 'dd/MM/yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  {!b.isActive && (
                    <div className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg text-center">
                      מנוי מושהה / לא פעיל
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 space-x-reverse pt-2">
                  <Button variant="default" className="flex-1 bg-[ink-black] hover:bg-[ink-black]/90 text-white" onClick={() => handleMarkAsPaid(b._id)}>
                    <CheckCircle className="w-4 h-4 ml-2" />
                    סמן ששולם
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => openHistoryModal(b._id)}>
                    <History className="w-4 h-4 ml-2" />
                    היסטוריה
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{editingBilling ? 'עריכת חיוב תקופתי' : 'הוספת חיוב תקופתי'}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-[slate-gray] mb-1 uppercase tracking-wider font-heading">לקוח</label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-10 bg-canvas-cream border border-[ink-black]/15 rounded-xl px-4 py-2 text-xs text-[ink-black] focus:outline-none focus:border-[ink-black] focus:bg-white transition-all"
              >
                <option value="" disabled>בחר לקוח</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[slate-gray] mb-1 uppercase tracking-wider font-heading">תיאור השירות</label>
              <Input
                type="text"
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                placeholder="לדוגמה: ריטיינר תחזוקת תוכנה, ייעוץ חודשי"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[slate-gray] mb-1 uppercase tracking-wider font-heading">סכום (₪)</label>
                <Input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[slate-gray] mb-1 uppercase tracking-wider font-heading">מחזור חיוב</label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as 'Monthly' | 'Yearly')}
                  className="w-full h-10 bg-canvas-cream border border-[ink-black]/15 rounded-xl px-4 py-2 text-xs text-[ink-black] focus:outline-none focus:border-[ink-black] focus:bg-white transition-all"
                >
                  <option value="Monthly">חודשי</option>
                  <option value="Yearly">שנתי</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[slate-gray] mb-1 uppercase tracking-wider font-heading">תאריך חיוב קרוב</label>
              <Input
                type="date"
                required
                value={nextBillingDate}
                onChange={(e) => setNextBillingDate(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 space-x-reverse pt-2">
               <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[ink-black] focus:ring-[ink-black]"
              />
              <label htmlFor="isActive" className="text-sm text-[ink-black] font-medium">פעיל</label>
            </div>

            <div className="pt-2 flex justify-end space-x-2 space-x-reverse border-t border-[ink-black]/10">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>ביטול</Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? 'שומר...' : editingBilling ? 'עדכן חיוב' : 'שמור חיוב'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              <span>היסטוריית חיובים ששולמו</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-2">
            {isHistoryLoading ? (
              <div className="text-center text-xs text-[slate-gray] py-6">טוען נתונים...</div>
            ) : historyTransactions.length === 0 ? (
              <div className="text-center text-xs text-[slate-gray] py-6 bg-canvas-cream/50 rounded-xl border border-[ink-black]/5">אין עדיין תנועות היסטוריות לחיוב זה.</div>
            ) : (
              historyTransactions.map(t => (
                <div key={t._id} className="flex justify-between items-center p-3 bg-white border border-[ink-black]/10 rounded-xl shadow-sm">
                  <div>
                    <div className="font-bold text-sm">₪{t.amount.toLocaleString()}</div>
                    <div className="text-[10px] text-[slate-gray]">{t.notes}</div>
                  </div>
                  <div className="text-xs bg-canvas-cream px-2 py-1 rounded-md text-[ink-black] font-medium">
                    {format(new Date(t.date), 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="pt-4 border-t border-[ink-black]/10 mt-2">
             <Button className="w-full" onClick={() => setIsHistoryModalOpen(false)}>סגור</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
