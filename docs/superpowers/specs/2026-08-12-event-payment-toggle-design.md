# Event Payment Toggle — Design

## Problem

Payment status (`isPaid`) on a `ServiceEvent` can currently only be flipped in bulk from the Balances page (`markEventsAsPaidForClient`), and only in one direction (unpaid → paid). There is no way to:
- Mark a single event as paid/unpaid from the event's own edit form, independent of whether the underlying job (`status`) is Scheduled or Completed.
- Reverse a payment (paid → unpaid) at all, anywhere in the app.

The user wants a "שולם / טרם שולם" (paid / not paid) toggle inside the event edit dialog (`frontend/src/pages/Events.tsx`), usable before or after the event is marked Completed, that stays synchronized with the ledger (`Transaction` records), Balances/debts, and the Dashboard's open-balance stat.

## Current state (relevant code)

- `ServiceEvent` model: `status` ('Scheduled'|'Completed'|'Cancelled') and `isPaid` (boolean) are independent fields.
- `Transaction` model has an optional, unindexed `relatedEvent` ref to `ServiceEvent`.
- `markEventsAsPaidForClient` (`backend/src/controllers/eventController.ts`) is the only place that ever sets `isPaid: true` today. Given a client + explicit `eventIds`, it creates one `Transaction` (`type: 'Income'`, `amount: ev.amount`, `date: ev.date`, `relatedEvent: ev._id`) per event and bulk-sets `isPaid: true` via `updateMany`. Nothing ever sets `isPaid` back to `false`, and nothing ever deletes those transactions automatically.
- The generic `updateEvent` controller does a blind `findByIdAndUpdate(req.params.id, req.body)` — no side effects. It accepts `isPaid` in its Zod schema but no caller sends it today.
- Three read surfaces already consume `isPaid` correctly and require no changes: `Balances.tsx` (open-debts grouping/totals), `Dashboard.tsx` (open-gigs banner), `Events.tsx` list filter (`paymentFilter`).
- Dead/unwired code exists for a *derived, partial-payment* model (`backend/src/utils/paymentStatus.ts`, `backend/src/services/eventPaymentService.ts`, `frontend/src/components/common/RecordPaymentDialog.tsx`) — broken imports, no route, not used anywhere. Explicitly **out of scope**; this design keeps the existing binary `isPaid` flag model.

## Decisions (confirmed with user)

1. **Binary model.** No partial payments. `isPaid: true/false`, matching the existing bulk-collection system.
2. **Reversal auto-deletes the transaction(s).** Turning an event from paid → unpaid deletes every `Transaction` with `relatedEvent === event._id` (handles the edge case of more than one linked transaction) and flips `isPaid` to `false`.
3. **UI placement:** a field inside the existing event edit form (`Events.tsx`), submitted together with the regular "שמור"/"עדכן אירוע" save — not an instant side-button.
4. **Dedicated confirmation for the destructive direction only.** Marking paid → unpaid pops its own danger-styled confirm (via the existing `useModal().confirm()`), naming the amount and date about to be deleted from the ledger, before the form submits. Marking unpaid → paid needs no extra confirmation beyond the normal save.
5. **Transaction date = the event's date** (not "today"), matching the existing bulk-collection behavior — keeps income attributed to the month the work happened, not the month it was recorded.
6. **Amount is locked while paid.** If `isPaid` is true, the Amount field in the edit form is disabled, to prevent the event amount silently drifting from the already-created transaction's amount.
7. **Extension beyond what was explicitly asked (flagged to and accepted by the user):** the same drift risk that applies to Amount also applies to **Date** and **Client**, since both are baked into the transaction at creation time. All three (amount, date, client) are locked while `isPaid` is true; Status and Description remain freely editable since they aren't reflected on the transaction.

## Backend design

### New endpoints (`backend/src/controllers/eventController.ts`)

```
POST /api/events/:id/mark-paid
POST /api/events/:id/mark-unpaid
```

Both sit under the existing `router.use(protect)` in `backend/src/routes/eventRoutes.ts`, registered alongside the existing `/client/:clientId/mark-paid` bulk route (distinct path shape, no collision with `/:id`-style routes).

**`markEventPaid`**
- 404 if event not found.
- 400 (`AppError`) if `event.isPaid` is already `true` ("Event is already marked as paid").
- 400 if `!event.amount || event.amount <= 0` ("Cannot mark a zero-amount event as paid").
- Create one `Transaction`: `type: 'Income'`, `amount: event.amount`, `date: event.date`, `client: event.client`, `serviceType: event.type`, `relatedEvent: event._id`, `notes` in the same Hebrew phrasing style as the bulk flow ("גביית תשלום עבור ... מיום ...").
- Set `event.isPaid = true`, save, populate `client`.
- Respond `{ status: 'success', data: { event, transaction } }`.

**`markEventUnpaid`**
- 404 if event not found.
- 400 if `event.isPaid` is already `false` ("Event is not marked as paid").
- `Transaction.deleteMany({ relatedEvent: event._id })`.
- Set `event.isPaid = false`, save, populate `client`.
- Respond `{ status: 'success', data: { event, deletedCount } }`.

The existing `updateEvent` controller is **not modified** — it keeps being side-effect-free and keeps being called for the ordinary field edits (client/type/date/description/status/amount) exactly as today. `isPaid` is never included in that request body from this form.

### Route wiring

`backend/src/routes/eventRoutes.ts`:
```ts
router.post('/:id/mark-paid', markEventPaid);
router.post('/:id/mark-unpaid', markEventUnpaid);
```

No new Zod schema needed (no request body).

## Frontend design

### API layer (`frontend/src/store/api/eventApi.ts`)

Two new mutations, each `invalidatesTags: ['ServiceEvent', 'Transaction']` — the same tags the existing bulk `markClientEventsAsPaid` already invalidates:

```ts
markEventPaid: builder.mutation<{ status: string; data: { event: IServiceEvent; transaction: ITransaction } }, string>({
  query: (id) => ({ url: `/events/${id}/mark-paid`, method: 'POST' }),
  invalidatesTags: ['ServiceEvent', 'Transaction'],
}),
markEventUnpaid: builder.mutation<{ status: string; data: { event: IServiceEvent; deletedCount: number } }, string>({
  query: (id) => ({ url: `/events/${id}/mark-unpaid`, method: 'POST' }),
  invalidatesTags: ['ServiceEvent', 'Transaction'],
}),
```

Because `Balances.tsx`, `Dashboard.tsx`, and `Ledger.tsx` all already source their data from queries tagged `ServiceEvent`/`Transaction`, invalidating those tags is sufficient to keep them in sync — **no changes needed in those three files.**

### `Events.tsx` edit dialog

- New local state: `isPaid` (current toggle value) and `originalIsPaid` (value when the modal was opened), both set in `openEditModal` from `ev.isPaid` and reset to `false` in `resetForm`/`openCreateModal`.
- Toggle UI renders **only when `editingEventId` is set** (create mode has no payment history to toggle) — a pill/segmented control matching the existing "בוצע/מתוכנן" style already used in `Balances.tsx`, labeled "טרם שולם" / "שולם".
- When `isPaid` is `true`: Amount, Date, and Client fields render `disabled`, with a short helper line under Amount ("בטל תשלום כדי לערוך את הסכום/תאריך/לקוח").
- `handleSubmit` sequence (edit mode only; create mode unchanged):
  1. If `editingEventId && isPaid !== originalIsPaid && isPaid === false` (turning **off**): call `confirm()` with `type: 'danger'`, message naming the event's own amount and date ("פעולה זו תמחק את תנועת ההכנסה בסך ₪{amount} מתאריך {date} מספר התנועות ותסמן את האירוע כטרם שולם. לא ניתן לשחזר. להמשיך?"). If declined, `return` — nothing is submitted, modal stays open.
  2. Call `updateEvent(...)` exactly as today (client/type/date/description/status/amount), unconditionally.
  3. If `isPaid !== originalIsPaid`: call `markEventPaid(editingEventId)` or `markEventUnpaid(editingEventId)` accordingly.
  4. Close modal, reset form; surface any error from any of the three calls via the existing `modalError` state.

Step 2 runs before step 3 so that if the user changed Amount/Date/Client *and* flipped paid→on in the same save (only possible because those fields were unlocked while `isPaid` was still `false`), the transaction created in step 3 is built from the just-persisted values, not stale ones.

## Out of scope

- Partial payments / amount-paid-so-far tracking (the dead `paymentStatus.ts`/`eventPaymentService.ts` code is not revived here).
- Any change to the existing bulk "גבה תשלום מרוכז" flow on `Balances.tsx` — it continues to exist side-by-side as a separate, multi-event convenience path.
- A UI for browsing/filtering the Ledger by related event (noted as a possible future nice-to-have; `getTransactions` has no `relatedEvent` query param today and none is added here).
