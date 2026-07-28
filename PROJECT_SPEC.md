# MUASuites — Project Specification

> **Version:** 0.0.1  
> **Status:** Active Development  
> **Stack:** SvelteKit 5 + Supabase + Tailwind CSS v4 + Cloudflare Workers

---

## 1. Project Overview

MUASuites is a SaaS booking management platform tailored for freelance **Makeup Artists (MUAs)** in Malaysia. It provides a complete workflow:

- **Public-facing MUA profile page** where potential clients can check date availability, estimate travel surcharges, view service packages, and initiate WhatsApp inquiries.
- **Invite-only secure booking funnel** (gated by a unique token) that guides a client through a 5-step checkout flow to reserve a date, select a package, set event details, lock a slot, and submit a deposit receipt.
- **MUA dashboard** for authenticated MUAs to manage their bookings and studio settings.
- **Backend PostgreSQL transactional engine** using Supabase RPC functions (`secure_checkout_slot`, `finalize_receipt_submission`) with row-level locking to prevent double-booking in serverless environments.

### Target Audience

- **Makeup Artists** (MUAs) — primary customers of the platform
- **Clients (brides)** — end users who book via invite links sent by MUAs

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | SvelteKit 5 (Runes) | Full-stack web framework with SSR, form actions, and API routes |
| **UI Library** | shadcn-svelte (bits-ui) | Accessible headless UI primitives (Card, Select, Button, Field, Input, Separator, InputGroup) |
| **Styling** | Tailwind CSS v4 + `tw-animate-css` | Utility-first CSS with custom animations |
| **Font** | Inter Variable (via `@fontsource-variable/inter`) | Primary typeface |
| **Icons** | Lucide Svelte | Icon components |
| **Forms & Validation** | Zod | Client-side and server-side schema validation |
| **Date/Time** | `@internationalized/date` | Internationalised date utilities |
| **Authentication** | Supabase SSR (Auth with Magic Link) | Passwordless email-based auth |
| **Database** | Supabase (PostgreSQL) | Primary data store with Row-Level Security |
| **Maps** | Leaflet + Mapbox Geocoding/Directions APIs | Interactive map display + travel cost estimation |
| **Notifications** | Telegram Bot API | Server-side alert dispatch on new bookings |
| **Calendar** | iCalendar (RFC 5545) | ICS file generation for MUA calendar integration |
| **Hosting** | Cloudflare Workers (adapter) | Edge-deployed SvelteKit app |
| **ORM / Client** | `@supabase/supabase-js` + `@supabase/ssr` | Database access with SSR cookie management |
| **Package Manager** | npm | Dependency management |
| **Language** | TypeScript (strict) | Type safety across the stack |

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Cloudflare Workers                      │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              SvelteKit Application                   │  │
│  │                                                      │  │
│  │  ┌──────────┐   ┌───────────────────┐   ┌────────┐  │  │
│  │  │ Hooks     │──▶│ +layout.server.ts │──▶│ Routes  │  │  │
│  │  │ (Supabase │   │ +layout.ts        │   │ Pattern│  │  │
│  │  │  SSR)    │   │ (Universal client) │   │ (HTTP) │  │  │
│  │  └──────────┘   └───────────────────┘   └────┬───┘  │  │
│  │                                                │      │  │
│  │  ┌─────────────────────────────────────────────▼────┐  │
│  │  │            Data Flow                              │  │
│  │  │                                                    │  │
│  │  │  Server Load Functions (data fetching)              │  │
│  │  │  Form Actions (mutations via RPC)                   │  │
│  │  │  API Routes (calendar, location services)           │  │
│  │  └────────────────────────┬───────────────────────────┘  │
│  └───────────────────────────┼───────────────────────────────┘
│                              │
└──────────────────────────────┼────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
          ▼                    ▼                     ▼
  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
  │   Supabase    │   │   Mapbox     │   │  Telegram Bot    │
  │  PostgreSQL   │   │  Geocoding   │   │  API             │
  │  + RLS + RPC  │   │  Directions  │   │                  │
  │              │   │              │   │  (Notifications)  │
  │  ● muas       │   │  /geocoding │   └──────────────────┘
  │  ● invites    │   │  /directions│
  │  ● bookings   │   │  /search    │
  │  ● packages   │   └──────────────┘
  │  ● mua_configs│
  │  ● blackout   │
  │  _dates       │
  └──────────────┘
```

### Key Architectural Decisions

1. **Serverless-safe transactional integrity**: All critical booking mutations run inside Supabase RPC functions with `SELECT ... FOR UPDATE` row-level locking, preventing double-booking under concurrent serverless invocations.
2. **Token-gated invite flow**: Each booking invite has a unique UUID token; the system validates expiry, usage, and capacity before allowing checkout.
3. **Two-phase checkout**: `secure_checkout_slot` → creates a `CHECKING_OUT` booking (10-minute hold) → `finalize_receipt_submission` → transitions to `PENDING_APPROVAL` and marks invite as used.
4. **Server-side secrets kept private**: Mapbox tokens and Telegram bot tokens are loaded as `$env/static/private`; API routes act as proxies so clients never see raw tokens.

---

## 4. Route Map

### 4.1 Layout Hierarchy

```
+layout.server.ts        — Fetches session from Supabase SSR
+layout.ts               — Creates Supabase client (browser or server), injects session + client into PageData
+layout.svelte           — Renders children with Toaster (svelte-sonner) for toast notifications
```

### 4.2 Public Routes

| Route | File | Auth | Purpose |
|-------|------|------|---------|
| `/` | `+page.svelte` + `$lib/components/landing/*` | None | **Marketing landing page** — hero with sequenced product mockups, problem/comparison, how-it-works, pricing (Free/Pro), FAQ with JSON-LD |
| `/[mua_slug]` | `+page.server.ts` + `+page.svelte` | None | **MUA Public Profile**: calendar availability checker, travel surcharge estimator (Mapbox), Leaflet map, service packages listing, WhatsApp inquiry button |
| `/[mua_slug]/[token]` | `+page.server.ts` + `+page.svelte` | None | **Invite Booking Funnel**: 5-step guided checkout with gating (expired/used/capacity-paused/active), slot locking, receipt upload |
| `/login` | `+page.svelte` | None | Magic link login for MUAs |

### 4.3 Authenticated Dashboard Routes (under `/(dashboard)/`)

| Route | File | Auth | Purpose |
|-------|------|------|---------|
| `/(dashboard)` | `+layout.svelte` | Session required | Dashboard layout with nav bar and logout |
| `/(dashboard)/bookings` | `+page.svelte` | Session required | View and manage MUA bookings |
| `/(dashboard)/settings` | `+page.svelte` | Session required | Studio settings configuration |

### 4.4 API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/calendar/[booking_id]` | GET | Token (query param) | Generate iCalendar `.ics` file for a booking |
| `/api/estimate-travel` | POST | None (server-secret) | Geocode venue address via Mapbox, compute driving distance and surcharge fee |
| `/api/search-location` | GET | None (server-secret) | Autocomplete location search via Mapbox Geocoding |
| `/api/retrieve-location` | GET | None (server-secret) | Resolve Mapbox place ID to coordinates |
| `/api/test-telegram` | GET/POST | None | Test endpoint for Telegram notification dispatch |

---

## 5. Database Schema

### 5.1 Tables

#### `muas` — MUA user accounts (linked to `auth.users`)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK → `auth.users(id)` | Inherited from Supabase Auth |
| `email` | `text` | UNIQUE, NOT NULL | |
| `subscription_plan` | `plan_type` (enum) | DEFAULT 'FREE' | Controls capacity limits |
| `slug` | `text` | UNIQUE, NOT NULL | URL-friendly identifier |
| `created_at` | `timestamptz` | DEFAULT now() | |

#### `mua_configs` — Studio configuration per MUA

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `mua_id` | `uuid` | PK → `muas(id)` | |
| `studio_name` | `text` | | Display name in booking flows |
| `whatsapp_number` | `text` | | WhatsApp contact for inquiries |
| `telegram_chat_id` | `text` | | Telegram chat ID for notifications |
| `duitnow_qr_url` | `text` | | DuitNow QR code for payments |
| `base_lat` | `double precision` | | Studio base latitude for travel calc |
| `base_lng` | `double precision` | | Studio base longitude for travel calc |
| `transport_formula` | `transport_type` (enum) | DEFAULT 'FLAT' | Travel fee formula |
| `rate_per_km` | `numeric` | DEFAULT 0.00 | Per-km rate for travel surcharge |
| `deposit_mode` | `deposit_mode` (enum) | DEFAULT 'FIXED' | FIXED = flat amount, PERCENTAGE = % of total |
| `deposit_value` | `numeric` | DEFAULT 0.00 | Amount or percentage |

#### `packages` — MUA service packages

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `bigint` | PK (auto-increment) | |
| `mua_id` | `uuid` | FK → `muas(id)`, NOT NULL | |
| `name` | `text` | NOT NULL | Package name |
| `price` | `numeric` | NOT NULL | Package price |
| `emoji` | `text` | DEFAULT '💄' | Visual emoji indicator |
| `is_active` | `boolean` | DEFAULT true | Soft-delete/deactivation flag |

#### `invites` — Booking invitation links

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK (gen_random_uuid()) | |
| `mua_id` | `uuid` | FK → `muas(id)`, NOT NULL | |
| `token` | `text` | UNIQUE, NOT NULL | Secure invite token (UUID) |
| `package_id` | `bigint` | FK → `packages(id)` | Pre-selected package (optional) |
| `event_date` | `date` | | Pre-selected date (optional) |
| `transport_fee_override` | `numeric` | DEFAULT 0.00 | Custom transport fee |
| `custom_surcharge` | `numeric` | DEFAULT 0.00 | Additional surcharge |
| `surcharge_remark` | `text` | | Reason for surcharge |
| `deposit_mode_override` | `deposit_mode` (enum) | | Override deposit mode for this invite |
| `deposit_value_override` | `numeric` | | Override deposit value for this invite |
| `is_used` | `boolean` | DEFAULT false | Single-use flag |
| `expires_at` | `timestamptz` | NOT NULL | Link expiration timestamp |
| `created_at` | `timestamptz` | DEFAULT now() | |

#### `bookings` — Booking records

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK (gen_random_uuid()) | |
| `mua_id` | `uuid` | FK → `muas(id)`, NOT NULL | |
| `invite_id` | `uuid` | FK → `invites(id)` | Source invite link |
| `package_id` | `bigint` | FK → `packages(id)` | Selected package |
| `client_name` | `text` | | Bride/client name |
| `client_phone` | `text` | | Malaysian mobile number |
| `event_date` | `date` | NOT NULL | Event date |
| `event_time` | `time` | NOT NULL | Target ready time |
| `venue_address` | `text` | | Event venue |
| `venue_lat` | `double precision` | | Geocoded venue latitude |
| `venue_lng` | `double precision` | | Geocoded venue longitude |
| `total_amount` | `numeric` | NOT NULL | Total price |
| `deposit_amount` | `numeric` | NOT NULL | Deposit paid |
| `balance_amount` | `numeric` | NOT NULL | Remaining balance |
| `receipt_url` | `text` | | Uploaded receipt screenshot |
| `status` | `booking_status` (enum) | NOT NULL, DEFAULT 'CHECKING_OUT' | Current booking state |
| `approval_token` | `text` | UNIQUE | Token for approval (future use) |
| `calendar_uid` | `text` | UNIQUE | Calendar integration UID |
| `locked_at` | `timestamptz` | NOT NULL, DEFAULT now() | When CHECKING_OUT was created |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

#### `blackout_dates` — MUA-blocked dates

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `bigint` | PK (auto-increment) | |
| `mua_id` | `uuid` | FK → `muas(id)`, NOT NULL | |
| `blackout_date` | `date` | NOT NULL | Date to block |
| `reason` | `text` | | Optional remark |

### 5.2 Enums (User-Defined Types)

| Enum | Values | Usage |
|------|--------|-------|
| `plan_type` | `'FREE'`, `'PAID'` | MUA subscription tier |
| `booking_status` | `'CHECKING_OUT'`, `'PENDING_APPROVAL'`, `'CONFIRMED'`, `'CANCELLED'`, `'COMPLETED'` | Booking lifecycle |
| `transport_type` | `'FLAT'`, `'PER_KM'` | Travel cost formula |
| `deposit_mode` | `'FIXED'`, `'PERCENTAGE'` | Deposit calculation mode |

### 5.3 Booking Status Lifecycle

```
                  ┌──────────────────┐
                  │  CHECKING_OUT    │  ← Created by secure_checkout_slot RPC
                  │  (10-min hold)   │    (holds date temporarily)
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
       ┌─────────▶│ PENDING_APPROVAL │  ← receipt uploaded, awaiting MUA confirmation
       │          └────────┬─────────┘
       │                   │
       │          ┌────────▼─────────┐
       │          │    CONFIRMED     │  ← MUA approves booking
       │          └────────┬─────────┘
       │                   │
       │          ┌────────▼─────────┐
       │          │   COMPLETED      │  ← Post-event
       │          └──────────────────┘
       │
       │          ┌──────────────────┐
       └─────────▶│   CANCELLED      │  ← If hold expires or MUA cancels
                  └──────────────────┘
```

**Note:** If a `CHECKING_OUT` booking's `locked_at` is older than 10 minutes, it is considered expired and does not block the date slot from other clients.

### 5.4 RPC Functions

#### `secure_checkout_slot(p_mua_id, p_invite_id, p_package_id, p_event_date, p_event_time, p_client_name, p_client_phone, p_venue_address, p_total_amount, p_deposit_amount, p_balance_amount) RETURNS jsonb`

**Purpose:** Atomic slot reservation with double-booking prevention.

**Logic:**
1. Acquires row-level lock on `mua_configs` for the MUA (serializes concurrent requests)
2. Validates invite (existence, not used, not expired)
3. Checks MUA subscription capacity limits (FREE plan max 2 active bookings)
4. Checks date conflict (no overlapping `CONFIRMED`, `PENDING_APPROVAL`, or active `CHECKING_OUT` bookings)
5. Inserts new booking with status `CHECKING_OUT` and `locked_at = NOW()`
6. Returns `{success, booking_id, locked_until}`

**Returns:** `{ success: true, booking_id: uuid, locked_until: timestamptz }` on success, `{ success: false, error: string }` on failure.

**Error codes:** `INVITE_NOT_FOUND`, `INVITE_ALREADY_USED`, `INVITE_EXPIRED`, `MUA_CAPACITY_EXCEEDED`, `DATE_ALREADY_TAKEN`

#### `finalize_receipt_submission(p_booking_id, p_invite_id, p_receipt_url) RETURNS jsonb`

**Purpose:** Commits a booking after receipt upload, triggers Telegram notification.

**Logic:**
1. Updates booking status from `CHECKING_OUT` → `PENDING_APPROVAL`, sets `receipt_url`
2. Marks invite as `is_used = true`
3. Fetches package and config metadata for notification payload
4. Returns unified JSON config to SvelteKit for Telegram dispatch

**Returns:** `{ success: true, booking: {...}, package: {...}, config: {...} }` or `{ success: false, error: string }`

---

## 6. Main Process Flow (End-to-End)

This section describes the complete end-to-end booking journey across all actors — **Client**, **MUA**, and **System** (MUASuites platform). Each phase maps to specific routes, actions, and database operations in the codebase.

### 6.1 High-Level Process Map

```
 ┌───────────────────────────────────────────────────────────────────────────┐
 │                              END-TO-END FLOW                              │
 ├───────────────────────────────────────────────────────────────────────────┤
 │                                                                           │
 │  PHASE 1 ─── Discovery & Inquiry                                          │
 │  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐                  │
 │  │ Client browses│───▶│ Client opens │───▶│ Client sends│                  │
 │  │ MUA profile   │    │ calendar &   │    │ WhatsApp    │                  │
 │  │ (web)         │    │ travel calc  │    │ inquiry     │                  │
 │  └─────────────┘    └──────────────┘    └──────┬──────┘                  │
 │                                                 │                         │
 │  PHASE 2 ─── Invite Generation                  │                         │
 │                                                 ▼                         │
 │  ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐             │
 │  │ MUA confirms  │───▶│ MUA generates   │───▶│ MUA sends    │             │
 │  │ availability  │    │ invite link     │    │ link to      │             │
 │  │ + transport   │    │ (with fee       │    │ client       │             │
 │  │               │    │  overrides)     │    │ (WhatsApp)   │             │
 │  └──────────────┘    └────────┬────────┘    └──────┬───────┘             │
 │                               │                     │                    │
 │  PHASE 3 ─── Client Booking   │                     │                    │
 │                               ▼                     ▼                    │
 │  ┌──────────────────────────────────────────────────────────────┐       │
 │  │              Client Opens Invite Link                         │       │
 │  │  ┌───────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  ┌────┐│       │
 │  │  │Step 1 │  │ Step 2   │  │ Step 3   │  │ Step 4  │  │Review    ││       │
 │  │  │Date   │─▶│ Package  │─▶│Time +    │─▶│Name +   │─▶│&    ││       │
 │  │  │       │  │          │  │Venue     │  │Phone    │  │Confirm││       │
 │  │  └───────┘  └──────────┘  └──────────┘  └─────────┘  │       ││       │
 │  │                                                       │ Secure││       │
 │  │                                                       │ Slot  ││       │
 │  │                                                       └───┬───┘│       │
 │  └───────────────────────────────────────────────────────────┼─────┘       │
 │                                                               │            │
 │  ┌─────────────────────────────────────────────────────────────▼────┐      │
 │  │  State B: Payment                                                │      │
 │  │  ┌────────────────────┐    ┌─────────────────────────────┐       │      │
 │  │  │ Client sees DuitNow│───▶│ Client transfers deposit     │       │      │
 │  │  │ QR or bank details │    │ & uploads receipt screenshot│       │      │
 │  │  └────────────────────┘    └─────────────┬───────────────┘       │      │
 │  └──────────────────────────────────────────┼────────────────────────┘      │
 │                                             │                              │
 │  PHASE 4 ─── MUA Review & Approval          │                              │
 │  ┌──────────────────────────────────────────▼────────────────────────┐     │
 │  │  System: MUA receives Telegram notification with receipt link      │     │
 │  │  MUA: Logs into dashboard → Reviews receipt                       │     │
 │  │  MUA: Verifies bank transfer → Clicks "Approve"                   │     │
 │  └──────────────────────────────────────────┬────────────────────────┘     │
 │                                             │                              │
 │  PHASE 5 ─── Post-Approval Notifications    │                              │
 │  ┌──────────────────────────────────────────▼────────────────────────┐     │
 │  │  System: Sends confirmed notification to MUA (Telegram)            │     │
 │  │  System: Sends confirmed notification to Client (future)           │     │
 │  │  System: Generates & dispatches .ics calendar file (future)        │     │
 │  └────────────────────────────────────────────────────────────────────┘     │
 └───────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Phase 1 — Discovery & Inquiry

**Actors:** Client, MUA  
**Channel:** WhatsApp (initiated from MUA public profile page)

```
CLIENT                                   MUA SUITES (System)                    MUA
  │                                           │                                 │
  │  1. Searches MUA online / receives         │                                 │
  │     referral                               │                                 │
  │                                           │                                 │
  │  2. Visits /[mua_slug]                    │                                 │
  │─────────────────────────────────────────▶  │                                 │
  │                                           │                                 │
  │     load() fetches:                        │                                 │
  │       - MUA profile + config               │                                 │
  │       - Active packages                    │                                 │
  │       - Blackout dates                     │                                 │
  │       - Occupied dates                     │                                 │
  │                                           │                                 │
  │     Page renders:                          │                                 │
  │       - Studio branding & name             │                                 │
  │       - Calendar (available/occupied)      │                                 │
  │       - Travel estimator (Mapbox)          │                                 │
  │       - Leaflet map (studio base)          │                                 │
  │       - Service packages + prices          │                                 │
  │       - WhatsApp inquiry button            │                                 │
  │◀────────────────────────────────────────── │                                 │
  │                                           │                                 │
  │  3. Client clicks through calendar,        │                                 │
  │     checks date availability, uses         │                                 │
  │     travel estimator to see surcharge      │                                 │
  │                                           │                                 │
  │  4. Client clicks "Inquire on WhatsApp"    │                                 │
  │     (pre-filled with selected date +       │                                 │
  │      estimated travel fee)                 │                                 │
  │─────────────────────────────────────────────────────────▶ WhatsApp chat     │
  │                                           │                                 │
  │  5. Client messages MUA:                   │                                 │
  │     "Hi! I checked your availability       │                                 │
  │      on [date]. Are you free to cover      │                                 │
  │      my bridal event at [venue area]?"     │                                 │
  │◀────────────────────────────────────────────────────────── MUA replies       │
  │                                           │                                 │
  │  6. MUA reviews:                           │                                 │
  │     - Date is indeed free                  │                                 │
  │     - Venue area is within coverage        │                                 │
  │     - Confirms transport surcharge amount  │                                 │
  │                                           │                                 │
```

**Implementation status:** ✅ Fully implemented — `/[mua_slug]` route (public profile page)

---

### 6.3 Phase 2 — Invite Generation (MUA Action)

**Actors:** MUA  
**Channel:** MUASuites Dashboard (authenticated)

```
MUA                                        MUASUites (System)
  │                                              │
  │  1. MUA logs into dashboard                  │
  │     (/login → /bookings)                     │
  │                                              │
  │  2. MUA navigates to invite creation         │
  │     (Settings page or "Create Invite" flow)  │
  │                                              │
  │  3. MUA configures the invite:               │
  │     - Pre-selects package (optional)          │
  │     - Sets transport_fee_override             │
  │     - Sets custom_surcharge (if any)          │
  │     - Sets surcharge_remark                   │
  │     - Overrides deposit_mode/value (optional) │
  │     - Sets expiry date for the link           │
  │                                              │
  │  4. System generates invite record:           │
  │     INSERT INTO invites                       │
  │       (mua_id, token, ...overrides)           │
  │     VALUES (...)                              │
  │                                              │
  │  5. System returns unique invite URL:         │
  │     https://muasuites.com/[mua_slug]/[token]  │
  │◀───────────────────────────────────────────  │
  │                                              │
  │  6. MUA copies the link and sends to         │
  │     client via WhatsApp                       │
  │──────────────────────────────▶ WhatsApp chat  │
```

**Implementation status:** ⚠️ Partial — The `invites` table and its columns (including all override fields) exist in the schema, and the invite token is validated on the `/[mua_slug]/[token]` page. However, the **dashboard UI for generating invites** is currently minimal (the Settings page exists but the invite-creation form may not be fully wired).

**Route:** `/(dashboard)/settings`  
**DB Table:** `invites`  
**DB Columns used:** `transport_fee_override`, `custom_surcharge`, `surcharge_remark`, `deposit_mode_override`, `deposit_value_override`, `expires_at`

---

### 6.4 Phase 3 — Client Booking Funnel

**Actors:** Client  
**Channel:** Web (invite link)  
**Route:** `/[mua_slug]/[token]`

#### 6.4.1 Invite Validation (Server Load)

```
Client opens invite link
        │
        ▼
+page.server.ts load() validates:
  - Invite EXISTS        → 404 if not found
  - MUA SLUG MATCHES     → 404 if mismatch
  - Invite.is_used       → gateState = 'USED'
  - Invite.expires_at    → gateState = 'EXPIRED'
  - FREE plan capacity   → gateState = 'CAPACITY_PAUSED'
    (>= 2 ACTIVE bookings)
  - All clear            → gateState = 'ACTIVE'
        │
        ▼
If ACTIVE, also fetches:
  - Blackout dates
  - Occupied dates (self-excluding this invite's own CHECKING_OUT)
  - MUA config (studio name, deposit mode/value)
  - Active packages (sorted by price)
        │
        ▼
Page renders: 5-step checkout wizard
```

#### 6.4.2 5-Step Checkout Wizard

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: CHOOSE DATE                                         │
│                                                              │
│  ┌──────────────────────────────────────────┐                │
│  │         ◀  January 2026  ▶               │                │
│  │  Su  Mo  Tu  We  Th  Fr  Sa              │                │
│  │              1   2   3   4                │                │
│  │   5   6   7   8   9  10  11               │                │
│  │  12  13  14  15 ● 17  18               │                │
│  │  19  20  21  22  23  24  25              │                │
│  │  26  27  28  29  30  31                  │                │
│  └──────────────────────────────────────────┘                │
│                                                              │
│  - Occupied dates show a dot indicator + muted bg            │
│  - Past dates are disabled                                   │
│  - Client's own active CHECKING_OUT is self-excluded         │
│    from occupied list (they can still see their hold)        │
│                                                              │
│  Validation: step1Schema (date is required)                  │
├─────────────────────────────────────────────────────────────┤
│ Step 2: SELECT A PACKAGE                                     │
│                                                              │
│  ┌──────────────────────────────────────────┐                │
│  │  💄  Bridal Makeup              RM 888   │                │
│  │  👰  Bridal + Trial             RM 1,288 │                │
│  │  👩‍👧  Mother & Bride            RM 1,488 │                │
│  │  🌟  Premium Suite              RM 2,188 │                │
│  └──────────────────────────────────────────┘                │
│                                                              │
│  - Only active packages shown (is_active = true)             │
│  - Sorted by price ascending                                 │
│  - Selected package highlighted with ring + tint             │
│                                                              │
│  Validation: step2Schema (package must be selected)          │
├─────────────────────────────────────────────────────────────┤
│ Step 3: EVENT DETAILS                                        │
│                                                              │
│  Ready Time: [08] : [00] [AM ▼]                              │
│  Selected: 08:00 AM                                          │
│                                                              │
│  Venue Address: [Grand Hyatt KL, Jalan Pinang...        ]    │
│                                                              │
│  Validation: step3Schema (venue ≥ 5 characters)              │
├─────────────────────────────────────────────────────────────┤
│ Step 4: YOUR DETAILS                                         │
│                                                              │
│  Full Name: [...                                    ]        │
│                                                              │
│  WhatsApp Number: [+60] [...                         ]        │
│                                                              │
│  Validation: step4Schema (name ≥ 2 chars, phone /^(601).../) │
├─────────────────────────────────────────────────────────────┤
│ Step 5: REVIEW & CONFIRM                                     │
│                                                              │
│  Service:        💄 Bridal Makeup       RM 888.00            │
│  Event Date:     Thu, 15 Jan 2026                            │
│  Ready Time:     08:00 AM                                    │
│  Venue:          Grand Hyatt KL, Jalan Pinang                │
│  Contact:        Sarah binte Ahmad · +60123456789             │
│                                                              │
│  ┌──────────────────────────────────────┐                    │
│  │ Bridal Makeup              RM 888.00 │                    │
│  │ Transport fee              RM  50.00 │                    │
│  │ ───────────────────────────────────  │                    │
│  │ TOTAL                    RM 938.00   │                    │
│  └──────────────────────────────────────┘                    │
│                                                              │
│  ┌──────────────────────────────────────┐                    │
│  │  Deposit Required:    RM 469.00      │                    │
│  │  Balance:             RM 469.00      │                    │
│  └──────────────────────────────────────┘                    │
│                                                              │
│  ╔══════════════════════════════════════╗                    │
│  ║        Secure My Slot               ║                    │
│  ╚══════════════════════════════════════╝                    │
└─────────────────────────────────────────────────────────────┘
```

#### 6.4.3 Slot Reservation (Secure Slot Action)

```
Client clicks "Secure My Slot"
        │
        ▼
POST /[mua_slug]/[token]?/secureSlot
        │
        ▼
Zod Validation (secureSlotSchema):
  - mua_id:        uuid
  - invite_id:     uuid (nullable)
  - package_id:    positive integer
  - event_date:    YYYY-MM-DD string
  - event_time:    HH:MM or HH:MM:SS string
  - client_name:   min 2 chars
  - client_phone:  Malaysian format /^(601)[0-9]{8,10}$/
  - venue_address: min 5 chars
  - total_amount:  non-negative number
  - deposit_amount: non-negative number
  - balance_amount: non-negative number
        │
    FAIL ──▶ Return 400 with field-level validation errors
        │
    PASS
        │
        ▼
supabase.rpc('secure_checkout_slot', { ... })
        │
        ▼
  ┌─── Database Transaction (Atomic) ──────────────────────┐
  │  1. SELECT ... FOR UPDATE on mua_configs              │
  │     (Row-level lock — serialises concurrent requests) │
  │                                                        │
  │  2. Validate invite: EXISTS? NOT USED? NOT EXPIRED?    │
  │                                                        │
  │  3. Check MUA capacity:                               │
  │     IF subscription_plan = 'FREE'                       │
  │        AND active_bookings >= 2 → REJECT               │
  │                                                        │
  │  4. Check date conflict:                               │
  │     No CONFIRMED/PENDING_APPROVAL/active CHECKING_OUT  │
  │     on target date → OR → REJECT                       │
  │                                                        │
  │  5. INSERT booking with status = 'CHECKING_OUT',       │
  │     locked_at = NOW()                                  │
  │                                                        │
  │  6. RETURN { success, booking_id, locked_until }      │
  └────────────────────────────────────────────────────────┘
        │
    FAIL ──▶ Return 400 with error code + user-facing message
        │
    SUCCESS
        │
        ▼
System fetches mua_configs for bank details
(duitnow_qr_url, studio_name, whatsapp_number)
        │
        ▼
Returns: { success: true, bookingId, bankConfig }
        │
        ▼
Client transitions to STATE B (Payment)
```

#### 6.4.4 Payment & Receipt Upload

```
┌────────────────────────────────────────────┐
│ STATE B: PAYMENT                           │
│                                            │
│  ════════════════════════════════════════  │
│  RESERVATION EXPIRES IN    6:32           │
│  ███████████████░░░░░░░░  65%             │
│  ════════════════════════════════════════  │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │  Transfer Deposit                  │   │
│  │                                    │   │
│  │  RM 469.00 to confirm your slot.   │   │
│  │                                    │   │
│  │  ┌──────────────────────────────┐  │   │
│  │  │                              │  │   │
│  │  │      [DuitNow QR Code]       │  │   │
│  │  │                              │  │   │
│  │  └──────────────────────────────┘  │   │
│  │                                    │   │
│  │  Scan with your banking app        │   │
│  └────────────────────────────────────┘   │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │  Upload Payment Receipt            │   │
│  │                                    │   │
│  │  [Choose File] receipt.jpg         │   │
│  │                                    │   │
│  │  ╔══════════════════════════════╗  │   │
│  │  ║     Submit Receipt           ║  │   │
│  │  ╚══════════════════════════════╝  │   │
│  └────────────────────────────────────┘   │
└────────────────────────────────────────────┘
        │
        ▼
Client uploads receipt
POST /[mua_slug]/[token]?/submitReceipt
        │
        ▼
1. Validate file:
   - File size > 0
   - MIME type ∈ {image/jpeg, image/png, image/webp}
        │
    FAIL ──▶ Return 400 with error
        │
    PASS
        │
        ▼
2. Upload to Supabase Storage:
   Bucket: receipt-uploads
   Path:   receipts/{bookingId}_{timestamp}.{ext}
   Cache:  3600s
        │
    FAIL ──▶ Return 500
        │
    SUCCESS → Get public URL
        │
        ▼
3. supabase.rpc('finalize_receipt_submission', {
     p_booking_id, p_invite_id, p_receipt_url
   })
        │
        ▼
  ┌─── Database Transaction ────────────────────┐
  │  1. UPDATE booking SET                      │
  │       status = 'PENDING_APPROVAL',           │
  │       receipt_url = p_receipt_url            │
  │     WHERE id = p_booking_id                  │
  │       AND status = 'CHECKING_OUT'            │
  │                                              │
  │  2. UPDATE invites SET is_used = TRUE        │
  │     WHERE id = p_invite_id                    │
  │                                              │
  │  3. SELECT package + config metadata         │
  │     → RETURN unified JSON payload            │
  └──────────────────────────────────────────────┘
        │
    FAIL ──▶ Return 500
        │
    SUCCESS
        │
        ▼
4. If config.telegram_chat_id exists:
   Send Telegram notification to MUA:
   ┌──────────────────────────────────────────┐
   │  <b>New Booking Payment Pending Review!</b>│
   │                                          │
   │  <b>Client Details:</b>                   │
   │  • Bride Name: Sarah binte Ahmad         │
   │  • WhatsApp: wa.me/60123456789            │
   │                                          │
   │  <b>Event Details:</b>                    │
   │  • Date: 2026-01-15                      │
   │  • Time: 08:00                           │
   │  • Venue: Grand Hyatt KL                 │
   │                                          │
   │  <b>Financial Breakdown:</b>              │
   │  • Service: 💄 Bridal Makeup             │
   │  • Total: RM 938.00                      │
   │  • Paid: RM 469.00                       │
   │  • Balance: RM 469.00                    │
   │                                          │
   │  👉 Click here to inspect receipt         │
   │    [receipt URL]                          │
   └──────────────────────────────────────────┘
        │
        ▼
5. Return { success: true }
        │
        ▼
Client transitions to STATE C (Success)
```

#### 6.4.5 Success Screen (Client)

```
┌────────────────────────────────────────────┐
│ STATE C: SUCCESS                            │
│                                            │
│              ✅                             │
│                                            │
│         Receipt Submitted!                  │
│                                            │
│  StudioName will verify and confirm         │
│  your booking shortly.                      │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │ Deposit:              RM 469.00    │   │
│  │ Event date:           Thu, 15 Jan  │   │
│  └────────────────────────────────────┘   │
│                                            │
│  ╔══════════════════════════════════════╗  │
│  ║     Notify on WhatsApp              ║  │
│  ╚══════════════════════════════════════╝  │
└────────────────────────────────────────────┘
```

---

### 6.5 Phase 4 — MUA Review & Approval

**Actors:** MUA  
**Channel:** Telegram notification → Dashboard

```
MUA                                                          SYSTEM
  │                                                             │
  │  1. MUA receives Telegram notification                      │
  │     (HTML formatted with all booking details                │
  │      + receipt screenshot link)                             │
  │◀───────────────────────────────────── Telegram Bot API      │
  │                                                             │
  │  2. MUA reviews receipt screenshot                          │
  │     (opens link from Telegram message)                      │
  │                                                             │
  │  3. MUA logs into dashboard at /login                       │
  │     (Magic link via Supabase Auth)                          │
  │─────────────────────────────────────────────▶               │
  │                                                             │
  │  4. MUA navigates to /bookings                              │
  │─────────────────────────────────────────────▶               │
  │                                                             │
  │  5. MUA finds the PENDING_APPROVAL booking                  │
  │                                                             │
  │  6. MUA verifies in their own bank account:                 │
  │     - Checks that the deposit amount was received           │
  │     - Cross-references name/amount with receipt             │
  │                                                             │
  │  7. MUA clicks "Approve" (or "Confirm")                     │
  │     [Status: PENDING_APPROVAL → CONFIRMED]                  │
  │─────────────────────────────────────────────▶               │
  │                                       │                     │
  │                                       ▼                     │
  │                      UPDATE bookings SET                    │
  │                        status = 'CONFIRMED'                 │
  │                      WHERE id = :booking_id                 │
  │                       AND status = 'PENDING_APPROVAL'       │
```

**Implementation status:** ⚠️ Partial — The booking status `PENDING_APPROVAL` and `CONFIRMED` exist in the enum schema. The booking page at `/(dashboard)/bookings` is rendered but the **"Approve" action button is not yet wired** in the current code. The transition must be implemented as a form action or PATCH endpoint on the bookings page.

---

### 6.6 Phase 5 — Post-Approval Notifications

**Actors:** System  
**Channel:** Telegram + future channels

```
MUA APPROVES BOOKING
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│               POST-APPROVAL ACTIONS (planned)            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. Telegram Notification to MUA:                        │
│     "✅ Booking CONFIRMED: Sarah binte Ahmad             │
│       • Date: Thu, 15 Jan 2026, 08:00 AM                │
│       • Venue: Grand Hyatt KL, Jalan Pinang             │
│       • Service: 💄 Bridal Makeup                       │
│       • Deposit: RM 469.00 ✓                             │
│       • Balance: RM 469.00 (due on event day)"          │
│                                                          │
│  2. Telegram / WhatsApp Notification to Client:          │
│     "✅ Your booking with STUNIONAMA has been confirmed! │
│       • Event Date: Thu, 15 Jan 2026 — 08:00 AM         │
│       • Venue: Grand Hyatt KL, Jalan Pinang             │
│       • Service: 💄 Bridal Makeup                       │
│       • Total: RM 938.00                                 │
│       • Deposit Paid: RM 469.00                          │
│       • Balance Due: RM 469.00                           │
│       📎 Add to your calendar: [Download .ics]"          │
│                                                          │
│  3. ICS Calendar File Generation:                        │
│     GET /api/calendar/[booking_id]?token={auth_token}    │
│     → Returns .ics file (RFC 5545) with:                 │
│       - Event: Makeup Session: {client_name}             │
│       - Start: {event_date}T{event_time}                 │
│       - End: +3 hours                                    │
│       - Location: {venue_address}                        │
│       - Description: bride contact, package, pricing     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Implementation status:**

| Action | Status | Details |
|--------|--------|---------|
| Telegram notification to MUA on receipt upload | ✅ Implemented | Sent by `finalize_receipt_submission` + `telegram.server.ts` |
| Telegram notification to MUA on confirmation | ❌ Not implemented | Requires approval action first |
| Notification to Client | ❌ Not implemented | No client contact channel beyond WhatsApp link |
| .ics auto-dispatch | ⚠️ Partial | `/api/calendar/[booking_id]` endpoint exists for on-demand ICS, but not auto-attached to notifications |

---

### 6.7 Dashboard Flow (MUA)

**Route:** `/(dashboard)/` (authenticated)

```
MUA visits /login
        │
        ▼
Magic link email authentication (Supabase Auth)
  - hooks.server.ts initialises SSR client
  - +layout.server.ts fetches session
  - +layout.ts creates universal client
        │
        ▼
Redirects to /bookings (dashboard)
        │
        ▼
Dashboard Layout (+layout.svelte):
  ┌──────────────────────────────────────┐
  │  MUASuites   Bookings  Settings  │Logout│
  │──────────────────────────────────────│
  │                                      │
  │  {@render children()}               │
  │                                      │
  └──────────────────────────────────────┘
        │
        ├── /bookings: View bookings list (page.svelte)
        │   - See all bookings (CONFIRMED, PENDING_APPROVAL, etc.)
        │   - Approve PENDING_APPROVAL → CONFIRMED (TODO)
        │   - Cancel bookings (TODO)
        │   - View booking details
        │
        └── /settings: Studio configuration (page.svelte)
            - Update studio name, WhatsApp number
            - Set base location coordinates
            - Configure transport formula & rates
            - Set deposit mode (FIXED/PERCENTAGE) & value
            - Manage DuitNow QR code URL
            - Manage Telegram chat ID for notifications
            - **Generate invite links** with overrides (TODO/future)
```

**Implementation status:** ⚠️ Partial — Dashboard layout and routing are functional. Bookings list and settings pages render but have limited interactivity (no approval/cancel actions yet, no invite generation UI).

---

### 6.8 Summary: Implementation Status

| # | Flow Step | Route / Component | Status |
|---|-----------|-------------------|--------|
| 1 | Client browses MUA profile | `/[mua_slug]` | ✅ |
| 2 | Client checks availability + travel fee | `/[mua_slug]` (calendar + Mapbox) | ✅ |
| 3 | Client sends WhatsApp inquiry | `/[mua_slug]` (pre-filled link) | ✅ |
| 4 | MUA generates invite link | `/(dashboard)/settings` | ⚠️ Partial (schema + validation exist, UI may be minimal) |
| 5 | Client opens invite link | `/[mua_slug]/[token]` | ✅ |
| 6 | 5-step checkout wizard | `/[mua_slug]/[token]` | ✅ |
| 7 | Slot reservation (CHECKING_OUT) | `secure_checkout_slot` RPC | ✅ |
| 8 | Payment screen with DuitNow QR | `/[mua_slug]/[token]` State B | ✅ |
| 9 | Receipt upload + finalize | `submitReceipt` action + `finalize_receipt_submission` RPC | ✅ |
| 10 | Telegram notification to MUA | `telegram.server.ts` | ✅ |
| 11 | MUA reviews receipt in dashboard | `/(dashboard)/bookings` | ⚠️ Partial (view exists, approval action not wired) |
| 12 | MUA approves booking | `/(dashboard)/bookings` | ❌ Not wired |
| 13 | Client receives confirmation | — | ❌ Not implemented |
| 14 | .ics calendar file auto-dispatch | `/api/calendar/[booking_id]` | ⚠️ Partial (endpoint exists, not auto-triggered) |
---

## 7. Security Model

### 7.1 Authentication

- **Passwordless Magic Link** via Supabase Auth
- Session managed via `@supabase/ssr` with cookie-based persistence
- `hooks.server.ts` initialises a request-scoped Supabase client and `safeGetSession()` helper
- `+layout.server.ts` fetches session for all pages
- `(dashboard)/+layout.svelte` redirects unauthenticated users to `/login`

### 7.2 Row-Level Security (RLS)

All tables have RLS enabled. Key policies:
- **bookings**: MUAs can only see their own bookings (via `mua_id = auth.uid()`)
- **packages**: MUAs manage their own packages
- **invites**: MUAs manage invites linked to their `mua_id`
- **public routes** read from `muas`/`mua_configs`/`packages` using public anon key with appropriate permissive SELECT policies

### 7.3 Server-Side Secrets

| Secret | Stored In | Used By |
|--------|-----------|---------|
| `MAPBOX_ACCESS_TOKEN` | `$env/static/private` | API routes (never exposed to client) |
| `TELEGRAM_BOT_TOKEN` | `$env/static/private` | `telegram.server.ts` |
| `PUBLIC_SUPABASE_URL` | `$env/static/public` | All Supabase clients |
| `PUBLIC_SUPABASE_ANON_KEY` | `$env/static/public` | All Supabase clients |

### 7.4 Input Validation

- **Client-side**: Zod schemas per flow step (step1Schema through step4Schema)
- **Server-side (form actions)**: `secureSlotSchema` validates all booking submission fields
- **File uploads**: MIME type whitelist (`image/jpeg`, `image/png`, `image/webp`)
- **Phone numbers**: Regex `/^(601)[0-9]{8,10}$/` for Malaysian mobile numbers
- **iCalendar**: `escapeIcsText()` sanitises CRLF injection vectors

### 7.5 Transactional Safety

- `secure_checkout_slot` uses `SELECT ... FOR UPDATE` to serialise concurrent booking attempts
- 10-minute CHECKING_OUT timeout releases holds automatically (filtered in queries via `locked_at > NOW() - INTERVAL '10 minutes'`)
- `finalize_receipt_submission` atomically transitions status + marks invite as used

---

## 8. Third-Party Integrations

### 8.1 Mapbox (Geocoding + Directions)

| API Endpoint | Usage | Rate Limit Consideration |
|-------------|-------|------------------------|
| `mapbox.places` geocoding | `/api/search-location` — autocomplete suggestions | 600 req/min on free tier |
| `mapbox/directions` | `/api/estimate-travel` — driving distance for surcharge | 300 req/min on free tier |
| Leaflet tiles (CartoDB) | Static map on public profile | Free, no key required |

### 8.2 Telegram Bot

- Bot token stored in `TELEGRAM_BOT_TOKEN` env var
- `sendTelegramAlert()` sends HTML-formatted messages to configured MUA chat IDs
- 5-second timeout with `AbortController` for serverless safety
- Message includes: client details, event info, financial breakdown, receipt link
- Fired only after successful `finalize_receipt_submission`

### 8.3 Supabase Ecosystem

| Service | Usage |
|---------|-------|
| Auth | Magic link MUA authentication |
| Database (PostgreSQL) | All business data with RLS |
| Storage | Receipt screenshot uploads (`receipt-uploads` bucket) |
| RPC | `secure_checkout_slot`, `finalize_receipt_submission` |

### 8.4 Leaflet (Map Display)

- CartoDB light tile layer (no API key)
- Custom marker with CSS pulse animation
- Restricted zoom control, styled popup
- Loaded as client-side dynamic import (`onMount`)

---

## 9. Data Flow Diagrams

### 9.1 Booking Creation Flow

```
Client               SvelteKit               Supabase            Mapbox/Telegram
  │                     │                       │                     │
  │  POST /secureSlot   │                       │                     │
  ├────────────────────▶│                       │                     │
  │                     │  Zod validation        │                     │
  │                     │  ─────▶                │                     │
  │                     │  supabase.rpc(         │                     │
  │                     │    'secure_checkout_   │                     │
  │                     │    slot', ...)         │                     │
  │                     ├──────────────────────▶│                     │
  │                     │                       │  SELECT ... FOR     │
  │                     │                       │  UPDATE (row lock)  │
  │                     │                       │  Validate invite    │
  │                     │                       │  Check capacity     │
  │                     │                       │  Check date conflict│
  │                     │                       │  INSERT booking     │
  │                     │                       │  (CHECKING_OUT)     │
  │                     │  {success, booking_id}│                     │
  │                     │◀──────────────────────┤                     │
  │  {success,          │                       │                     │
  │   bookingId,        │                       │                     │
  │   bankConfig}       │                       │                     │
  │◀────────────────────┤                       │                     │
  │                     │                       │                     │
  │  State B: Payment   │                       │                     │
  │  ──────────────────▶│                       │                     │
  │                     │                       │                     │
  │  POST /submitReceipt│                       │                     │
  ├────────────────────▶│                       │                     │
  │                     │  Upload receipt to     │                     │
  │                     │  storage               │                     │
  │                     ├──────────────────────▶│                     │
  │                     │                       │                     │
  │                     │  supabase.rpc(         │                     │
  │                     │    'finalize_receipt_  │                     │
  │                     │    submission', ...)   │                     │
  │                     ├──────────────────────▶│                     │
  │                     │                       │  UPDATE booking     │
  │                     │                       │  → PENDING_APPROVAL │
  │                     │                       │  UPDATE invite      │
  │                     │                       │  → is_used = true   │
  │                     │                       │                     │
  │                     │  {booking, package,    │                     │
  │                     │   config}              │                     │
  │                     │◀──────────────────────┤                     │
  │                     │                       │                     │
  │                     │  sendTelegramAlert()   │                     │
  │                     │───────────────────────────────────────────▶│
  │                     │                       │                     │
  │  {success: true}    │                       │                     │
  │◀────────────────────┤                       │                     │
  │                     │                       │                     │
  │  State C: Success   │                       │                     │
  │◀────────────────────│                       │                     │
```

### 9.2 Travel Surcharge Estimation

```
Client                          SvelteKit                        Mapbox
  │                                │                               │
  │  type venue address            │                               │
  │  ──────────────────▶           │                               │
  │  (autocomplete via             │                               │
  │   /api/search-location)        │                               │
  │                                │  GET /geocoding/v5/           │
  │                                │  mapbox.places/...            │
  │                                ├──────────────────────────────▶│
  │                                │  {features[]}                 │
  │                                │◀──────────────────────────────┤
  │  {features[]}                  │                               │
  │◀───────────────────────────────┤                               │
  │                                │                               │
  │  click "Estimate"              │                               │
  │  ─────────────────▶            │                               │
  │                                │  POST /api/estimate-travel    │
  │                                │  {venue, baseLat, baseLng,   │
  │                                │   ratePerKm}                  │
  │                                │                               │
  │                                │  GET /geocoding (resolve      │
  │                                │  venue to coords)             │
  │                                ├──────────────────────────────▶│
  │                                │  {center: [lng, lat]}         │
  │                                │◀──────────────────────────────┤
  │                                │                               │
  │                                │  GET /directions (driving     │
  │                                │  from base to venue)          │
  │                                ├──────────────────────────────▶│
  │                                │  {routes[0].distance}         │
  │                                │◀──────────────────────────────┤
  │                                │                               │
  │  {distanceKm, computedFee,     │                               │
  │   venueName}                   │                               │
  │◀───────────────────────────────┤                               │
```

---

## 10. Environment Variables

| Variable | Visibility | Required | Default | Purpose |
|----------|-----------|----------|---------|---------|
| `PUBLIC_SUPABASE_URL` | Public | Yes | — | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Public | Yes | — | Supabase anonymous key |
| `MAPBOX_ACCESS_TOKEN` | Private | Yes | — | Mapbox API access token |
| `TELEGRAM_BOT_TOKEN` | Private | For notifications | — | Telegram bot API token |

---

## 11. Deployment

### 11.1 Build & Deploy Configuration

- **Adapter**: `@sveltejs/adapter-cloudflare`
- **Config**: `wrangler.jsonc` for Cloudflare Workers configuration
- **Build**: `vite build`

### 11.2 Environment per Deploy

Cloudflare Workers environment variables should mirror the `.env` file with the same keys.

### 11.3 Supabase Migrations

Migrations are stored in `supabase/migrations/` with timestamp-prefixed filenames:
- `20260526065335_remote_schema.sql` — Base schema (tables, enums, RLS)
- `supabase/rpc/` — Individual RPC function definitions

---

## 12. Project File Structure

```
muasuites/
├── .env                          # Environment variables (local)
├── .gitignore
├── .npmrc
├── .prettierrc
├── components.json               # shadcn-svelte configuration
├── eslint.config.js
├── package.json
├── svelte.config.js              # SvelteKit config (adapter-cloudflare)
├── tsconfig.json
├── vite.config.ts
├── wrangler.jsonc                # Cloudflare Workers config
├── README.md
├── db/
│   └── migrations/
│       └── 20260526065747_baseline_schema.sql
├── static/
│   └── robots.txt
├── src/
│   ├── app.css                   # Global styles with Tailwind v4
│   ├── app.d.ts                  # Type declarations (App.Locals, App.PageData)
│   ├── app.html                  # SvelteKit app shell
│   ├── hooks.server.ts           # Supabase SSR client initialization
│   ├── lib/
│   │   ├── index.ts
│   │   ├── schemas.ts            # Zod schemas (secureSlotSchema)
│   │   ├── supabaseClient.ts     # Universal Supabase client
│   │   ├── telegram.server.ts    # Telegram notification helper
│   │   ├── utils.ts              # Utility functions
│   │   ├── assets/
│   │   │   └── favicon.svg
│   │   └── components/
│   │       └── ui/               # shadcn-svelte components
│   │           ├── button/
│   │           ├── card/
│   │           ├── field/
│   │           ├── input/
│   │           ├── input-group/
│   │           ├── label/
│   │           ├── select/
│   │           ├── separator/
│   │           └── textarea/
│   └── routes/
│       ├── +layout.server.ts     # Session loader
│       ├── +layout.svelte        # Root layout (Toaster)
│       ├── +layout.ts            # Universal Supabase client
│       ├── +page.svelte          # Landing page
│       ├── layout.css
│       ├── login/
│       │   └── +page.svelte      # Magic link login
│       ├── (dashboard)/
│       │   ├── +layout.svelte    # Auth-gated dashboard layout
│       │   ├── bookings/
│       │   │   └── +page.svelte  # Booking management
│       │   └── settings/
│       │       └── +page.svelte  # Studio settings
│       ├── [mua_slug]/
│       │   ├── +page.server.ts   # MUA profile data loader
│       │   ├── +page.svelte      # MUA public profile page
│       │   └── [token]/
│       │       ├── +page.server.ts  # Invite booking data loader + actions
│       │       └── +page.svelte     # 5-step checkout funnel
│       └── api/
│           ├── calendar/
│           │   └── [booking_id]/
│           │       └── +server.ts   # iCalendar ICS generation
│           ├── estimate-travel/
│           │   └── +server.ts       # Mapbox travel cost estimation
│           ├── retrieve-location/
│           │   └── +server.ts       # Mapbox place ID → coordinates
│           ├── search-location/
│           │   └── +server.ts       # Mapbox autocomplete search
│           └── test-telegram/
│               └── +server.ts       # Telegram notification test
├── supabase/
│   ├── .gitignore
│   ├── config.toml              # Supabase local config
│   ├── migrations/
│   │   └── 20260526065335_remote_schema.sql
│   └── rpc/
│       ├── finalize_receipt_submission.sql
│       ├── handle_new_user.sql
│       ├── rls_auto_enable.sql
│       └── secure_checkout_slot.sql
├── reports/                     # Analysis reports (security, QA, etc.)
│   ├── DATABASE_HEALTH_CHECK.md
│   ├── DESIGN_CONSISTENCY_REPORT.md
│   ├── FUNNEL_FRICTION_REPORT.md
│   ├── MICROCOPY_AUDIT.md
│   ├── PRODUCTION_READINESS.md
│   ├── QA_REPORT.md
│   └── SECURITY_REPORT.md
```

---

## 13. Key Design Decisions & Rationales

| Decision | Rationale |
|----------|-----------|
| **RPC functions for booking** | Prevents race conditions in serverless (no shared memory), atomic transactions with row locking |
| **Two-phase checkout** | Separates slot reservation (CHECKING_OUT) from payment proof; 10-min hold prevents indefinite locking |
| **Server-side Mapbox proxy** | Keeps API keys private, enables centralised caching and error handling |
| **Token-gated invites** | Allows MUAs to control who can book; single-use + expiry prevents abuse |
| **FREE plan capacity limit** | Limits concurrent bookings to 2 for free-tier MUAs, enforced server-side and in RPC |
| **Self-excluding CHECKING_OUT** | The client's own active checkout session does not block their date (prevents false "booked" display) |
| **Svelte 5 Runes** | Reactive state with `$state`, `$derived`, `$effect` — modern Svelte paradigm |
| **Zod validation on both sides** | Client-side for instant feedback, server-side for security (defence in depth) |

---

## 14. Known Limitations & Future Considerations

- **No payment gateway integration**: Currently relies on manual transfer + receipt upload; future integration with FPX/DuitNow API would streamline payments
- **Calendar sync**: ICS file generation exists but no two-way sync with Google/Apple Calendar
- **MUA onboarding**: No self-serve signup flow; MUAs are likely created via admin or direct DB insert
- **Multi-language**: Only English supported currently; i18n would extend market reach
- **Audit logging**: No structured audit trail for booking status changes
- **SMS/Email notifications**: Only Telegram is implemented; email/SMS for client confirmations would improve UX
- **Dashboard depth**: Bookings and settings pages are minimal; analytics, calendar view, and client management are future enhancements