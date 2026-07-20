import React, { useState } from 'react';
import { Plus, Trash2, CalendarOff, Pencil, CalendarPlus } from 'lucide-react';
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

      {/* Table / Empty State Container */}
      <Card className="overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        {isLoading ? (
          <div className="p-16 text-center text-slate-gray text-xs font-medium">טוען אירועים...</div>
        ) : events.length === 0 ? (
          <div className="p-12 sm:p-16 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-canvas-cream flex items-center justify-center text-slate-gray mb-1">
              <CalendarOff className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-ink-black font-bold font-heading">טרם נרשמו אירועים ביומן</p>
              <p className="text-xs text-slate-gray">לחץ על "תזמן אירוע" ליצירת אירוע חדש ביומן</p>
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
              {events.map((ev) => (
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

