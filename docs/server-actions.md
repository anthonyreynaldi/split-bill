# Server Actions Reference

This is how the frontend talks to the server. Every action:
- lives in `src/server/actions/<feature>.actions.ts` (`'use server'`);
- takes **one** argument, validated by a zod DTO from `src/shared/dto/`;
- returns `ActionResult<T>` and **never throws** to the client:
  ```ts
  type ActionResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: { code: ErrorCode; fieldErrors?: Record<string, string[]> } };
  ```
- gets called from a **hook**, never from a component directly.

`error.code` is translated in the UI via `messages/*.json → errors.<CODE>`.

Common codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `INTERNAL_ERROR`.

## Calling pattern

### Query (read)
```ts
// features/events/hooks/use-events.ts
export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => unwrap(listEvents()),   // unwrap: ok → data, error → throws ActionError
  });
}
```

### Mutation (write)
```ts
export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) => unwrap(createEvent(input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}
```

### Form (TanStack Form + the same zod DTO)
```ts
// The zod schema and its TS type share one name (CreateEventInput).
const form = useForm({
  defaultValues: { name: '', currency: 'IDR' },
  validators: { onSubmit: CreateEventInput },   // same schema the action parses
  onSubmit: ({ value }) => mutation.mutateAsync(value),
});
```

## Actions
Every action returns `ActionResult<Output>`. Every action can also return `VALIDATION_ERROR` and `INTERNAL_ERROR`, so those aren't repeated below.

### Auth: `src/server/actions/auth.actions.ts` → hooks in `features/auth/hooks/use-auth.ts`
| Action | Input DTO | Output | Errors | Purpose |
|---|---|---|---|---|
| `register` | `RegisterInput { email, password }` | `SessionUserDto` | `EMAIL_TAKEN` | Create an account and start a session |
| `login` | `LoginInput { email, password }` | `SessionUserDto` | `INVALID_CREDENTIALS` | Start a session |
| `logout` | none (`undefined`) | `null` | none | End the session |
| `getCurrentUser` | none (`undefined`) | `SessionUserDto \| null` | none | Who is logged in (`null` if nobody) |

```ts
// Example: hooks/use-auth.ts
useQuery({ queryKey: ['auth', 'me'], queryFn: () => unwrap(getCurrentUser(undefined)) });
```

### Events and participants: `src/server/actions/events.actions.ts` → `features/events/hooks/use-events.ts`
Every action here can return `UNAUTHORIZED`. Actions that take an `eventId` return `NOT_FOUND` when the event is missing **or belongs to someone else**, so ids can't be probed.

| Action | Input DTO | Output | Purpose |
|---|---|---|---|
| `listEvents` | none | `EventListItemDto[]` | My events, newest first, with participant and bill counts |
| `createEvent` | `CreateEventInput { name, currency? = 'IDR' }` | `EventDto` | New event |
| `getEventDetail` | `EventIdInput { eventId }` | `EventDetailDto { event, participants, bills }` | Everything the event page needs in **one** call |
| `updateEvent` | `UpdateEventInput { eventId, name?, currency?, settlementMode? }` | `EventDto` | Rename or change settings |
| `deleteEvent` | `EventIdInput` | `null` | Delete the event, its bills and its photos |
| `addParticipant` | `AddParticipantInput { eventId, name }` | `ParticipantDto` | Add a person |
| `renameParticipant` | `RenameParticipantInput { eventId, participantId, name }` | `ParticipantDto` | Rename |
| `removeParticipant` | `RemoveParticipantInput { eventId, participantId }` | `null` | Remove them from all splits; bills they paid lose their payer |

Query keys: `['events']` (list) and `['events', eventId]` (detail). Mutations invalidate these.


### Bills: `src/server/actions/bills.actions.ts` → `features/bills/hooks/use-bills.ts`
Every action here can return `UNAUTHORIZED` and `NOT_FOUND` (an event or bill that is missing or not yours). A bill is always saved **whole**, with all its items, allocations and charges in one transaction.

| Action | Input DTO | Output | Extra errors | Purpose |
|---|---|---|---|---|
| `getBill` | `BillRefInput { eventId, billId }` | `BillDto` (+ signed `imageUrl`) | none | Load a bill for editing |
| `createBill` | `CreateBillInput { eventId, ...BillFormValues }` | `BillDto` | `VALIDATION_ERROR` with `fieldErrors.paidBy` / `items.N.allocations` / `imagePath` when they point outside the event | New bill |
| `updateBill` | `UpdateBillInput { eventId, billId, ...BillFormValues }` | `BillDto` | same as `createBill` | Replace a bill |
| `deleteBill` | `BillRefInput` | `null` | none | Delete a bill and its photo |

`BillFormValues = { title, billDate, paidBy, imagePath, chargeSplitMode, items[{ name, qty, unitPrice, total, splitMode, allocations[{ participantId, units }] }], charges[{ kind, mode, value }] }`. Money is in integer minor units.

The editor's live preview runs the **same** pure `calculateBill()` from `src/domain` in the browser, so on-screen totals always match the server.
