# DevPortal — Stripe-like Developer Dashboard

A production-grade, extensible developer portal built with React 18 + TypeScript + Supabase. Add a new API to the platform with **zero component code changes** — just drop in an OpenAPI spec and register it.


> **Demo credentials** — `demo@devportal.io` / `demo123` (bypass Supabase, works instantly)

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) → click **"Try demo account"** → Sign in.

---

## ⚙️ Environment Setup

```bash
cp .env.example .env
```

Fill in your Supabase credentials (optional — the app works in demo mode without them):

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

### Supabase Database Setup

After adding credentials, run the migration in **Supabase → SQL Editor**:

```bash
# File is at:
supabase/migrations/001_init.sql
```

This creates:
- `api_keys` — stores user API keys with Row Level Security
- `request_history` — stores sandbox requests, powers real Analytics

### Fix Email Rate Limit on Signup

Go to **Supabase Dashboard → Authentication → Providers → Email → disable "Confirm email"**. This removes the 2 emails/hour limit during development.

---

## 🔐 Authentication

| Mode | How |
|---|---|
| **Demo account** | `demo@devportal.io` / `demo123` — instant, no Supabase needed |
| **Real account** | Supabase Auth — signup/login/session persist/auto-refresh |

- All `/apis/*` routes are protected via `<ProtectedRoute />`
- Session persists across reloads via Zustand `persist` middleware

---

## 🔌 How to Add a New API (Zero Code Changes)

1. Add OpenAPI spec → `src/apis/<your-api>/openapi.json`
2. (Optional) Add `docs.md` and `changelog.json`
3. Register in `src/apis/api-registry.ts`:

```typescript
{
  id: 'my-api',
  name: 'My API',
  version: '1.0.0',
  description: 'Brief description',
  spec: myApiSpec as unknown as OpenAPIObject,
  changelog: myApiChangelog,
  baseUrl: 'https://api.example.com',
  color: '#6366F1',
  icon: '🌐',
}
```

Sidebar, docs, sandbox, analytics, status, changelog — all update automatically.

---

## 🏗️ Architecture

```
src/
├── apis/                    # API definitions
│   ├── api-registry.ts      # Single source of truth — only file to edit for new APIs
│   ├── pokeapi/             # PokéAPI (live, 6 endpoints)
│   └── stub-api/            # JSONPlaceholder (demo, 5 endpoints)
├── components/              # Shared UI primitives
│   ├── Layout.tsx           # Sidebar + mobile nav + theme toggle + Cmd+K
│   ├── SearchModal.tsx      # Global fuzzy search across all endpoints
│   ├── Button.tsx / Badge.tsx / Input.tsx / CodeBlock.tsx
├── features/
│   ├── auth/                # Supabase Auth + Zustand store + demo account
│   ├── docs/                # OpenAPI-driven documentation viewer
│   ├── sandbox/             # Live request builder + Supabase request logging
│   ├── keys/                # API key CRUD → Supabase api_keys table
│   ├── analytics/           # Real-time charts from Supabase request_history
│   ├── status/              # API health indicators + incidents
│   └── changelog/           # Version history timeline
└── lib/
    ├── spec-parser.ts       # OpenAPI 3.x → typed endpoints
    ├── snippet-generator.ts # cURL / fetch / Python codegen
    └── supabase.ts          # Supabase client (nullable in demo mode)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Routing | React Router v6 |
| Server State | TanStack Query |
| Client State | Zustand |
| Validation | Zod |
| Auth & DB | Supabase (Auth + PostgreSQL + RLS) |
| JSON Editor | CodeMirror 6 |
| Charts | Recharts |

---

## ✨ Features

| Feature | Status | Description |
|---|---|---|
| **Authentication** | ✅ | Supabase Auth with demo account bypass |
| **API Docs** | ✅ | Auto-generated from any OpenAPI 3.x spec |
| **Live Sandbox** | ✅ | Real HTTP requests, path/query/header/body editors |
| **Code Snippets** | ✅ | Auto-generates cURL, JavaScript fetch, Python |
| **Request History** | ✅ | Persistent replay, logged to Supabase |
| **API Keys** | ✅ | Create/reveal/revoke → stored in Supabase |
| **Analytics** | ✅ | Real charts from Supabase request_history |
| **Cmd+K Search** | ✅ | Fuzzy search across all registered endpoints |
| **Dark/Light Mode** | ✅ | Persisted in localStorage |
| **Mobile Nav** | ✅ | Full bottom tab bar on small screens |
| **Status Page** | ✅ | Health indicators + incident history |
| **Changelog** | ✅ | Version timeline with type filters |
