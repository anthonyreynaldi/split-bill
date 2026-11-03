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
const form = useForm({
  defaultValues: { name: '' } satisfies CreateEventInput,
  validators: { onChange: CreateEventInputSchema },
  onSubmit: ({ value }) => createEventMutation.mutateAsync(value),
});
```

## Actions
*This table is filled in as features are built. Use one row per action.*

| Action | File | Input DTO | Output | Errors | Purpose |
|---|---|---|---|---|---|
| — | — | — | — | — | — |
