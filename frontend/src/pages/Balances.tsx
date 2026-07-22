import { useState, useMemo } from 'react';
import { Briefcase, CreditCard, CheckCircle2, Circle, Pencil, Trash2, X } from 'lucide-react';
import { useGetEventsQuery, useMarkClientEventsAsPaidMutation, useDeleteEventMutation, useUpdateEventMutation } from '../store/api/eventApi.js';
import { useGetClientsQuery } from '../store/api/clientApi.js';
import { IServiceEvent } from '../types/api.js';
import { useModal } from '../components/common/ModalContext.js';

import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function Balances() {
  const { confirm, showAlert } = useModal();
  const [isEditMode, setIsEditMode] = useState(false);
  const { data: eventsData, isLoading: isLoadingEvents } = useGetEventsQuery();
  const { isLoading: isLoadingClients } = useGetClientsQuery();
  const [markPaid, { isLoading: isMarking }] = useMarkClientEventsAsPaidMutation();
  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();

  const events = eventsData?.data?.events || [];
  const isLoading = isLoadingEvents || isLoadingClients;

  const openBalances = useMemo(() => {
    const balances = new Map<string, { clientName: string; totalAmount: number; completedCount: number; events: IServiceEvent[] }>();

    events.forEach(ev => {
      if (!ev.isPaid && ev.amount > 0) {
        const clientId = typeof ev.client === 'object' ? ev.client._id : ev.client;
        const clientName = typeof ev.client === 'object' ? ev.client.name : 'לקוח לא ידוע';
        
        if (!balances.has(clientId)) {
          balances.set(clientId, { clientName, totalAmount: 0, completedCount: 0, events: [] });
        }
        
        const clientData = balances.get(clientId)!;
        if (ev.status === 'Completed') {
          clientData.totalAmount += ev.amount;
          clientData.completedCount += 1;
        }
        clientData.events.push(ev);
      }
    });

    return Array.from(balances.entries()).map(([clientId, data]) => ({
      clientId,
      ...data,
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [events]);

  const handleToggleEventStatus = async (ev: IServiceEvent) => {
    try {
      const newStatus = ev.status === 'Completed' ? 'Scheduled' : 'Completed';
      await updateEvent({ id: ev._id, status: newStatus }).unwrap();
    } catch (err: any) {
      showAlert('שגיאה', err?.data?.message || 'שגיאה בעדכון סטטוס העבודה.', 'danger');
    }
  };

  const handleMarkPaid = async (clientId: string, clientName: string, totalAmount: number) => {
    const isConfirmed = await confirm({
      title: 'גביית תשלום מרוכז',
      message: `האם למרכז את התשלום עבור ${clientName} בסך ₪${totalAmount.toLocaleString()}? פעולה זו תיצור תנועת הכנסה בספר התנועות ותסמן את כל העבודות כשולמו.`,
      confirmText: 'גבה תשלום',
      type: 'info',
    });

    if (isConfirmed) {
      try {
        const res = await markPaid(clientId).unwrap();
        showAlert(
          'תשלום עודכן',
          res.message || 'התשלום נגבה והעבודות סומנו כהושלמו.',
          'success'
        );
      } catch (err: any) {
        showAlert(
          'שגיאה',
          err?.data?.message || 'שגיאה בעדכון התשלומים.',
          'danger'
        );
      }
    }
  };

  const handleDelete = async (eventId: string, eventDesc: string) => {
    const isConfirmed = await confirm({
      title: 'מחיקת עבודה פתוחה',
      message: `האם אתה בטוח שברצונך למחוק לצמיתות את האירוע/העבודה "${eventDesc}"? הפעולה תמחק את התיעוד מכל המערכת ולא ניתנת לביטול.`,
      confirmText: 'מחק עבודה',
      type: 'danger',
    });

    if (isConfirmed) {
      try {
        await deleteEvent(eventId).unwrap();
        showAlert('נמחק בהצלחה', 'העבודה הוסרה מהמערכת בהצלחה.', 'success');
      } catch (err: any) {
        showAlert('שגיאה', err?.data?.message || 'שגיאה במחיקת העבודה.', 'danger');
      }
    }
  };

  return (
    <div className="space-y-8 text-ink-black pb-8 font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-ink-black/10">
        <div className="text-right">
          <h1 className="text-3xl font-medium tracking-tight text-ink-black font-heading flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-ink-black" />
            <span>ניהול גיגים וחובות</span>
          </h1>
          <p className="text-xs text-slate-gray mt-1 font-sans">ריכוז עבודות פתוחות, חיובים וקבלת תשלומים מלקוחות</p>
        </div>
        <Button
          variant={isEditMode ? 'destructive' : 'outline'}
          onClick={() => setIsEditMode(!isEditMode)}
        >
          {isEditMode ? <X className="w-4 h-4 ml-1" /> : <Pencil className="w-4 h-4 ml-1" />}
          <span>{isEditMode ? 'סיום עריכה' : 'מצב עריכה ומחיקה'}</span>
        </Button>
      </div>

      <Card className="p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        {isLoading ? (
          <div className="py-12 text-center text-slate-gray text-xs">טוען נתונים...</div>
        ) : openBalances.length === 0 ? (
          <div className="border border-dashed border-ink-black/15 rounded-2xl p-10 bg-canvas-cream/50 flex flex-col items-center justify-center space-y-2 text-center">
            <CheckCircle2 className="w-8 h-8 text-ink-black stroke-[1.5]" />
            <p className="text-sm text-ink-black font-bold font-heading">אין חובות פתוחים!</p>
            <span className="text-xs text-slate-gray">כל הגיגים והעבודות שולמו במלואם.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {openBalances.map((b) => (
              <div key={b.clientId} className="bg-lifted-cream border border-ink-black/10 rounded-2xl overflow-hidden flex flex-col hover:border-ink-black/30 transition-all shadow-xs">
                <div className="p-4 border-b border-ink-black/10 bg-canvas-cream/60 flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-ink-black font-heading">{b.clientName}</h3>
                    <p className="text-xs text-slate-gray mt-0.5">{b.events.length} עבודות פתוחות</p>
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-bold text-ink-black font-heading">₪{b.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto max-h-48 space-y-2">
                  {b.events.map(ev => (
                    <div key={ev._id} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-canvas-cream/40 border border-ink-black/10">
                      <div className="flex-1 flex items-center pr-1">
                        <button 
                          onClick={() => handleToggleEventStatus(ev)}
                          disabled={isUpdating}
                          className="flex items-center justify-center p-1 rounded-full transition-colors hover:bg-black/5 ml-2 cursor-pointer focus:outline-none"
                          title={ev.status === 'Completed' ? 'סמן כמתוכנן' : 'סמן כבוצע'}
                        >
                          {ev.status === 'Completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-gray opacity-50" />
                          )}
                        </button>
                        <span className={`font-bold transition-colors ${ev.status === 'Completed' ? 'text-ink-black' : 'text-slate-gray'}`}>
                          {new Date(ev.date).toLocaleDateString('he-IL')}
                        </span>
                        <span className="text-slate-gray mx-2">•</span>
                        <span className={`text-slate-gray truncate max-w-[120px] inline-block align-bottom ${ev.status !== 'Completed' && 'opacity-60'}`}>
                          {ev.description || ev.type}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="font-bold text-ink-black">₪{ev.amount.toLocaleString()}</span>
                        {isEditMode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(ev._id, ev.description || ev.type)}
                            disabled={isDeleting}
                            className="h-7 w-7 text-[#CF4500]"
                            title="מחק עבודה"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-ink-black/10 bg-canvas-cream/40">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => handleMarkPaid(b.clientId, b.clientName, b.totalAmount)}
                    disabled={isMarking || b.completedCount === 0}
                  >
                    <CreditCard className="w-4 h-4 ml-1.5" />
                    <span>{b.completedCount > 0 ? `גבה תשלום על ${b.completedCount} עבודות` : 'אין עבודות לגבייה'}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
