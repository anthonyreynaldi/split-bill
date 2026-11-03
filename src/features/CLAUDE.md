# src/features: UI per feature (view + view logic)

Every feature folder has the same shape:
```
features/<name>/
  components/   VIEW: pure React. Props in, callbacks out. No fetching, no server imports, no business rules.
  hooks/        VIEW LOGIC: TanStack Query / Form, calls @/server/actions/*, maps errors to UI.
  containers/   GLUE: 'use client' components that call hooks and pass data and callbacks to views.
                Pages render containers. Containers may render form.Field → shared form views.
```

## Rules
- **Components** get data and callbacks through props. They may use `useTranslations` and shadcn `@/components/ui/*`. They must not import from `@/server/**` (ESLint enforces this).
- **Hooks** are the only place that calls Server Actions. Always call them through `unwrap()` from `@/shared/lib/result`.
  - Queries are named `useXxx()` with `queryKey: [feature, …ids]`.
  - Mutations are named `useCreateXxx()` etc. and invalidate the related query keys in `onSuccess`.
  - Forms are named `useXxxForm()` and use TanStack Form with the **zod DTO schema** from `@/shared/dto` as the validator.
- **Pages** (`src/app/[locale]/...`) are thin. They render a feature's container from `containers/`.
- Shared form views live in `src/components/form/` (`TextField`, `useFieldErrors` translates zod messages).
- Every UI string goes through `useTranslations('<feature>')`. Add the keys to **both** `messages/id.json` and `messages/en.json`.
- Show errors with `t('errors.' + errorCodeOf(err))`.
