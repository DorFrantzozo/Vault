import React, { useState, useMemo } from 'react';
import { Plus, Trash2, CalendarOff, Pencil, CalendarPlus, Search, X } from 'lucide-react';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, addMonths } from 'date-fns';
import {
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} from '../store/api/eventApi.js';
import { useGetClientsQuery } from '../store/api/clientApi.js';
import { IServiceEvent } from '../types/api.js';
import { downloadAppleIcsFile, getGoogleCalendarUrl } from '../utils/calendarExport.js';
import { useModal } from '../components/common/ModalContext.js';
import { motion } from 'framer-motion';

import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const getEventTypeHebrew = (t: IServiceEvent['type']) => {
  switch (t) {
    case 'DJ Gig':
      return 'תקליטנות (DJ)';
    case 'Software Development':
      return 'פיתוח תוכנה';
    case 'Maintenance':
      return 'תחזוקה';
    case 'Consulting':
      return 'ייעוץ';
    default:
      return t;
  }
};

const getStatusHebrew = (s: IServiceEvent['status']) => {
  switch (s) {
    case 'Scheduled':
      return 'מתוכנן';
    case 'Completed':
      return 'הושלם';
    case 'Cancelled':
      return 'בוטל';
    default:
      return s;
  }
};

export default function Events() {
  const { confirm } = useModal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [clientId, setClientId] = useState('');
  const [type, setType] = useState<IServiceEvent['type']>('DJ Gig');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<IServiceEvent['status']>('Scheduled');
  const [amount, setAmount] = useState<string>('');

  const { data: eventsData, isLoading } = useGetEventsQuery();
  const { data: clientsData } = useGetClientsQuery();

  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const [deleteEvent] = useDeleteEventMutation();

  const events = eventsData?.data?.events || [];
  const clients = clientsData?.data?.clients || [];

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Paid' | 'Unpaid'>('All');
  const [selectedClientName, setSelectedClientName] = useState('All');
  const [dateFilter, setDateFilter] = useState<'All' | 'This Month' | 'Next Month' | 'Custom'>('All');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Extract unique client names currently in the events dataset
  const uniqueClients = useMemo(() => {
    const names = new Set<string>();
    events.forEach((ev) => {
      const name = typeof ev.client === 'object' ? ev.client?.name : 'לקוח כללי';
      if (name) names.add(name);
    });
    return Array.from(names).sort();
  }, [events]);

  // Derived filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // 1. Text Search Filter (Client name or Event type)
      const clientName = typeof ev.client === 'object' ? ev.client?.name || '' : 'לקוח כללי';
      const eventTypeHebrew = getEventTypeHebrew(ev.type);
      const matchesSearch =
        clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eventTypeHebrew.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ev.description || '').toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Payment Status Filter
      const matchesPayment =
        paymentFilter === 'All'
          ? true
          : paymentFilter === 'Paid'
          ? ev.isPaid === true
          : ev.isPaid === false;

      // 3. Client/Venue Filter
      const matchesClient =
        selectedClientName === 'All'
          ? true
          : clientName === selectedClientName;

      // 4. Date Filter
      let matchesDate = true;
      const evDate = parseISO(ev.date);
      const now = new Date();

      if (dateFilter === 'This Month') {
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        matchesDate = isWithinInterval(evDate, { start, end });
      } else if (dateFilter === 'Next Month') {
        const nextMonthDate = addMonths(now, 1);
        const start = startOfMonth(nextMonthDate);
        const end = endOfMonth(nextMonthDate);
        matchesDate = isWithinInterval(evDate, { start, end });
      } else if (dateFilter === 'Custom') {
        if (customStartDate && customEndDate) {
          const start = new Date(`${customStartDate}T00:00:00`);
          const end = new Date(`${customEndDate}T23:59:59`);
          matchesDate = isWithinInterval(evDate, { start, end });
        } else if (customStartDate) {
          const start = new Date(`${customStartDate}T00:00:00`);
          matchesDate = evDate >= start;
        } else if (customEndDate) {
          const end = new Date(`${customEndDate}T23:59:59`);
          matchesDate = evDate <= end;
        }
      }

      return matchesSearch && matchesPayment && matchesClient && matchesDate;
    });
  }, [events, searchQuery, paymentFilter, selectedClientName, dateFilter, customStartDate, customEndDate]);

  const clearFilters = () => {
    setSearchQuery('');
    setPaymentFilter('All');
    setSelectedClientName('All');
    setDateFilter('All');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const openCreateModal = () => {
    resetForm();
    setEditingEventId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (ev: IServiceEvent) => {
    setEditingEventId(ev._id);
    setClientId(typeof ev.client === 'object' ? ev.client._id : ev.client || '');
    setType(ev.type);
    setDate(new Date(ev.date).toISOString().split('T')[0]);
    setDescription(ev.description || '');
    setStatus(ev.status);
    setAmount(ev.amount ? ev.amount.toString() : '0');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !date) return;

    try {
      if (editingEventId) {
        await updateEvent({
          id: editingEventId,
          client: clientId,
          type,
          date: new Date(date).toISOString(),
          description: description || undefined,
          status,
          amount: Number(amount) || 0,
        }).unwrap();
        setIsModalOpen(false);
        resetForm();
      } else {
        const res = await createEvent({
          client: clientId,
          type,
          date: new Date(date).toISOString(),
          description: description || undefined,
          status,
          amount: Number(amount) || 0,
        }).unwrap();

        // Close the form modal FIRST, then prompt for calendar export
        setIsModalOpen(false);
        resetForm();

        const created = res.data?.event;
        if (created) {
          const exportToCal = await confirm({
            title: 'ייצוא ליומן',
            message: 'האירוע נוצר בהצלחה! האם ברצונך לייצא אותו ל-Apple Calendar עכשיו?',
            confirmText: 'ייצא ליומן',
            cancelText: 'לא עכשיו',
            type: 'info',
          });
          if (exportToCal) {
            downloadAppleIcsFile(created);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to save event', err);
      setModalError(err?.data?.message || 'שגיאה בשמירת האירוע');
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'מחיקת אירוע',
      message: 'האם אתה בטוח שברצונך למחוק אירוע זה?',
      confirmText: 'מחק אירוע',
      type: 'danger',
    });

    if (isConfirmed) {
      try {
        await deleteEvent(id).unwrap();
      } catch (err) {
        console.error('Failed to delete event', err);
      }
    }
  };

  const resetForm = () => {
    setClientId('');
    setType('DJ Gig');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setStatus('Scheduled');
    setAmount('');
    setEditingEventId(null);
  };

  return (
    <div className="space-y-8 text-ink-black pb-8 font-sans">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-4 border-b border-ink-black/10">
        <div className="text-right">
          <h1 className="text-3xl font-medium tracking-tight text-ink-black font-heading flex items-center gap-2">
            <span>יומן אירועים ותפעול</span>
          </h1>
          <p className="text-xs text-slate-gray mt-1 font-sans">תזמון, עריכה, ניהול וסנכרון אירועים ל-Apple Calendar ו-Google</p>
        </div>
        <Button variant="default" onClick={openCreateModal}>
          <Plus className="w-4 h-4 stroke-[2.5] ml-1.5" />
          <span>תזמן אירוע</span>
        </Button>
      </div>

      {/* Advanced Filtering & Search Bar */}
      <div className="bg-white border border-gray-150 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Main Filter Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
            
            {/* Text Search */}
            <div className="relative">
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-gray">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש לפי לקוח או סוג אירוע..."
                className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl pr-9 pl-3 text-xs text-gray-800 placeholder:text-slate-gray focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white transition-all text-right"
              />
            </div>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white transition-all"
            >
              <option value="All">כל הסטטוסים (תשלום)</option>
              <option value="Paid">שולם</option>
              <option value="Unpaid">טרם שולם</option>
            </select>

            {/* Client Filter */}
            <select
              value={selectedClientName}
              onChange={(e) => setSelectedClientName(e.target.value)}
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white transition-all"
            >
              <option value="All">כל הלקוחות</option>
              {uniqueClients.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            {/* Date/Month Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white transition-all"
            >
              <option value="All">כל התאריכים</option>
              <option value="This Month">החודש</option>
              <option value="Next Month">חודש הבא</option>
              <option value="Custom">טווח תאריכים מותאם...</option>
            </select>

          </div>

          {/* Reset Filters */}
          {(searchQuery || paymentFilter !== 'All' || selectedClientName !== 'All' || dateFilter !== 'All') && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1.5 text-xs text-slate-gray hover:text-ink-black transition-colors py-2 px-3 border border-gray-150 rounded-xl bg-gray-50/50 hover:bg-gray-50 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>נקה מסננים</span>
            </button>
          )}

        </div>

        {/* Custom Date Inputs Row */}
        {dateFilter === 'Custom' && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-gray-100"
          >
            <div className="flex-1 flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-gray uppercase tracking-wider shrink-0">מתאריך:</span>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-10 bg-gray-50 border-gray-200 rounded-xl"
              />
            </div>
            <div className="flex-1 flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-gray uppercase tracking-wider shrink-0">עד תאריך:</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-10 bg-gray-50 border-gray-200 rounded-xl"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Table / Empty State Container */}
      <Card className="overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        {isLoading ? (
          <div className="p-16 text-center text-slate-gray text-xs font-medium">טוען אירועים...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 sm:p-16 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-canvas-cream flex items-center justify-center text-slate-gray mb-1">
              <CalendarOff className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-ink-black font-bold font-heading">
                {events.length === 0 ? 'טרם נרשמו אירועים ביומן' : 'לא נמצאו אירועים התואמים את הסינון'}
              </p>
              <p className="text-xs text-slate-gray">
                {events.length === 0 ? 'לחץ על "תזמן אירוע" ליצירת אירוע חדש ביומן' : 'נסה לשנות את ערכי הסינון או ללחוץ על "נקה מסננים"'}
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תאריך</TableHead>
                <TableHead>סוג אירוע</TableHead>
                <TableHead>לקוח</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>תעריף</TableHead>
                <TableHead>תשלום</TableHead>
                <TableHead>תיאור</TableHead>
                <TableHead className="text-left">ייצוא ליומן / פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((ev) => (
                <TableRow key={ev._id}>
                  <TableCell className="font-bold text-ink-black">
                    {new Date(ev.date).toLocaleDateString('he-IL')}
                  </TableCell>
                  <TableCell className="font-bold text-ink-black">{getEventTypeHebrew(ev.type)}</TableCell>
                  <TableCell className="font-medium text-slate-gray">
                    {typeof ev.client === 'object' ? ev.client.name : 'ללא לקוח'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      ev.status === 'Scheduled' ? 'scheduled' :
                      ev.status === 'Completed' ? 'completed' : 'cancelled'
                    }>
                      {getStatusHebrew(ev.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-ink-black font-bold font-heading">
                    {ev.amount ? `₪${ev.amount.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ev.isPaid ? 'paid' : 'unpaid'}>
                      {ev.isPaid ? 'שולם' : 'טרם שולם'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-gray max-w-xs truncate">
                    {ev.description || '-'}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end space-x-1.5 space-x-reverse">
                      {/* Apple Calendar iCal Export */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAppleIcsFile(ev)}
                        title="ייצא ל-Apple Calendar / iCal"
                      >
                        <CalendarPlus className="w-3.5 h-3.5 text-ink-black ml-1" />
                        <span>Apple Calendar</span>
                      </Button>

                      {/* Google Calendar Direct Link */}
                      <a
                        href={getGoogleCalendarUrl(ev)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl text-slate-gray hover:text-ink-black hover:bg-canvas-cream transition-colors"
                        title="ייצא ל-Google Calendar"
                      >
                        <CalendarPlus className="w-4 h-4" />
                      </a>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(ev)}
                        title="ערוך אירוע"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(ev._id)}
                        className="hover:text-[#CF4500]"
                        title="מחק אירוע"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Shadcn Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{editingEventId ? 'עריכת אירוע' : 'תזמון אירוע חדש'}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {modalError && (
              <div className="p-3 rounded-xl bg-[#CF4500]/10 border border-[#CF4500]/20 text-[#CF4500] text-xs font-semibold">
                {modalError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">סוג אירוע</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as IServiceEvent['type'])}
                  className="w-full h-10 bg-white border border-[#141413]/15 rounded-xl px-4 py-2 text-xs text-[#141413] focus:outline-none focus:border-[#141413] transition-all"
                >
                  <option value="DJ Gig">תקליטנות (DJ)</option>
                  <option value="Software Development">פיתוח תוכנה</option>
                  <option value="Maintenance">תחזוקה</option>
                  <option value="Consulting">ייעוץ</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">לקוח (אופציונלי)</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full h-10 bg-white border border-[#141413]/15 rounded-xl px-4 py-2 text-xs text-[#141413] focus:outline-none focus:border-[#141413] transition-all"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">תאריך</label>
                <Input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">סכום / תעריף (₪)</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">סטטוס</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IServiceEvent['status'])}
                className="w-full h-10 bg-white border border-[#141413]/15 rounded-xl px-4 py-2 text-xs text-[#141413] focus:outline-none focus:border-[#141413] transition-all"
              >
                <option value="Scheduled">מתוכנן</option>
                <option value="Completed">הושלם</option>
                <option value="Cancelled">בוטל</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">תיאור / הערות</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="פרטי האירוע, מיקום, שעות וכו'..."
                className="w-full bg-white border border-[#141413]/15 rounded-xl px-4 py-2 text-xs text-[#141413] placeholder:text-[#64748B] focus:outline-none focus:border-[#141413] transition-all"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2 space-x-reverse border-t border-ink-black/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? 'שומר...' : editingEventId ? 'עדכן אירוע' : 'תזמן אירוע'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

