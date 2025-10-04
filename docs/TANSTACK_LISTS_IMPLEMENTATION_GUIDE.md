# Comprehensive Guide: Building Data Lists with TanStack Query in Next.js (App Router)

This guide documents a reusable, production-ready pattern for building data-heavy lists (tables, cards, galleries) in Next.js with TanStack Query. It’s designed to be generic so you can reuse it across different resources (ads, users, reports, verification requests, etc.).

Use it as a blueprint for:

- Searching, filtering, sorting, and pagination
- React Query caching and invalidation
- Bulk actions and mutations
- Performance and accessibility
- Server API contracts and validation

---

## 1) Architecture overview

- Client (React)
  - Client component page (or a route segment) driving state: search, filters, sort, pagination
  - React Query for data fetching, caching, invalidations
  - UI components (table, list, cards, filters, dialogs)
  - Optional shared contexts (e.g., cities) for cached reference data

- Server (Next.js App Router)
  - REST-style route handlers for GET (list, stats, filters) and POST/PATCH for mutations
  - Zod validation for query/body payloads
  - Auth and role checks (e.g., USER, MODERATOR, ADMIN)
  - Business logic in DAL (data access layer) with Prisma

- Shared
  - Enums generated from Prisma (import from generated enums module)
  - Types imported from Prisma client types

Why this split?

- GET endpoints + React Query are a natural fit for client-driven search/filter UIs
- DAL isolates database logic and keeps routes thin
- Reusability: same endpoints can power other clients (mobile, scripts)

---

## 2) Files to create (typical layout)

- Data Access Layer (DAL)
  - `src/lib/dal/<resource>.ts`
    - list function: accepts a typed filter/sort/pagination object and returns a typed list result
    - detail function: fetches a single item by id
    - stats function: aggregates (counts, charts)
    - mutations: create/update/delete, bulk actions

- API Routes
  - `src/app/api/<resource>/route.ts` (GET list; optionally exports handlers for stats/filters)
  - `src/app/api/<resource>/[id]/route.ts` (GET detail; PATCH/DELETE for single-item mutations)
  - Optional subroutes:
    - `src/app/api/<resource>/stats/route.ts`
    - `src/app/api/<resource>/filters/route.ts`
    - `src/app/api/<resource>/bulk/route.ts`

- Client Page & Components
  - `src/app/(admin)/panel/<resource>/page.tsx` (or wherever your page lives)
  - Optional shared UI pieces:
    - `src/components/<resource>/<Resource>Row.tsx` (memoized row)
    - `src/components/<resource>/<Resource>Filters.tsx`
    - `src/components/ui/*` (inputs, select, dropdowns, avatar, etc.)
  - React Query Provider (top-level):
    - `src/providers/query-provider.tsx` or use your existing provider

- Validation helpers (optional)
  - `src/lib/validation/<resource>.ts` for zod schemas used by both server & tests

- Contexts (optional for reference data)
  - `src/contexts/<reference>.tsx` (e.g., `cities-context.tsx`) for caching immutable lists

---

## 3) API design: contracts and validation

- Query params (GET list):
  - search: string
  - filters: typed (status, method, category, etc.)
  - sortBy/sortOrder: whitelisted keys (e.g., 'createdAt', 'status') and 'asc'|'desc'
  - page/limit: positive ints; limit guarded (e.g., max 100)

- Response shape (consistent across lists):

```
{
  success: true,
  data: {
    items: T[],      // or `requests`
    total: number,
    totalPages: number,
    page: number,
    limit: number
  }
}
```

- Validation with Zod:
  - Use `z.nativeEnum(YourEnum)` instead of hardcoding strings
  - Normalize `null` → `undefined` for URLSearchParams before parsing
  - Coerce numbers: `z.coerce.number()`

- Auth & role checks:
  - Centralize session retrieval (e.g., `getServerSession`)
  - Enforce role allowlist per resource (e.g., ['ADMIN', 'MODERATOR'])

- Cache headers:
  - For privileged endpoints: `Cache-Control: no-store`
  - For public, cacheable lists: consider ETag/Last-Modified later

---

## 4) Client patterns with TanStack Query

- Query keys: build stable keys from the params

```
const queryKey = ['<resource>-list', { search, filters, sort, page, limit }];
```

- URLSearchParams building on GET
  - Omit empty values
  - For selects, use a sentinel ('all') in the UI but map to ''/undefined in the query

- Staleness and cache
  - `staleTime`: how long results are fresh (e.g., 30s)
  - `gcTime`: how long to cache unused (e.g., 5m)
  - Prefetch related queries (e.g., stats) as needed

- Debounced search
  - Debounce updating the `search` part of state (e.g., 300–500ms) to reduce refetches
  - Reset to page 1 on search/filter changes

- Error & loading states
  - Show skeleton/spinner while loading
  - Show empty-state UI when no results
  - Toast or inline error display on failure

- Invalidation
  - On mutations: `queryClient.invalidateQueries({ queryKey: ['<resource>-list'] })`
  - Invalidate stats queries too if they derive from list data

---

## 5) Filters & sorting: practical details

- UI handling
  - Prefer controlled inputs
  - For Select components, avoid empty string values (use 'all' sentinel and map in code)
  - Persist filter state to URL (optional) for shareable links

- Dates
  - Pass ISO date strings in query params; convert to Date in server validation

- Enums
  - Derive option lists from generated enums: `Object.values(Enum.SomeEnum)`
  - Display human-readable labels with a mapping function

- Sorting
  - Toggle `asc`/`desc` per column header
  - Only allow known columns via server-side whitelist

---

## 6) Pagination

- Keep page state client-side
- Show a small, centered pager with Previous/Next and a window of page numbers
- Derive the visible range text from `page`, `limit`, and `total`
- Always reset page to 1 on filter/search/sort changes

---

## 7) Mutations & bulk actions

- Single-item mutations
  - Use a dedicated PATCH/POST route for the action
  - Validate payload with Zod
  - Return a clear `{ success, data }` object and an actionable message

- Bulk actions
  - Dedicated `/bulk` route (POST) with action field: `{ action: 'approve'|'reject', ids: number[] }`
  - Batch process with partial-failure handling; return `{ successful: number[], failed: { id, error }[] }`
  - UI shows a summary toast with counts and clears selection; optionally prompt for additional fields (e.g., rejection code)

- Optimistic updates (optional)
  - For simple state flips, consider optimistic updates with rollback on error
  - For complex or multi-list effects, prefer invalidations for correctness

---

## 8) Performance & UX

- Memoization
  - Wrap row components in `React.memo` to avoid re-renders
  - Stabilize handlers with `useCallback`

- Virtualization (large datasets)
  - For thousands of rows, integrate `@tanstack/react-virtual` to render only visible items

- Accessibility
  - ARIA labels on inputs
  - Focus management for dialogs and toasts
  - Keyboard navigation for table rows and actions

- Responsive design
  - Mobile-optimized list (card layout) and desktop table layout

---

## 9) Images and files (optional)

- Prefer client-side storageKey → URL resolution (per your image system)
- Use width/crop hints for responsive images
- Detect non-image files and render a download link

---

## 10) Security & auditing

- Role checks at route boundaries; return 401/403 appropriately
- Validate all inputs with Zod; never trust client values
- Audit only for mutations (create/update/delete, bulk)
- Sanitize metadata in logs; avoid sensitive data

---

## 11) Testing strategy

- Unit tests
  - Param parsing utilities (null → undefined, zod schemas)
  - Sorting and filter transform functions

- Integration tests
  - Route handlers: valid/invalid inputs, role checks, edge cases
  - DAL: list queries return expected counts and shapes

- Component tests
  - Filter interaction, debounced search, pagination transitions
  - Mutation flows with success/error toasts

---

## 12) Quality gates & CI

- Typecheck: ensure strict mode passes
- Lint: consistent style and unused imports removal
- Minimal smoke E2E: page loads, list renders, filter changes refetch

---

## 13) Step-by-step checklist (copy/paste)

1. Define the resource contract
   - Data shape, filterable fields, sortable fields, list response contract
2. Build DAL functions
   - list(params), detail(id), stats(), and required mutations
3. Create API routes
   - GET list with zod validation
   - Optional: stats, filters, bulk
   - Auth/role checks; set `Cache-Control: no-store` for privileged routes
4. Wire React Query
   - Query keys, staleTime/gcTime, error/loading handling
   - Debounced search; reset page on filters
5. Build UI
   - Filters bar, table/card rows, pagination controls
   - Dialogs for review/confirm flows
6. Add mutations (single + bulk)
   - Show toasts; invalidate list and stats
7. Optimize
   - Memoize rows; consider virtualization; add accessibility
8. Test & ship
   - Unit for validation utils; route handler integration; basic component tests

---

## 14) Reference snippets

- Zod schema for list query params (example)

```ts
const searchParamsSchema = z.object({
  search: z.string().optional().default(''),
  status: z.nativeEnum(Enum.Status).optional(),
  sortBy: z.enum(['createdAt', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
```

- React Query usage pattern (example)

```ts
const queryParams = { search, status, sortBy, sortOrder, page, limit };
const { data, isLoading, error } = useQuery({
  queryKey: ['resource-list', queryParams],
  queryFn: () =>
    fetch(`/api/resource?${new URLSearchParams(flat(queryParams))}`).then((r) => r.json()),
  staleTime: 30_000,
  gcTime: 300_000,
});
```

- Bulk endpoint contract (example)

```json
{
  "action": "approve", // or "reject"
  "ids": [1, 2, 3],
  "rejectionCode": "OTHER",
  "rejectionNote": "Optional note"
}
```

---

## 15) Common pitfalls and how to avoid them

- Empty string values in Select components
  - Use an 'all' sentinel; map to undefined before sending to server
- URLSearchParams null handling
  - Convert `null` to `undefined` before zod parsing
- Overbroad re-renders
  - Memoize row components; keep handlers stable
- Hardcoded enums
  - Use generated enums in both server validation (z.nativeEnum) and client option lists (Object.values)
- Missing cache headers for privileged data
  - Add `Cache-Control: no-store` to API responses with sensitive content

---

## 16) Adapting for Server Actions (optional)

- Keep GETs as routes (great with React Query)
- Use Server Actions for mutations if you prefer form/action ergonomics
- For client-side calls, wrap actions (e.g., with next-safe-action) and call in React Query mutations

---

## 17) Migration guide (from page to page)

When implementing a new list for a different resource:

- Duplicate the API route and zod schema; rename enums and filters per resource
- Copy the page and adapt:
  - Replace columns and filters
  - Update query key and fetch function path
  - Keep debounced search, pagination, and invalidation patterns
- Update DAL queries to select the right relations and counts

---

Use this guide as a living reference. Add resource-specific notes next to your DAL/API as your domain evolves.
