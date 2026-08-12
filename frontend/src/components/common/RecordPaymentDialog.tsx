import { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { IServiceEvent, PaymentMethod } from '../../types/api.js';
import { useRecordEventPaymentMutation } from '../../store/api/eventApi.js';
import { useModal } from './ModalContext.js';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface RecordPaymentDialogProps {
  event: IServiceEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecorded?: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'BankTransfer', label: 'העברה בנקאית' },
  { value: 'Cash', label: 'מזומן' },
  { value: 'Bit', label: 'ביט' },
  { value: 'CreditCard', label: 'כרטיס אשראי' },
  { value: 'Other', label: 'אחר' },
];

/**
 * The single entry point for "the client paid me". Records a real payment
 * (full or partial) against an event — this creates one ledger transaction
 * and the event's payment status is re-derived from it automatically, so
 * there is nothing else to keep in sync.
 */
export function RecordPaymentDialog({ event, open, onOpenChange, onRecorded }: RecordPaymentDialogProps) {
  const { showAlert } = useModal();
  const [recordPayment, { isLoading }] = useRecordEventPaymentMutation();

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('BankTransfer');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (event && open) {
      setAmount(event.balanceDue ? String(event.balanceDue) : String(event.amount || ''));
      setMethod('BankTransfer');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError(null);
    }
  }, [event, open]);

  if (!event) return null;

  const parsedAmount = Number(amount);
  const isPartial = parsedAmount > 0 && parsedAmount < event.balanceDue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedAmount || parsedAmount <= 0) {
      setError('יש להזין סכום גדול מאפס');
      return;
    }

    try {
      await recordPayment({
        id: event._id,
        amount: parsedAmount,
        method,
        date: new Date(date).toISOString(),
        notes: notes || undefined,
      }).unwrap();

      onOpenChange(false);
      onRecorded?.();
      showAlert(
        isPartial
          ? `נרשם תשלום חלקי של ₪${parsedAmount.toLocaleString()}. נותרו ₪${(event.balanceDue - parsedAmount).toLocaleString()} לתשלום.`
          : `נרשם תשלום מלא של ₪${parsedAmount.toLocaleString()}.`,
        'תשלום נרשם',
        'success'
      );
    } catch (err: any) {
      setError(err?.data?.message || 'שגיאה ברישום התשלום');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-ink-black" />
            <span>סימון תשלום</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 rounded-2xl bg-danger-bg border border-danger/20 text-danger text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="text-xs text-slate-gray bg-canvas-cream rounded-2xl p-3 border border-dust-taupe">
            <span className="font-bold text-ink-black">
              {typeof event.client === 'object' ? event.client.name : 'לקוח'}
            </span>
            <span className="mx-1">•</span>
            <span>יתרה לתשלום: </span>
            <span className="font-bold text-ink-black">₪{event.balanceDue.toLocaleString()}</span>
            <span className="mx-1">מתוך</span>
            <span className="font-bold text-ink-black">₪{event.amount.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">
                סכום שהתקבל (₪)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {isPartial && (
                <p className="text-[10px] text-warning mt-1">תשלום חלקי — יישאר יתרה לגבייה</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">
                אמצעי תשלום
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full h-10 bg-canvas-cream border border-dust-taupe rounded-2xl px-4 py-2 text-xs text-ink-black focus:outline-none focus:border-ink-black transition-all"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">
              תאריך קבלה
            </label>
            <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">
              הערה (אופציונלי)
            </label>
            <Input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="לדוגמה: שולם דרך ביט"
            />
          </div>

          <p className="text-[10px] text-slate-gray">
            הפעולה תיצור תנועת הכנסה בספר התנועות ותעדכן את סטטוס התשלום אוטומטית.
          </p>

          <div className="pt-2 flex justify-end space-x-2 space-x-reverse border-t border-ink-black/10">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'שומר...' : 'אשר תשלום'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
