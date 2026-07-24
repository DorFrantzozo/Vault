import { useState, useMemo } from 'react';
import { Briefcase, CreditCard, CheckCircle2, Pencil, Trash2, X, AlertCircle } from 'lucide-react';
import { useGetEventsQuery, useMarkClientEventsAsPaidMutation, useDeleteEventMutation, useUpdateEventMutation } from '../store/api/eventApi.js';
import { useGetClientsQuery } from '../store/api/clientApi.js';
import { IServiceEvent } from '../types/api.js';
import { useModal } from '../components/common/ModalContext.js';

import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function Balances() {
  const { confirm, showAlert } = useModal();
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  
  const { data: eventsData, isLoading: isLoadingEvents } = useGetEventsQuery();
  const { isLoading: isLoadingClients } = useGetClientsQuery();
  const [markPaid, { isLoading: isMarking }] = useMarkClientEventsAsPaidMutation();
  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();

  const events = eventsData?.data?.events || [];
  const isLoading = isLoadingEvents || isLoadingClients;

  // Compute Top Summary Data
  const { totalOutstanding, totalScheduled, debtorCount } = useMemo(() => {
    let outstanding = 0;
    let scheduled = 0;
    const debtors = new Set<string>();

    events.forEach(ev => {
      if (!ev.isPaid && ev.amount > 0) {
        const clientId = typeof ev.client === 'object' ? ev.client._id : ev.client;
        if (ev.status === 'Completed') {
          outstanding += ev.amount;
          debtors.add(clientId);
        } else if (ev.status === 'Scheduled') {
          scheduled += ev.amount;
        }
      }
    });

    return {
      totalOutstanding: outstanding,
      totalScheduled: scheduled,
      debtorCount: debtors.size,
    };
  }, [events]);

  // Compute Client Specific Balances
  const openBalances = useMemo(() => {
    const balances = new Map<string, { clientName: string; clientColor?: string; totalAmount: number; completedCount: number; events: IServiceEvent[] }>();

    events.forEach(ev => {
      if (!ev.isPaid && ev.amount > 0) {
        const clientId = typeof ev.client === 'object' ? ev.client._id : ev.client;
        const clientName = typeof ev.client === 'object' ? ev.client.name : 'לקוח לא ידוע';
        const clientColor = typeof ev.client === 'object' ? ev.client.color : undefined;
        
        if (!balances.has(clientId)) {
          balances.set(clientId, { clientName, clientColor, totalAmount: 0, completedCount: 0, events: [] });
        }
        
        const clientData = balances.get(clientId)!;
        if (ev.status === 'Completed') {
          clientData.totalAmount += ev.amount;
          clientData.completedCount += 1;
        }
        clientData.events.push(ev);
      }
    });

    // Sort events in each client card chronologically (oldest unpaid first)
    balances.forEach((data) => {
      data.events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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

  const toggleSelection = (eventId: string) => {
    const newSet = new Set(selectedEventIds);
    if (newSet.has(eventId)) {
      newSet.delete(eventId);
    } else {
      newSet.add(eventId);
    }
    setSelectedEventIds(newSet);
  };

  const selectAllClientEvents = (events: IServiceEvent[]) => {
    const newSet = new Set(selectedEventIds);
    events.forEach(ev => {
      if (ev.status === 'Completed' && !ev.isPaid) {
        newSet.add(ev._id);
      }
    });
    setSelectedEventIds(newSet);
  };

  const deselectAllClientEvents = (events: IServiceEvent[]) => {
    const newSet = new Set(selectedEventIds);
    events.forEach(ev => {
      newSet.delete(ev._id);
    });
    setSelectedEventIds(newSet);
  };

  const handleMarkPaid = async (clientId: string, clientName: string, selectedEvents: IServiceEvent[]) => {
    const totalAmount = selectedEvents.reduce((sum, ev) => sum + ev.amount, 0);
    const eventIds = selectedEvents.map(ev => ev._id);

    const isConfirmed = await confirm({
      title: 'גביית תשלום מרוכז',
      message: `האם למרכז את התשלום עבור ${clientName} בסך ₪${totalAmount.toLocaleString()} עבור ${selectedEvents.length} אירועים נבחרים? פעולה זו תיצור תנועת הכנסה בספר התנועות ותסמן את העבודות הנבחרות כשולמו.`,
      confirmText: 'גבה תשלום',
      type: 'info',
    });

    if (isConfirmed) {
      try {
        const res = await markPaid({ clientId, eventIds }).unwrap();
        // Remove paid events from selection
        const newSet = new Set(selectedEventIds);
        eventIds.forEach(id => newSet.delete(id));
        setSelectedEventIds(newSet);

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
    <div className="space-y-6 sm:space-y-8 text-gray-800 pb-8 font-sans">
      
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="text-right">
          <h1 className="text-2.5xl sm:text-3xl font-medium tracking-tight text-gray-900 font-heading flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-gray-900" />
            <span>ניהול גבייה וחובות</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">ריכוז עבודות פתוחות, חיובים וקבלת תשלומים מלקוחות</p>
        </div>
        <Button
          variant={isEditMode ? 'destructive' : 'outline'}
          onClick={() => setIsEditMode(!isEditMode)}
          className="rounded-xl shadow-sm"
        >
          {isEditMode ? <X className="w-4 h-4 ml-1.5" /> : <Pencil className="w-4 h-4 ml-1.5" />}
          <span>{isEditMode ? 'סיום עריכה' : 'מצב עריכה'}</span>
        </Button>
      </div>

      {/* Top Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">חובות פתוחים לגבייה</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1 font-heading">₪{totalOutstanding.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">אירועים עתידיים (מתוכנן)</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1 font-heading">₪{totalScheduled.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">לקוחות ממתינים לתשלום</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1 font-heading">{debtorCount}</h3>
          </div>
        </div>
      </div>

      {/* Main Grid Container */}
      <Card className="p-0 border-0 shadow-none bg-transparent">
        {isLoading ? (
          <div className="py-20 text-center text-gray-400 font-medium animate-pulse flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Briefcase className="w-8 h-8 mb-2 opacity-50" />
            טוען נתוני גבייה...
          </div>
        ) : openBalances.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-2xl p-16 bg-white flex flex-col items-center justify-center space-y-3 text-center shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-green-500 stroke-[1.5]" />
            <div className="space-y-1">
              <p className="text-base text-gray-900 font-bold font-heading">אין חובות פתוחים!</p>
              <span className="text-xs text-gray-500">כל הגיגים והעבודות שבוצעו שולמו במלואם.</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {openBalances.map((b) => {
              return (
                <div key={b.clientId} className="bg-white border border-gray-150 rounded-2xl overflow-hidden flex flex-col hover:border-gray-200 transition-all shadow-xs group h-full">
                  
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100 flex justify-between items-start bg-gray-50/70">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 font-heading">{b.clientName}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{b.events.length} עבודות פתוחות</p>
                      
                      {b.completedCount > 0 && (
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => selectAllClientEvents(b.events)} className="text-[10px] text-blue-600 hover:underline">בחר הכל</button>
                          <span className="text-[10px] text-gray-300">|</span>
                          <button onClick={() => deselectAllClientEvents(b.events)} className="text-[10px] text-gray-500 hover:underline">נקה בחירה</button>
                        </div>
                      )}
                    </div>
                    <div className="text-left flex flex-col items-end">
                      <span className="text-base font-bold text-gray-900 font-heading">₪{b.totalAmount.toLocaleString()}</span>
                      <span className="text-[10px] text-gray-400">חוב פתוח כולל</span>
                    </div>
                  </div>
                  
                  {/* Events List */}
                  <div className="p-4 flex-1 overflow-y-auto max-h-56 space-y-2">
                    {b.events.map(ev => {
                      const isCompleted = ev.status === 'Completed';
                      const isSelected = selectedEventIds.has(ev._id);
                      return (
                        <div key={ev._id} className="flex justify-between items-center text-xs p-3 rounded-xl bg-gray-50/50 border border-gray-100/70 hover:bg-gray-50 transition-colors">
                          <div className="flex-1 flex items-center pr-1 min-w-0">
                            
                            <div className="w-6 shrink-0 flex items-center justify-center ml-2">
                              {isCompleted && (
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => toggleSelection(ev._id)}
                                  className="w-4 h-4 cursor-pointer accent-gray-900 rounded-sm"
                                  title="סמן אירוע לגבייה"
                                />
                              )}
                            </div>

                            {/* Clear Semantic Status Toggles */}
                            <button
                              onClick={() => handleToggleEventStatus(ev)}
                              disabled={isUpdating}
                              className={`ml-2.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all border ${
                                isCompleted
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              }`}
                              title="לחץ כדי לשנות סטטוס ביצוע"
                            >
                              {isCompleted ? 'בוצע' : 'מתוכנן'}
                            </button>

                            <span className={`font-bold transition-colors shrink-0 ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                              {new Date(ev.date).toLocaleDateString('he-IL')}
                            </span>
                            <span className="text-gray-300 mx-2 shrink-0">•</span>
                            <span className={`text-gray-500 truncate max-w-[120px] ${!isCompleted && 'opacity-60'}`} title={ev.description || ev.type}>
                              {ev.description || ev.type}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse shrink-0">
                            <span className="font-bold text-gray-900">₪{ev.amount.toLocaleString()}</span>
                            {isEditMode && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(ev._id, ev.description || ev.type)}
                                disabled={isDeleting}
                                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="מחק עבודה"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Card Actions (Collection) */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    {(() => {
                      const selectedEvents = b.events.filter(ev => ev.status === 'Completed' && selectedEventIds.has(ev._id));
                      const selectedAmount = selectedEvents.reduce((sum, ev) => sum + ev.amount, 0);
                      const hasSelected = selectedEvents.length > 0;
                      
                      return (
                        <>
                          <Button
                            variant={hasSelected ? "default" : "outline"}
                            className={`w-full rounded-xl transition-all ${
                              hasSelected 
                                ? 'shadow-sm hover:shadow-md'
                                : 'opacity-50 cursor-not-allowed bg-white text-gray-400'
                            }`}
                            onClick={() => handleMarkPaid(b.clientId, b.clientName, selectedEvents)}
                            disabled={isMarking || !hasSelected}
                          >
                            <CreditCard className="w-4 h-4 ml-1.5" />
                            <span>
                              {hasSelected 
                                ? `גבה תשלום מרוכז (₪${selectedAmount.toLocaleString()})`
                                : 'סמן אירועים לגבייה'
                              }
                            </span>
                          </Button>
                          {!hasSelected && (
                            <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-600 justify-center">
                              <AlertCircle className="w-3 h-3" />
                              <span>יש לסמן V בתיבות ליד אירועים שבוצעו כדי לגבות תשלום</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
