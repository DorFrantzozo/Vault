import React, { useState, useEffect } from 'react';
import { IServiceEvent } from '../../../types/api';
import { useCreateEventMutation, useUpdateEventMutation, useDeleteEventMutation } from '../../../store/api/eventApi';
import { useGetClientsQuery } from '../../../store/api/clientApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { parseSafeDate } from './utils';

interface QuickEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date | null;
  existingEvent?: IServiceEvent | null;
}

export const QuickEventModal: React.FC<QuickEventModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  existingEvent,
}) => {
  const [clientId, setClientId] = useState('');
  const [type, setType] = useState<IServiceEvent['type']>('DJ Gig');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<IServiceEvent['status']>('Scheduled');
  
  const { data: clientsData } = useGetClientsQuery();
  const clients = clientsData?.data?.clients || [];

  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation();

  useEffect(() => {
    if (existingEvent) {
      setClientId(typeof existingEvent.client === 'object' ? existingEvent.client._id : existingEvent.client || '');
      setType(existingEvent.type);
      
      const evDate = parseSafeDate(existingEvent.date);
      setDate(format(evDate, 'yyyy-MM-dd'));
      setTime(format(evDate, 'HH:mm'));
      
      setDescription(existingEvent.description || '');
      setStatus(existingEvent.status);
    } else if (selectedDate) {
      setClientId('');
      setType('DJ Gig');
      setDate(format(selectedDate, 'yyyy-MM-dd'));
      setTime(format(selectedDate, 'HH:mm'));
      setDescription('');
      setStatus('Scheduled');
    }
  }, [existingEvent, selectedDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine date and time to ISO string
    const combinedDate = new Date(`${date}T${time || '12:00'}:00`).toISOString();

    try {
      if (existingEvent) {
        await updateEvent({
          id: existingEvent._id,
          client: clientId || undefined,
          type,
          date: combinedDate,
          description: description || undefined,
          status,
        }).unwrap();
      } else {
        await createEvent({
          client: clientId || '', // In original api, client might be required or string
          type,
          date: combinedDate,
          description: description || undefined,
          status,
          amount: 0,
        }).unwrap();
      }
      onClose();
    } catch (err) {
      console.error('Failed to save event', err);
    }
  };

  const handleDelete = async () => {
    if (!existingEvent) return;
    if (window.confirm('האם אתה בטוח שברצונך למחוק אירוע זה?')) {
      try {
        await deleteEvent(existingEvent._id).unwrap();
        onClose();
      } catch (err) {
        console.error('Failed to delete', err);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg p-6 bg-white rounded-2xl shadow-2xl border-0">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            {existingEvent ? 'עריכת אירוע' : 'תזמון אירוע מהיר'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">סוג אירוע</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as IServiceEvent['type'])}
                className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400/50 transition-all"
              >
                <option value="DJ Gig">תקליטנות (DJ)</option>
                <option value="Software Development">פיתוח תוכנה</option>
                <option value="Maintenance">תחזוקה</option>
                <option value="Consulting">ייעוץ</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">לקוח</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400/50 transition-all"
              >
                <option value="">-- ללא לקוח --</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">תאריך</label>
              <Input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 bg-gray-50 border-gray-200 rounded-xl px-4"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">שעה</label>
              <Input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-10 bg-gray-50 border-gray-200 rounded-xl px-4"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">סטטוס</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as IServiceEvent['status'])}
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400/50 transition-all"
            >
              <option value="Scheduled">מתוכנן</option>
              <option value="Completed">הושלם</option>
              <option value="Cancelled">בוטל</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">תיאור</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400/50 transition-all"
            />
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-gray-100 mt-6">
            {existingEvent ? (
              <Button type="button" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleDelete} disabled={isDeleting}>
                <Trash2 className="w-4 h-4 ml-1.5" />
                מחק אירוע
              </Button>
            ) : <div />}
            
            <div className="flex space-x-2 space-x-reverse">
              <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
                ביטול
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating} className="rounded-xl shadow-md">
                {isCreating || isUpdating ? 'שומר...' : 'שמור אירוע'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
