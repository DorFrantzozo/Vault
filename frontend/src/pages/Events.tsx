import React, { useState } from 'react';
import { Plus, Trash2, X, CalendarOff, Pencil, CalendarPlus } from 'lucide-react';
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

export default function Events() {
  const { confirm } = useModal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [clientId, setClientId] = useState('');
  const [type, setType] = useState<IServiceEvent['type']>('DJ Gig');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<IServiceEvent['status']>('Scheduled');

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
        }).unwrap();
      } else {
        const res = await createEvent({
          client: clientId,
          type,
          date: new Date(date).toISOString(),
          description: description || undefined,
          status,
        }).unwrap();

        // Prompt user to add to Apple Calendar immediately upon creation
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
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save event', err);
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
    <div className="space-y-6 text-zinc-100 pb-6">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="text-right">
          <h1 className="text-xl font-bold tracking-tight text-white">יומן אירועים ותפעול</h1>
          <p className="text-xs text-zinc-400 mt-0.5">תזמון, עריכה, ניהול וסנכרון אירועים ל-Apple Calendar ו-Google</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-1.5 space-x-reverse bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-4 py-2 rounded-lg shadow-md shadow-indigo-500/20 transition-all text-xs border border-indigo-400/20 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>תזמן אירוע</span>
        </button>
      </div>

      {/* Table / List Section */}
      <div className="bg-[#12131c] border border-zinc-800/90 rounded-xl shadow-md shadow-black/40 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-zinc-400 text-xs">טוען אירועים...</div>
        ) : events.length === 0 ? (
          <div className="border border-dashed border-zinc-800/80 rounded-xl p-10 bg-zinc-900/30 flex flex-col items-center justify-center space-y-2 text-center my-4">
            <CalendarOff className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
            <p className="text-xs text-zinc-300 font-medium">טרם נרשמו אירועים ביומן</p>
            <span className="text-[10px] text-zinc-500">לחץ על "תזמן אירוע" ליצירת אירוע חדש</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 text-[11px] font-semibold uppercase border-b border-zinc-800/80">
                <tr>
                  <th className="px-5 py-3">תאריך</th>
                  <th className="px-5 py-3">סוג אירוע</th>
                  <th className="px-5 py-3">לקוח</th>
                  <th className="px-5 py-3">סטטוס</th>
                  <th className="px-5 py-3">תיאור</th>
                  <th className="px-5 py-3 text-left">ייצוא ליומן / פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                {events.map((ev) => (
                  <tr key={ev._id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-zinc-200">
                      {new Date(ev.date).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-white">{getEventTypeHebrew(ev.type)}</td>
                    <td className="px-5 py-3.5 text-zinc-300">
                      {typeof ev.client === 'object' ? ev.client.name : 'ללא לקוח'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          ev.status === 'Scheduled'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : ev.status === 'Completed'
                            ? 'bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {getStatusHebrew(ev.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 max-w-xs truncate">
                      {ev.description || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-left">
                      <div className="flex items-center justify-end space-x-1.5 space-x-reverse">
                        {/* Apple Calendar iCal Export */}
                        <button
                          onClick={() => downloadAppleIcsFile(ev)}
                          className="px-2 py-1 rounded-md text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 flex items-center gap-1 transition-colors"
                          title="ייצא ל-Apple Calendar / iCal"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Apple Calendar</span>
                        </button>

                        {/* Google Calendar Direct Link */}
                        <a
                          href={getGoogleCalendarUrl(ev)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-md text-zinc-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                          title="ייצא ל-Google Calendar"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-zinc-400" />
                        </a>

                        <button
                          onClick={() => openEditModal(ev)}
                          className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="ערוך אירוע"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ev._id)}
                          className="p-1 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="מחק אירוע"
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

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative z-10 bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingEventId ? 'עריכת אירוע מתוזמן' : 'תזמון אירוע חדש'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">לקוח</label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                >
                  <option value="">-- בחר לקוח --</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">סוג אירוע</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as IServiceEvent['type'])}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                  >
                    <option value="DJ Gig">תקליטנות (DJ)</option>
                    <option value="Software Development">פיתוח תוכנה</option>
                    <option value="Maintenance">תחזוקה</option>
                    <option value="Consulting">ייעוץ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">סטטוס</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as IServiceEvent['status'])}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                  >
                    <option value="Scheduled">מתוכנן</option>
                    <option value="Completed">הושלם</option>
                    <option value="Cancelled">בוטל</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">תאריך</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">תיאור (אופציונלי)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="פירוט ציוד, שעות מופע, או דרישות נוספות..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-4 py-1.5 rounded-lg shadow-md shadow-indigo-500/20 transition-all text-xs border border-indigo-400/20 disabled:opacity-50"
                >
                  {isCreating || isUpdating
                    ? 'שומר...'
                    : editingEventId
                    ? 'עדכן אירוע'
                    : 'שמור אירוע'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
