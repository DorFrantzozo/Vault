import { IServiceEvent } from '../types/api.js';
import { BadgeProps } from '../components/ui/badge.js';

/**
 * Presentation-only mapping from the server-computed payment status to a
 * label + badge variant. The status itself (paid/partial/unpaid/overdue) is
 * always computed on the backend from real ledger transactions — this file
 * must never re-derive it from raw amounts, only describe how to show it.
 */
export function getPaymentBadge(ev: IServiceEvent): { label: string; variant: NonNullable<BadgeProps['variant']> } {
  if (ev.isOverdue) {
    return { label: `באיחור · ${ev.daysOverdue} ימים`, variant: 'overdue' };
  }
  switch (ev.paymentStatus) {
    case 'paid':
      return { label: 'שולם', variant: 'paid' };
    case 'partial':
      return { label: `שולם חלקית · ${ev.balanceDue.toLocaleString()} ₪ נותרו`, variant: 'partial' };
    case 'unpaid':
    default:
      return { label: 'טרם שולם', variant: 'unpaid' };
  }
}

export function getPaymentMethodHebrew(method?: string): string {
  switch (method) {
    case 'Cash':
      return 'מזומן';
    case 'BankTransfer':
      return 'העברה בנקאית';
    case 'Bit':
      return 'ביט';
    case 'CreditCard':
      return 'כרטיס אשראי';
    case 'Other':
      return 'אחר';
    default:
      return '';
  }
}
