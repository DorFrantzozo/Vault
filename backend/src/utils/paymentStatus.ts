export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface EventPaymentInfo {
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  /** Backward-compatible boolean, always derived — never trust a stored flag. */
  isPaid: boolean;
  isOverdue: boolean;
  daysOverdue: number;
}

interface EventLike {
  amount: number;
  date: Date | string;
  status: string;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Single source of truth for "has this event been paid". Payment state is
 * always computed from real ledger transactions net of refunds/corrections —
 * never from a manually-toggled flag — so it can never drift from reality.
 * Every controller that returns event data must run it through this function
 * before sending a response.
 */
export function computeEventPaymentInfo(
  event: EventLike,
  netPaid: number,
  now: Date = new Date()
): EventPaymentInfo {
  const amount = event.amount || 0;
  // Round to cents to avoid floating point noise leaking into the UI.
  const amountPaid = Math.round(netPaid * 100) / 100;

  let paymentStatus: PaymentStatus;
  if (amount <= 0) {
    // Nothing was ever owed for this event (e.g. a no-charge placeholder).
    paymentStatus = 'paid';
  } else if (amountPaid <= 0) {
    paymentStatus = 'unpaid';
  } else if (amountPaid >= amount) {
    paymentStatus = 'paid';
  } else {
    paymentStatus = 'partial';
  }

  const balanceDue = Math.max(0, Math.round((amount - amountPaid) * 100) / 100);

  const eventDate = new Date(event.date);
  const eventHasPassed = eventDate.getTime() < now.getTime();
  const isOverdue = paymentStatus !== 'paid' && amount > 0 && event.status !== 'Cancelled' && eventHasPassed;
  const daysOverdue = isOverdue
    ? Math.max(0, Math.floor((now.getTime() - eventDate.getTime()) / MS_PER_DAY))
    : 0;

  return {
    amountPaid,
    balanceDue,
    paymentStatus,
    isPaid: paymentStatus === 'paid',
    isOverdue,
    daysOverdue,
  };
}
