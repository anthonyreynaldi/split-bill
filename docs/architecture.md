# Architecture

These diagrams use **Mermaid**. They render on GitHub and in VS Code: install the extension *"Markdown Preview Mermaid Support"*, then press `Ctrl+Shift+V`.

## 1. Layers
```mermaid
flowchart LR
  subgraph Client["Browser"]
    V["View<br/>features/*/components<br/>(props in, events out)"]
    H["Hooks<br/>features/*/hooks<br/>(TanStack Query / Form)"]
  end
  subgraph Server["Next.js server"]
    A["Server Actions<br/>server/actions<br/>(parse DTO, call service)"]
    S["Services<br/>server/services<br/>(business rules, ownership)"]
    I["Repository interfaces<br/>server/repositories/interfaces"]
    SB["Supabase repos<br/>repositories/supabase"]
    M["Memory repos<br/>repositories/memory (tests)"]
    O["OcrProvider<br/>providers/ocr"]
    C["container.ts<br/>(wiring)"]
  end
  D["Domain (pure TS)<br/>split · charges · settlement · money"]
  DTO["DTOs (zod)<br/>shared/dto"]
  DB[("Supabase<br/>Postgres + Storage")]
  OR(["OpenRouter"])

  V --> H --> A --> S --> I
  SB -. implements .-> I
  M -. implements .-> I
  S --> D
  S --> O --> OR
  SB --> DB
  C -. injects .-> S
  H -. validates with .-> DTO
  A -. validates with .-> DTO
```
**Rule:** arrows only point inward. Only the files in `repositories/supabase/` know Supabase exists. To replace the database, write `repositories/<new-db>/` and change `container.ts`.

## 2. Data model (ERD)
```mermaid
erDiagram
  users ||--o{ events : owns
  events ||--o{ participants : has
  events ||--o{ bills : has
  events ||--o| share_links : "shared via"
  participants ||--o{ bills : "paid (paid_by)"
  bills ||--o{ bill_items : contains
  bills ||--o{ bill_charges : has
  bill_items ||--o{ item_allocations : "split into"
  participants ||--o{ item_allocations : consumes

  users { uuid id PK
    text email UK
    text password_hash
    timestamptz created_at }
  events { uuid id PK
    uuid owner_id FK
    text name
    text currency
    text settlement_mode "per_bill | nett" }
  participants { uuid id PK
    uuid event_id FK
    text name }
  bills { uuid id PK
    uuid event_id FK
    text title
    date bill_date
    uuid paid_by FK
    text image_path
    text charge_split_mode "proportional | even"
    jsonb ocr_raw }
  bill_items { uuid id PK
    uuid bill_id FK
    text name
    numeric qty
    bigint unit_price
    bigint total
    text split_mode "even | custom" }
  item_allocations { uuid item_id FK
    uuid participant_id FK
    numeric units }
  bill_charges { uuid id PK
    uuid bill_id FK
    text kind "tax | service | discount"
    text mode "percent | amount"
    numeric value }
  share_links { uuid id PK
    uuid event_id FK
    text slug UK
    text passcode_hash
    int failed_attempts
    bool enabled }
```

## 3. How a bill is calculated
```mermaid
flowchart TD
  I["Each item total"] --> E{"split_mode"}
  E -- even --> EV["total ÷ all participants<br/>(largest remainder)"]
  E -- custom --> CU["total × units_i ÷ Σunits<br/>(largest remainder)"]
  EV --> ST["Person item subtotal"]
  CU --> ST
  ST --> CH{"charge_split_mode"}
  CH -- proportional --> P["charge × subtotal_i ÷ Σsubtotal"]
  CH -- even --> Q["charge ÷ people on bill"]
  P --> T["Person bill total = subtotal + tax + service − discount"]
  Q --> T
  T --> BAL["Balance_i = paid_i − owed_i (across all bills)"]
  BAL --> SM{"settlement_mode"}
  SM -- per_bill --> PB["Each person → bill payer, per bill"]
  SM -- nett --> NT["Greedy: largest debtor pays largest creditor<br/>(≤ n−1 transfers)"]
```

## 4. OCR flow
```mermaid
sequenceDiagram
  actor U as Creator
  participant H as useOcrUpload (hook)
  participant A as ocr.actions
  participant S as OcrService
  participant ST as ImageStorage (Supabase Storage)
  participant P as OcrProvider (OpenRouter)
  U->>H: choose receipt photo
  H->>A: uploadAndExtract(eventId, file)
  A->>S: extract(session, eventId, file)
  S->>ST: put(file) → image_path
  S->>P: extract(imageBase64)
  P-->>S: JSON text
  S->>S: OcrResultDto.safeParse()
  S-->>A: BillDraftDto (not saved)
  A-->>H: ActionResult<BillDraftDto>
  H-->>U: prefilled bill form, user reviews
  U->>H: Save
  H->>A: createBill(BillInputDto)
```

## 5. Share link flow
```mermaid
sequenceDiagram
  actor V as Viewer
  participant P as /[locale]/s/[slug] page
  participant A as share.actions
  participant S as ShareService
  V->>P: open link
  P->>S: getPublicView(slug, cookie)
  alt no passcode, or valid cookie
    S-->>P: SummaryDto (read-only)
  else passcode required
    S-->>P: PASSCODE_REQUIRED
    V->>A: verifyPasscode(slug, code)
    A->>S: verify (bcrypt, attempt limit)
    S-->>A: ok → signed cookie for this slug
    A-->>V: reload → read-only summary
  end
```
