# Event Payment Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a single event be marked paid/unpaid from its own edit form (`frontend/src/pages/Events.tsx`), independent of job status, with the ledger (`Transaction` records) created/deleted automatically so Balances, Dashboard, and Ledger stay in sync without any changes to those files.

**Architecture:** Two new single-event backend endpoints (`POST /events/:id/mark-paid`, `POST /events/:id/mark-unpaid`) mirror the existing bulk `markEventsAsPaidForClient` pattern (create/delete an Income `Transaction` linked via `relatedEvent`, flip `isPaid`). The existing generic `updateEvent` endpoint stays untouched. The frontend adds a payment-status toggle to the event edit dialog, locks the fields baked into the transaction (amount/date/client) while paid, and calls the new endpoints alongside the existing field-update call.

**Tech Stack:** Express + Mongoose + Zod (backend), React + Redux Toolkit Query (frontend), TypeScript throughout. **No test framework exists in this repo** (no jest/vitest/mocha, no `test` script in either `package.json`). Verification in this plan is therefore: (a) `tsc` type-checking via each package's `build` script, and (b) manual `curl`-driven API checks for the backend, and manual browser checks against the Vite dev server for the frontend. Do not introduce a test framework as part of this plan — out of scope.

## Global Constraints

- Binary `isPaid` model only — no partial payments (per `docs/superpowers/specs/2026-08-12-event-payment-toggle-design.md`).
- Marking unpaid must delete **every** `Transaction` with `relatedEvent === event._id` (`deleteMany`, not `deleteOne`).
- Transaction date on mark-paid = the event's own `date` (not "today").
- Amount, Date, and Client are locked (disabled) in the edit form while `isPaid` is `true`. Status and Description remain editable.
- Marking unpaid requires a dedicated danger-styled confirmation naming the amount and date before anything is submitted; marking paid needs no extra confirmation beyond the normal save.
- Backend module resolution in this repo is ESM/NodeNext — all relative imports use an explicit `.js` extension even though the source files are `.ts` (see existing imports in `eventController.ts`).
- Follow existing Hebrew UI copy conventions and existing code style (e.g. the `notes` phrasing already used in `markEventsAsPaidForClient`).

---

## Task 1: Backend — `POST /events/:id/mark-paid`

**Files:**
- Modify: `backend/src/controllers/eventController.ts` (append new export after the existing `markEventsAsPaidForClient`, which currently ends at line 128)
- Modify: `backend/src/routes/eventRoutes.ts`

**Interfaces:**
- Produces: `markEventPaid` controller — `POST /api/events/:id/mark-paid`, no request body, response `{ status: 'success', data: { event: IServiceEvent, transaction: ITransaction } }` on success; `AppError` (404/400) on failure, handled by the existing `errorHandler` middleware.

- [ ] **Step 1: Add the `markEventPaid` controller**

Open `backend/src/controllers/eventController.ts` and add this after the closing brace of `markEventsAsPaidForClient` (after line 128):

```ts
export const markEventPaid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await ServiceEvent.findById(req.params.id);
    if (!event) {
      return next(new AppError('Service event not found', 404));
    }

    if (event.isPaid) {
      return next(new AppError('Event is already marked as paid', 400));
    }

    if (!event.amount || event.amount <= 0) {
      return next(new AppError('Cannot mark a zero-amount event as paid', 400));
    }

    const transaction = await Transaction.create({
      type: 'Income',
      amount: event.amount,
      date: event.date,
      client: event.client,
      serviceType: event.type,
      relatedEvent: event._id,
      notes: `גביית תשלום עבור ${event.description || event.type} מיום ${new Date(event.date).toLocaleDateString('he-IL')}`,
    });

    event.isPaid = true;
    await event.save();
    const populatedEvent = await event.populate('client', 'name type color');

    res.status(200).json({
      status: 'success',
      data: { event: populatedEvent, transaction },
    });
  } catch (error) {
    next(error);
  }
};
```

This file already imports `ServiceEvent`, `Transaction`, and `AppError` at the top (lines 1-4) — no new imports needed.

- [ ] **Step 2: Wire the route**

Open `backend/src/routes/eventRoutes.ts`. Change the import list (lines 2-9) from:

```ts
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  markEventsAsPaidForClient,
} from '../controllers/eventController.js';
```

to:

```ts
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  markEventsAsPaidForClient,
  markEventPaid,
} from '../controllers/eventController.js';
```

Then add a new route right after `router.post('/client/:clientId/mark-paid', markEventsAsPaidForClient);` (line 26):

```ts
router.post('/:id/mark-paid', markEventPaid);
```

- [ ] **Step 3: Type-check the backend**

Run: `npm --prefix "C:\Users\dorfr\Desktop\Vault proj\vault\backend" run build`
Expected: completes with no TypeScript errors (just runs `tsc`, no output on success).

- [ ] **Step 4: Start the dev server for manual verification**

Run in the background: `npm --prefix "C:\Users\dorfr\Desktop\Vault proj\vault\backend" run dev`
Wait for the log line `Backend server running on port 5000`.

- [ ] **Step 5: Get an auth token**

```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"<your dev username>","password":"<your dev password>"}'
```

Copy the `data.token` value from the JSON response into a shell variable for the rest of this plan's verification steps:

```bash
TOKEN="<paste token here>"
```

(If login fails because no user exists yet in this dev DB, register one first with the same payload shape against `POST /api/auth/register` — it only works once, before any user exists.)

- [ ] **Step 6: Create a throwaway test client**

```bash
curl -s -X POST http://localhost:5000/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Payment Toggle Test Client","type":"Private"}'
```

Copy the returned `data.client._id` into `CLIENT_ID`.

- [ ] **Step 7: Create a test event with a positive amount**

```bash
curl -s -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"client\":\"$CLIENT_ID\",\"type\":\"Consulting\",\"date\":\"2026-08-01T00:00:00.000Z\",\"status\":\"Completed\",\"amount\":500}"
```

Copy the returned `data.event._id` into `EVENT_ID`. Confirm the response shows `"isPaid": false`.

- [ ] **Step 8: Call the new mark-paid endpoint and verify**

```bash
curl -s -X POST "http://localhost:5000/api/events/$EVENT_ID/mark-paid" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200`, `data.event.isPaid === true`, `data.transaction.amount === 500`, `data.transaction.relatedEvent === "$EVENT_ID"`, `data.transaction.type === "Income"`.

- [ ] **Step 9: Verify the transaction is visible in the ledger API**

```bash
curl -s "http://localhost:5000/api/transactions?client=$CLIENT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `data.transactions` contains exactly one transaction, amount 500, `relatedEvent` populated with the test event.

- [ ] **Step 10: Verify the "already paid" guard**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://localhost:5000/api/events/$EVENT_ID/mark-paid" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `400`.

- [ ] **Step 11: Verify the "zero amount" guard**

Create a second test event with `"amount":0` (same curl as Step 7 with amount 0), then call mark-paid on its id. Expected: `400`.

- [ ] **Step 12: Commit**

```bash
git add backend/src/controllers/eventController.ts backend/src/routes/eventRoutes.ts
git commit -m "feat: add single-event mark-paid endpoint

Mirrors the existing bulk markEventsAsPaidForClient flow for a single
event, independent of job status, so it can be driven from the event
edit form."
```

---

## Task 2: Backend — `POST /events/:id/mark-unpaid`

**Files:**
- Modify: `backend/src/controllers/eventController.ts` (append after `markEventPaid` from Task 1)
- Modify: `backend/src/routes/eventRoutes.ts`

**Interfaces:**
- Consumes: nothing from Task 1 beyond the file locations already touched.
- Produces: `markEventUnpaid` controller — `POST /api/events/:id/mark-unpaid`, no request body, response `{ status: 'success', data: { event: IServiceEvent, deletedCount: number } }`.

- [ ] **Step 1: Add the `markEventUnpaid` controller**

Append to `backend/src/controllers/eventController.ts`, after `markEventPaid`:

```ts
export const markEventUnpaid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await ServiceEvent.findById(req.params.id);
    if (!event) {
      return next(new AppError('Service event not found', 404));
    }

    if (!event.isPaid) {
      return next(new AppError('Event is not marked as paid', 400));
    }

    const deleteResult = await Transaction.deleteMany({ relatedEvent: event._id });

    event.isPaid = false;
    await event.save();
    const populatedEvent = await event.populate('client', 'name type color');

    res.status(200).json({
      status: 'success',
      data: { event: populatedEvent, deletedCount: deleteResult.deletedCount },
    });
  } catch (error) {
    next(error);
  }
};
```

- [ ] **Step 2: Wire the route**

In `backend/src/routes/eventRoutes.ts`, add `markEventUnpaid` to the import list from `../controllers/eventController.js` (alongside `markEventPaid` added in Task 1), and add:

```ts
router.post('/:id/mark-unpaid', markEventUnpaid);
```

right after the `mark-paid` route added in Task 1.

- [ ] **Step 3: Type-check the backend**

Run: `npm --prefix "C:\Users\dorfr\Desktop\Vault proj\vault\backend" run build`
Expected: no TypeScript errors.

- [ ] **Step 4: Restart the dev server**

If still running from Task 1, `tsx watch` will have already picked up the change automatically. If not running, start it again: `npm --prefix "C:\Users\dorfr\Desktop\Vault proj\vault\backend" run dev`.

- [ ] **Step 5: Verify mark-unpaid reverses Task 1's test event**

Using the same `$TOKEN` and the `$EVENT_ID` from Task 1 (which is currently paid):

```bash
curl -s -X POST "http://localhost:5000/api/events/$EVENT_ID/mark-unpaid" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200`, `data.event.isPaid === false`, `data.deletedCount === 1`.

- [ ] **Step 6: Verify the transaction was actually removed**

```bash
curl -s "http://localhost:5000/api/transactions?client=$CLIENT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `data.transactions` is now empty (the one transaction from Task 1 Step 8 is gone).

- [ ] **Step 7: Verify the "not paid" guard**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://localhost:5000/api/events/$EVENT_ID/mark-unpaid" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `400` (event is already unpaid again after Step 5).

- [ ] **Step 8: Clean up test data**

```bash
curl -s -X DELETE "http://localhost:5000/api/events/$EVENT_ID" -H "Authorization: Bearer $TOKEN"
curl -s -X DELETE "http://localhost:5000/api/clients/$CLIENT_ID" -H "Authorization: Bearer $TOKEN"
```

(Delete the zero-amount test event from Task 1 Step 11 the same way.)

- [ ] **Step 9: Commit**

```bash
git add backend/src/controllers/eventController.ts backend/src/routes/eventRoutes.ts
git commit -m "feat: add single-event mark-unpaid endpoint

Deletes every Transaction linked to the event via relatedEvent and
flips isPaid back to false, reversing mark-paid."
```

---

## Task 3: Frontend — API layer mutations

**Files:**
- Modify: `frontend/src/store/api/eventApi.ts`

**Interfaces:**
- Consumes: `POST /events/:id/mark-paid` and `POST /events/:id/mark-unpaid` from Tasks 1-2 (no request body, event id as the only input).
- Produces: `useMarkEventPaidMutation()` and `useMarkEventUnpaidMutation()` hooks, each taking a single event id `string` as the mutation argument, for Task 5 to consume.

- [ ] **Step 1: Add the two mutations**

In `frontend/src/store/api/eventApi.ts`, insert the following between the end of `markClientEventsAsPaid` (line 82, `}),`) and the closing `}),` / `});` of `injectEndpoints` (lines 83-84):

```ts
    markEventPaid: builder.mutation<
      { status: string; data: { event: IServiceEvent; transaction: ITransaction } },
      string
    >({
      query: (id) => ({
        url: `/events/${id}/mark-paid`,
        method: 'POST',
      }),
      invalidatesTags: ['ServiceEvent', 'Transaction'],
    }),
    markEventUnpaid: builder.mutation<
      { status: string; data: { event: IServiceEvent; deletedCount: number } },
      string
    >({
      query: (id) => ({
        url: `/events/${id}/mark-unpaid`,
        method: 'POST',
      }),
      invalidatesTags: ['ServiceEvent', 'Transaction'],
    }),
```

- [ ] **Step 2: Import `ITransaction` and export the new hooks**

Change the top import (line 2) from:

```ts
import { IServiceEvent } from '../../types/api.js';
```

to:

```ts
import { IServiceEvent, ITransaction } from '../../types/api.js';
```

Change the export block (lines 86-92) from:

```ts
export const {
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useMarkClientEventsAsPaidMutation,
} = eventApi;
```

to:

```ts
export const {
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useMarkClientEventsAsPaidMutation,
  useMarkEventPaidMutation,
  useMarkEventUnpaidMutation,
} = eventApi;
```

- [ ] **Step 3: Confirm the `'Transaction'` and `'ServiceEvent'` tag types are already registered**

Open `frontend/src/store/api/baseApi.ts` and confirm `tagTypes` already includes both `'ServiceEvent'` and `'Transaction'` (it must, since `markClientEventsAsPaid` already invalidates both today). No change expected here — this step is just a sanity check before moving on.

- [ ] **Step 4: Type-check the frontend**

Run: `npm --prefix "C:\Users\dorfr\Desktop\Vault proj\vault\frontend" run build`
Expected: `tsc -b && vite build` completes with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/store/api/eventApi.ts
git commit -m "feat: add markEventPaid/markEventUnpaid RTK Query mutations"
```

---

## Task 4: Frontend — Events.tsx edit dialog: payment toggle UI + field locking

**Files:**
- Modify: `frontend/src/pages/Events.tsx`

**Interfaces:**
- Consumes: nothing new yet (this task is UI/state only — no calls to the Task 3 mutations; that's Task 5).
- Produces: `isPaid` and `originalIsPaid` component state, read by Task 5's `handleSubmit`.

- [ ] **Step 1: Add `isPaid` / `originalIsPaid` state**

In `frontend/src/pages/Events.tsx`, after the existing `amount` state declaration (line 80: `const [amount, setAmount] = useState<string>('');`), add:

```ts
  const [isPaid, setIsPaid] = useState(false);
  const [originalIsPaid, setOriginalIsPaid] = useState(false);
```

- [ ] **Step 2: Populate the new state when opening the edit modal**

In `openEditModal` (lines 196-205), change:

```ts
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
```

to:

```ts
  const openEditModal = (ev: IServiceEvent) => {
    setEditingEventId(ev._id);
    setClientId(typeof ev.client === 'object' ? ev.client._id : ev.client || '');
    setType(ev.type);
    setDate(new Date(ev.date).toISOString().split('T')[0]);
    setDescription(ev.description || '');
    setStatus(ev.status);
    setAmount(ev.amount ? ev.amount.toString() : '0');
    setIsPaid(ev.isPaid);
    setOriginalIsPaid(ev.isPaid);
    setIsModalOpen(true);
  };
```

- [ ] **Step 3: Reset the new state alongside the rest of the form**

In `resetForm` (lines 275-283), change:

```ts
  const resetForm = () => {
    setClientId('');
    setType('DJ Gig');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setStatus('Scheduled');
    setAmount('');
    setEditingEventId(null);
  };
```

to:

```ts
  const resetForm = () => {
    setClientId('');
    setType('DJ Gig');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setStatus('Scheduled');
    setAmount('');
    setIsPaid(false);
    setOriginalIsPaid(false);
    setEditingEventId(null);
  };
```

- [ ] **Step 4: Add the payment-status toggle to the form, and lock amount/date/client while paid**

The form already imports `SegmentedControl` (line 29) and uses it elsewhere in this same file for `viewMode` — reuse it here instead of hand-rolling new toggle buttons.

In the JSX, the Date/Amount fields are the `grid grid-cols-1 sm:grid-cols-2 gap-4` block at lines 666-686. Change:

```tsx
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
```

to:

```tsx
              <div>
                <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">תאריך</label>
                <Input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isPaid}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">סכום / תעריף (₪)</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1500"
                  disabled={isPaid}
                />
              </div>
```

The Client `<select>` is in the earlier `grid grid-cols-1 sm:grid-cols-2 gap-4` block at lines 649-663. Change:

```tsx
              <div>
                <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">לקוח (אופציונלי)</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full h-10 bg-white border border-dust-taupe rounded-2xl px-4 py-2 text-xs text-ink-black focus:outline-none focus:border-ink-black transition-all"
                >
```

to:

```tsx
              <div>
                <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">לקוח (אופציונלי)</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={isPaid}
                  className="w-full h-10 bg-white border border-dust-taupe rounded-2xl px-4 py-2 text-xs text-ink-black focus:outline-none focus:border-ink-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
```

Finally, add the toggle itself. It only makes sense for an existing event, so gate it on `editingEventId`. Insert it right after the "סטטוס" block and before the "תיאור / הערות" block — i.e. between line 699 (`</div>`, closing the status field) and line 701 (`<div>` opening the description field):

```tsx
            {editingEventId && (
              <div>
                <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">סטטוס תשלום</label>
                <SegmentedControl<'paid' | 'unpaid'>
                  value={isPaid ? 'paid' : 'unpaid'}
                  onChange={(v) => setIsPaid(v === 'paid')}
                  options={[
                    { value: 'unpaid', label: 'טרם שולם' },
                    { value: 'paid', label: 'שולם' },
                  ]}
                />
                {isPaid && (
                  <p className="text-[10px] text-slate-gray mt-1.5">
                    בטל את סימון התשלום כדי לערוך תאריך, סכום או לקוח.
                  </p>
                )}
              </div>
            )}
```

- [ ] **Step 5: Type-check the frontend**

Run: `npm --prefix "C:\Users\dorfr\Desktop\Vault proj\vault\frontend" run build`
Expected: no TypeScript errors.

- [ ] **Step 6: Manual browser verification**

1. Run: `npm --prefix "C:\Users\dorfr\Desktop\Vault proj\vault\frontend" run dev` and open the printed local URL.
2. Log in, go to "יומן אירועים ותפעול" (Events).
3. Click "תזמן אירוע" (create) — confirm the payment-status toggle does **not** appear (create mode only shows it in edit mode per this task's gating).
4. Cancel out, then click the edit (pencil) icon on any existing unpaid event — confirm the toggle appears, defaulted to "טרם שולם", and Amount/Date/Client are all enabled/editable.
5. Click "שולם" in the toggle — confirm Amount, Date, and the Client dropdown all become visibly disabled/grayed out, and the helper text appears.
6. Click "טרם שולם" again — confirm the three fields re-enable and the helper text disappears.
7. Close the dialog without saving (this task doesn't wire up submission yet, so no persistence check here).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Events.tsx
git commit -m "feat: add payment-status toggle to event edit form

UI and local state only - lockstep with mark-paid/mark-unpaid wiring
lands in the next commit."
```

---

## Task 5: Frontend — Events.tsx: wire the toggle to the backend, with confirmation on reversal

**Files:**
- Modify: `frontend/src/pages/Events.tsx`

**Interfaces:**
- Consumes: `useMarkEventPaidMutation()`, `useMarkEventUnpaidMutation()` from Task 3; `isPaid`/`originalIsPaid` state from Task 4; the existing `useModal().confirm()` (already imported and used elsewhere in this file, e.g. `handleDelete`).

- [ ] **Step 1: Import and initialize the two new mutation hooks**

Change the import block (lines 4-9) from:

```ts
import {
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} from '../store/api/eventApi.js';
```

to:

```ts
import {
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useMarkEventPaidMutation,
  useMarkEventUnpaidMutation,
} from '../store/api/eventApi.js';
```

Then, right after the existing `const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();` (line 86), add:

```ts
  const [markEventPaid] = useMarkEventPaidMutation();
  const [markEventUnpaid] = useMarkEventUnpaidMutation();
```

- [ ] **Step 2: Wire the confirm-then-submit sequence into `handleSubmit`**

Change the `if (editingEventId) { ... }` branch of `handleSubmit` (lines 212-223) from:

```ts
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
```

to:

```ts
      if (editingEventId) {
        const paidChanged = isPaid !== originalIsPaid;

        if (paidChanged && !isPaid) {
          const isConfirmed = await confirm({
            title: 'ביטול סימון תשלום',
            message: `פעולה זו תמחק את תנועת ההכנסה בסך ₪${(Number(amount) || 0).toLocaleString()} מתאריך ${new Date(date).toLocaleDateString('he-IL')} מספר התנועות, ותסמן את האירוע כטרם שולם. לא ניתן לשחזר את התנועה לאחר המחיקה.`,
            confirmText: 'בטל תשלום ומחק תנועה',
            type: 'danger',
          });
          if (!isConfirmed) return;
        }

        await updateEvent({
          id: editingEventId,
          client: clientId,
          type,
          date: new Date(date).toISOString(),
          description: description || undefined,
          status,
          amount: Number(amount) || 0,
        }).unwrap();

        if (paidChanged) {
          if (isPaid) {
            await markEventPaid(editingEventId).unwrap();
          } else {
            await markEventUnpaid(editingEventId).unwrap();
          }
        }

        setIsModalOpen(false);
        resetForm();
      } else {
```

The `catch` block below already catches and surfaces errors from any `await` in this `try` via `setModalError(err?.data?.message || 'שגיאה בשמירת האירוע')` — no change needed there, since `updateEvent`, `markEventPaid`, and `markEventUnpaid` all throw the same RTK Query error shape on failure (`.unwrap()` rejects with `{ data: { message } }`).

- [ ] **Step 3: Type-check the frontend**

Run: `npm --prefix "C:\Users\dorfr\Desktop\Vault proj\vault\frontend" run build`
Expected: no TypeScript errors.

- [ ] **Step 4: Manual end-to-end browser verification — mark an event paid**

1. With both `npm --prefix backend run dev` and `npm --prefix frontend run dev` running, open the app and log in.
2. Go to Events, edit an existing **unpaid** event with amount > 0. Toggle to "שולם" and click "עדכן אירוע".
3. Expected: dialog closes, no error banner. Re-open the same event's edit dialog — toggle shows "שולם", Amount/Date/Client are disabled.
4. Go to "ספר התנועות" (Ledger) — confirm a new Income transaction appears with the event's amount, dated the event's date.
5. Go to "ניהול גבייה וחובות" (Balances) — confirm this event no longer appears as an open debt for its client (it's paid now, so it's filtered out).
6. Go to the Dashboard — confirm the "open gigs" banner amount decreased by this event's amount.

- [ ] **Step 5: Manual end-to-end browser verification — reverse it**

1. Re-open the same event's edit dialog. Toggle back to "טרם שולם".
2. Click "עדכן אירוע" — expect the danger confirmation dialog naming the correct amount and date.
3. Click the cancel/dismiss option on that confirmation — expect the edit dialog to remain open, nothing saved (re-check Ledger has NOT lost the transaction).
4. Repeat: toggle to "טרם שולם" again, click "עדכן אירוע", this time confirm the deletion.
5. Expected: dialog closes, no error. Ledger no longer shows that transaction. Balances shows the event as an open debt again (if its status is Completed). Dashboard's open-gigs amount increases back.

- [ ] **Step 6: Manual verification — locked-field edit attempt**

1. Edit a **paid** event. Confirm Amount, Date, and the Client dropdown are disabled and cannot be changed via the UI.
2. Change only the Description field and click "עדכן אירוע" — expect this to succeed (Description isn't locked) without touching payment state.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Events.tsx
git commit -m "feat: wire event edit form to mark-paid/mark-unpaid endpoints

Marking unpaid requires a dedicated confirmation naming the ledger
transaction that will be deleted. Balances, Dashboard, and Ledger all
pick up the change automatically via existing ServiceEvent/Transaction
RTK Query tag invalidation - no changes needed in those files."
```

---

## Post-implementation check (against the spec)

- [ ] Binary paid/unpaid only, no partial-payment fields introduced — Tasks 1-5 only ever touch `isPaid`.
- [ ] Reversal deletes all linked transactions via `deleteMany({ relatedEvent })` — Task 2, Step 1.
- [ ] Toggle lives inside the edit form, submitted with the regular save button — Task 4 Step 4, Task 5 Step 2.
- [ ] Dedicated confirmation only on the paid→unpaid direction — Task 5 Step 2.
- [ ] Transaction date = event date, not "today" — Task 1 Step 1 (`date: event.date`).
- [ ] Amount, Date, and Client locked while paid — Task 4 Step 4.
- [ ] Balances/Dashboard/Ledger require no code changes — verified manually in Task 5 Steps 4-5; confirmed by design (they already consume `ServiceEvent`/`Transaction`-tagged queries).
