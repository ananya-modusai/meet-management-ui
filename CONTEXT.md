# Meet-Alert — Project Context

> **How to use this file:** This is the source of truth for project state across sessions.
> `CONVERSATIONS.md` is auto-written by a Stop hook (`~/.claude/export-session.py`) — it grows unboundedly and is only for audit/reference. This file is what Claude should read first each session. Update it when decisions change, features land, or direction shifts.

---

## What this product is

A React dashboard that lets team members arm/mute phone call alerts for their Google Calendar meetings. No database — arm state lives in a backend (Upstash Redis via AWS Lambda), with localStorage fallback while backend is pending. Auth state (`n8n_ignore`) previously lived in Google Calendar Extended Properties but has been replaced by the backend-driven `armed` set.

The **outbound call system** is external to this repo (n8n + Vobiz). This repo is purely the management UI.

---

## System architecture

```
[This repo — React UI]
  → Google OAuth (calendar.events scope)
  → Google Calendar API (read events, create/update/delete)
  → Meet-Alert backend (AWS Lambda + Upstash Redis) — armed state, settings, call logs

[n8n automation — external]
  → polls Google Calendar ~5 min before each event
  → calls backend to check if event is armed
  → if armed → Vobiz API → outbound phone call to user's configured number

[Vobiz — phone provider]
  Auth ID: MA_YKP9JVPG | From: +911171366938
  Requires a public answer_url returning Voice XML
  ⚠️  Second account MA_DE91THVT is blocked (KYC pending) — use the first one only
```

---

## Backend contract (`src/lib/api.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | → `LineSettings` (phone, message, leadMinutes) |
| PUT | `/me` | ← `LineSettings` |
| GET | `/alerts` | → `string[]` (armed Google event IDs) |
| PUT | `/alerts/:eventId` | ← `{ armed: boolean }` |
| GET | `/logs` | → `CallLog[]` |

**Currently:** `VITE_API_BASE` not set → all state in localStorage (logs seeded with dummy data). Set `VITE_API_BASE` to switch to real backend with zero component changes.

---

## Key data types (`src/types.ts`)

```ts
LineSettings  { phone: string, message: string, leadMinutes: number }
UserProfile   { email: string, name?: string, picture?: string }
CalendarEvent { id, summary?, start, end, attendees?, hangoutLink?, htmlLink? }
CallLog       { id, meeting, phone, at: ISO, status: completed|no-answer|failed|queued, durationSec? }
ViewKey       'overview' | 'calendar' | 'logs' | 'settings' | 'account'
```

---

## Component tree

```
App.tsx                        — auth state, token refresh, data orchestration
├── Login.tsx                  — Google sign-in button
└── dashboard/Shell.tsx        — nav sidebar + header layout
    ├── views/Overview.tsx     — summary stats + next-up meeting card
    ├── views/CalendarView.tsx — month/week/day calendar + event CRUD + arm toggles
    ├── views/CallLogs.tsx     — paginated call history table
    ├── views/Settings.tsx     — phone number, message, lead-time form
    └── views/Account.tsx      — user profile, Google scopes, sign-out
lib/
  api.ts        — backend + localStorage dual-mode API
  calendar.ts   — calendar utility helpers
  google.ts     — Google Calendar REST calls (fetchUpcomingEvents, createEvent, updateEvent, deleteEvent, fetchUserInfo, UnauthorizedError)
  time.ts       — DEFAULT_LEAD_MINUTES, time formatting
  eventColors.ts — calendar color helpers
  useNow.ts     — live clock hook
  cn.ts         — classNames helper
```

---

## Auth & token flow

- OAuth via `@react-oauth/google`, scope: `openid email profile calendar.events`
- Token stored in `localStorage` under key `ma_token`
- Silent refresh via `useGoogleLogin({ prompt: 'none' })` — on 401, retries once silently before forcing sign-out
- `setApiToken()` keeps the api.ts module in sync

---

## Current state (as of 2026-06-23)

### Done
- Full React dashboard with all 5 views wired up
- Google OAuth with silent token refresh
- Calendar event list + CRUD (create, edit, delete) + arm toggle (optimistic with rollback)
- Settings view (phone, message, lead time)
- Call logs view (seeded with sample data)
- Backend API abstraction in `api.ts` (localStorage now, real API when `VITE_API_BASE` is set)
- Vobiz test calls validated externally (see PLAN.md)

### Pending / In-flight
- **Backend not live yet** — AWS Lambda + Upstash Redis backend needs to be built and deployed; `VITE_API_BASE` is unset
- **n8n workflow** — needs to be updated: replace Zenduty nodes with Vobiz HTTP request, point armed-check at the new backend `/alerts` endpoint, build dynamic `answer_url` that returns meeting-specific Voice XML
- **`answer_url` endpoint** — needs to be a publicly accessible URL returning `<?xml ...><Response><Speak>...</Speak></Response>` with the meeting name/time interpolated

### Known issues / open questions
- `Account.tsx` has an uncommitted change: `user?.name[0]` (first char) vs committed `user?.name` — need to confirm intended (Avatar probably wants initials, but `""`[0] is undefined so it falls through safely)
- No `.env` in repo — Google Client ID must be in `VITE_GOOGLE_CLIENT_ID`; Vobiz credentials not in frontend (correct — they live in n8n)

---

## Decisions made

| Decision | Rationale |
|----------|-----------|
| Vobiz over Zenduty | Zenduty requires recipient OTP registration; Vobiz calls any number with no pre-registration |
| Armed state in backend, not Google Calendar extended properties | Calendar extended properties require calendar.events write scope on every toggle; backend is simpler and decoupled |
| localStorage fallback in api.ts | Dashboard is fully usable before backend is deployed |
| AWS Lambda + Upstash Redis for backend | Serverless, low ops, Redis is fast for small key-value state |
