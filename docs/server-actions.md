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
