import { Types } from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { computeEventPaymentInfo, EventPaymentInfo } from '../utils/paymentStatus.js';

interface EventLike {
  _id: Types.ObjectId | string;
  amount: number;
  date: Date | string;
  status: string;
}

/**
 * Fetches every transaction linked to the given events in a single query and
 * nets Income against Expense per event (so a refund correctly reduces what
 * was collected). This is the only place that should determine "how much has
 * this event actually collected" — controllers must read payment state
 * through here, never from a stored isPaid flag.
 */
export async function getPaymentInfoForEvents(events: EventLike[]): Promise<Map<string, EventPaymentInfo>> {
  const result = new Map<string, EventPaymentInfo>();
  if (events.length === 0) return result;

  const eventIds = events.map((e) => e._id);
  const transactions = await Transaction.find({ relatedEvent: { $in: eventIds } })
    .select('relatedEvent amount type')
    .lean();

  const netByEvent = new Map<string, number>();
  for (const tx of transactions) {
    if (!tx.relatedEvent) continue;
    const key = String(tx.relatedEvent);
    const signedAmount = tx.type === 'Income' ? tx.amount : -tx.amount;
    netByEvent.set(key, (netByEvent.get(key) || 0) + signedAmount);
  }

  const now = new Date();
  for (const event of events) {
    const key = String(event._id);
    const netPaid = netByEvent.get(key) || 0;
    result.set(key, computeEventPaymentInfo(event, netPaid, now));
  }

  return result;
}

export async function getPaymentInfoForEvent(event: EventLike): Promise<EventPaymentInfo> {
  const map = await getPaymentInfoForEvents([event]);
  return map.get(String(event._id))!;
}
