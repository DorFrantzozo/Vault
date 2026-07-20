import React, { useState } from 'react';
import { Plus, Trash2, ExternalLink, Filter, X, Pencil, UserPlus, Check } from 'lucide-react';
import {
  useGetTransactionsQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} from '../store/api/transactionApi.js';
import { useGetClientsQuery, useCreateClientMutation } from '../store/api/clientApi.js';
import { useGetEventsQuery } from '../store/api/eventApi.js';
import { FileDropzone } from '../components/ledger/FileDropzone.js';
import { ITransaction, IServiceEvent, IClient } from '../types/api.js';
import { useModal } from '../components/common/ModalContext.js';

export default function Ledger() {
  const { confirm } = useModal();
  const [filterType, setFilterType] = useState<string>('');
  const [filterClient, setFilterClient] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<'Income' | 'Expense'>('Income');
  const [serviceType, setServiceType] = useState<IServiceEvent['type'] | 'General'>('General');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [clientId, setClientId] = useState<string>('');
  const [eventId, setEventId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  // Quick Client Creation State
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientType, setNewClientType] = useState<IClient['type']>('Club');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [quickClientError, setQuickClientError] = useState('');

  const { data: transData, isLoading } = useGetTransactionsQuery({
    type: filterType || undefined,
    client: filterClient || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: clientsData } = useGetClientsQuery();
  const { data: eventsData } = useGetEventsQuery();

  const [createTransaction, { isLoading: isCreating }] = useCreateTransactionMutation();
  const [updateTransaction, { isLoading: isUpdating }] = useUpdateTransactionMutation();
  const [deleteTransaction] = useDeleteTransactionMutation();
  const [createClient, { isLoading: isCreatingClient }] = useCreateClientMutation();

  const clients = clientsData?.data?.clients || [];
  const events = eventsData?.data?.events || [];
  const transactions = transData?.data?.transactions || [];

  const [modalError, setModalError] = useState<string>('');

  const openCreateModal = () => {
    resetForm();
    setEditingTxId(null);
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: ITransaction) => {
    setEditingTxId(t._id);
    setType(t.type);
    setServiceType(t.serviceType || (typeof t.relatedEvent === 'object' ? (t.relatedEvent as IServiceEvent)?.type : 'General'));
    setAmount(t.amount.toString());
    setDate(new Date(t.date).toISOString().split('T')[0]);
    setClientId(typeof t.client === 'object' ? t.client?._id || '' : t.client || '');
    setEventId(typeof t.relatedEvent === 'object' ? t.relatedEvent?._id || '' : t.relatedEvent || '');
    setNotes(t.notes || '');
    setFile(null);
    setModalError('');
    setIsQuickClientOpen(false);
    setIsModalOpen(true);
  };

  const handleEventChange = (selectedEvId: string) => {
    setEventId(selectedEvId);
    if (selectedEvId) {
      const selectedEv = events.find((ev) => ev._id === selectedEvId);
      if (selectedEv) {
        setServiceType(selectedEv.type);
        if (typeof selectedEv.client === 'object' && selectedEv.client?._id) {
          setClientId(selectedEv.client._id);
        } else if (typeof selectedEv.client === 'string') {
          setClientId(selectedEv.client);
        }
      }
    }
  };

  const handleQuickClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickClientError('');
    if (!newClientName) return;

    try {
      const res = await createClient({
        name: newClientName,
        type: newClientType,
        contactInfo: {
          email: newClientEmail || undefined,
          phone: newClientPhone || undefined,
        },
      }).unwrap();

      const createdClient = res.data?.client;
      if (createdClient?._id) {
        setClientId(createdClient._id);
      }
      setIsQuickClientOpen(false);
      setNewClientName('');
      setNewClientEmail('');
      setNewClientPhone('');
    } catch (err: any) {
      console.error('Failed to create quick client', err);
      setQuickClientError(err?.data?.message || 'שגיאה ביצירת לקוח חדש.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!amount || parseFloat(amount) <= 0) return;

    const formData = new FormData();
    formData.append('type', type);
    formData.append('serviceType', serviceType);
    formData.append('amount', amount);
    formData.append('date', new Date(date).toISOString());
    if (clientId) formData.append('client', clientId);
    if (eventId) formData.append('relatedEvent', eventId);
    if (notes) formData.append('notes', notes);
    if (file) formData.append('receipt', file);

    try {
      if (editingTxId) {
        await updateTransaction({ id: editingTxId, formData }).unwrap();
      } else {
        await createTransaction(formData).unwrap();
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Failed to save transaction', err);
      setModalError(err?.data?.message || 'שגיאה בשמירת התנועה. בדוק את הפרטים או את הקובץ המצורף.');
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'מחיקת תנועה',
      message: 'האם אתה בטוח שברצונך למחוק תנועה זו?',
      confirmText: 'מחק תנועה',
      type: 'danger',
    });

    if (isConfirmed) {
      try {
        await deleteTransaction(id).unwrap();
      } catch (err) {
        console.error('Failed to delete transaction', err);
      }
    }
  };

  const resetForm = () => {
    setType('Income');
    setServiceType('General');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setClientId('');
    setEventId('');
    setNotes('');
    setFile(null);
    setEditingTxId(null);
    setIsQuickClientOpen(false);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(val);

  const getServiceTypeHebrew = (st?: string) => {
    switch (st) {
      case 'DJ Gig':
        return 'תקליטנות (DJ)';
      case 'Software Development':
        return 'פיתוח תוכנה';
      case 'Maintenance':
        return 'תחזוקה';
      case 'Consulting':
        return 'ייעוץ';
      default:
        return 'כללי';
    }
  };

  return (
    <div className="space-y-6 text-zinc-100 pb-6">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="text-right">
          <h1 className="text-xl font-bold tracking-tight text-white">ספר תנועות כספיות</h1>
          <p className="text-xs text-zinc-400 mt-0.5">ניהול, עריכה ומעקב אחר כל ההכנסות, ההוצאות והפילוח העסקי</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-1.5 space-x-reverse bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-4 py-2 rounded-lg shadow-md shadow-indigo-500/20 transition-all text-xs border border-indigo-400/20 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>רישום תנועה חדשה</span>
        </button>
      </div>

      {/* Filter Panel */}
      <div className="bg-[#12131c] border border-zinc-800/90 rounded-xl p-4 shadow-md shadow-black/40 backdrop-blur-sm space-y-3">
        <div className="flex items-center space-x-2 space-x-reverse text-xs font-semibold text-zinc-300">
          <Filter className="w-4 h-4 text-zinc-400" />
          <span>סינון תנועות</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">סוג תנועה</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 transition-all"
            >
              <option value="">כל הסוגים</option>
              <option value="Income">הכנסה</option>
              <option value="Expense">הוצאה</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">לקוח</label>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 transition-all"
            >
              <option value="">כל הלקוחות</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">מתאריך</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">עד תאריך</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#12131c] border border-zinc-800/90 rounded-xl shadow-md shadow-black/40 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-zinc-400 text-xs">טוען נתונים...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 text-xs">לא נמצאו תנועות התואמות את החיפוש.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 text-[11px] font-semibold uppercase border-b border-zinc-800/80">
                <tr>
                  <th className="px-5 py-3">תאריך</th>
                  <th className="px-5 py-3">סוג תנועה</th>
                  <th className="px-5 py-3">קטגוריית שירות</th>
                  <th className="px-5 py-3">לקוח</th>
                  <th className="px-5 py-3">סכום</th>
                  <th className="px-5 py-3">אסמכתא</th>
                  <th className="px-5 py-3">הערות</th>
                  <th className="px-5 py-3 text-left">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                {transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-zinc-200">
                      {new Date(t.date).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          t.type === 'Income'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                        }`}
                      >
                        {t.type === 'Income' ? 'הכנסה' : 'הוצאה'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-300">
                      <span className="inline-block px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50 text-[11px] text-zinc-300 font-medium">
                        {getServiceTypeHebrew(t.serviceType || (typeof t.relatedEvent === 'object' ? (t.relatedEvent as IServiceEvent)?.type : undefined))}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-300">
                      {typeof t.client === 'object' ? t.client?.name : 'ללא לקוח'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-white">
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      {t.attachmentUrl ? (
                        <a
                          href={t.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 space-x-reverse text-xs text-indigo-400 hover:underline font-medium"
                        >
                          <span>צפה בקבלה</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-zinc-500 text-[11px]">אין אסמכתא</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 max-w-xs truncate">
                      {t.notes || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-left">
                      <div className="flex items-center justify-end space-x-1 space-x-reverse">
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="ערוך תנועה"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t._id)}
                          className="p-1 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="מחק תנועה"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enlarged Modal Dialog (max-w-2xl) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative z-10 bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 text-zinc-100 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingTxId ? 'עריכת תנועה כספית' : 'רישום תנועה חדשה'}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">הזנת פרטי התנועה, שיוך לקוח ואסמכתאות</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-800/60 hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                  {modalError}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">סוג תנועה</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'Income' | 'Expense')}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                  >
                    <option value="Income">הכנסה</option>
                    <option value="Expense">הוצאה</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">סכום (₪)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="250.00"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">תאריך</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              {/* Service Category & Client Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    קטגוריית שירות (לפילוח בגרף)
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                  >
                    <option value="DJ Gig">תקליטנות (DJ)</option>
                    <option value="Software Development">פיתוח תוכנה</option>
                    <option value="Maintenance">תחזוקה</option>
                    <option value="Consulting">ייעוץ</option>
                    <option value="General">כללי / ללא קטגוריה</option>
                  </select>
                </div>

                {/* Client Selector with Quick Add Button */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-zinc-400">לקוח (אופציונלי)</label>
                    <button
                      type="button"
                      onClick={() => setIsQuickClientOpen(!isQuickClientOpen)}
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 transition-colors"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>{isQuickClientOpen ? 'סגור טופס לקוח' : '+ לקוח חדש'}</span>
                    </button>
                  </div>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                  >
                    <option value="">-- ללא לקוח --</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Inline Add Client Box */}
              {isQuickClientOpen && (
                <div className="bg-zinc-950/80 border border-indigo-500/30 rounded-xl p-4 space-y-3 relative">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
                      <span>הוספת לקוח חדש במהירות</span>
                    </span>
                    <span className="text-[10px] text-zinc-400">יירשם מיד בספר הלקוחות</span>
                  </div>

                  {quickClientError && (
                    <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[11px]">
                      {quickClientError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-medium text-zinc-400 mb-1">שם הלקוח / עסק *</label>
                      <input
                        type="text"
                        required
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="מועדון זנית / חברת אקמי"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-zinc-400 mb-1">סוג לקוח</label>
                      <select
                        value={newClientType}
                        onChange={(e) => setNewClientType(e.target.value as any)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Club">מועדון</option>
                        <option value="Producer">מפיק</option>
                        <option value="Restaurant">מסעדה</option>
                        <option value="Private">לקוח פרטי</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-medium text-zinc-400 mb-1">אימייל (אופציונלי)</label>
                      <input
                        type="email"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        placeholder="info@client.com"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 text-left"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-zinc-400 mb-1">טלפון (אופציונלי)</label>
                      <input
                        type="text"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        placeholder="050-0000000"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 space-x-reverse pt-1">
                    <button
                      type="button"
                      onClick={() => setIsQuickClientOpen(false)}
                      className="px-2.5 py-1 text-[11px] text-zinc-400 hover:text-zinc-200"
                    >
                      ביטול
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickClientSubmit}
                      disabled={isCreatingClient || !newClientName}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1 rounded-lg text-[11px] flex items-center gap-1 shadow-sm disabled:opacity-50"
                    >
                      <Check className="w-3 h-3" />
                      <span>{isCreatingClient ? 'יוצר לקוח...' : 'שמור ונבחר לקוח'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">אירוע מקושר (אופציונלי)</label>
                <select
                  value={eventId}
                  onChange={(e) => handleEventChange(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                >
                  <option value="">-- ללא אירוע --</option>
                  {events.map((ev) => (
                    <option key={ev._id} value={ev._id}>
                      {ev.type === 'DJ Gig' ? 'תקליטנות' : ev.type === 'Software Development' ? 'תוכנה' : ev.type} - {new Date(ev.date).toLocaleDateString('he-IL')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">הערות</label>
                <textarea
                  rows={2.5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="פירוט נוסף או אסמכתא..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <FileDropzone selectedFile={file} onFileSelect={setFile} />

              <div className="pt-2 flex justify-end space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-5 py-2 rounded-lg shadow-md shadow-indigo-500/20 transition-all text-xs border border-indigo-400/20 disabled:opacity-50"
                >
                  {isCreating || isUpdating
                    ? 'שומר...'
                    : editingTxId
                    ? 'עדכן תנועה'
                    : 'שמור תנועה'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
