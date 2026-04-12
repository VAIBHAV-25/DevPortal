# PROMPTS.md — AI Prompt Log

This document logs all AI prompts and key architectural decisions used to build DevPortal.

---

## Prompt 1 — Initial Build

**Goal:** Build a production-grade, extensible Developer Portal using React 18 + TypeScript.

**Key requirements:**
- Stripe-like developer dashboard
- Real Supabase authentication (signup, login, logout, session persist, silent token refresh)
- API Registry architecture — zero component changes when adding a new API
- OpenAPI-driven documentation, live sandbox, API key management, analytics, status, changelog
- TanStack Query, Zustand, Zod, CodeMirror, React Router v6

---

## Prompt 2 — Supabase Database Persistence

**Goal:** Wire real Supabase for API keys and request history.

**Changes:**
- `api_keys` table with RLS policies (`auth.uid()` scoped)
- `request_history` table for analytics
- `useApiKeys` / `useCreateApiKey` / `useRevokeApiKey` via TanStack Query
- Sandbox posts every request to Supabase via `logRequestToSupabase()`
- Analytics reads real aggregated data from `request_history`

---

## Prompt 3 — Premium UI Overhaul

**Goal:** Stripe-quality UX — responsive, dark-mode-first.

**Changes:**
- CSS custom properties for full dark/light theming
- Glassmorphism, glow effects, micro-animations (slide-up, fade-in, scale-in)
- Inter + JetBrains Mono fonts
- Collapsible sidebar, mobile bottom navigation bar
- Skeleton loaders on all async states
- Cmd+K global fuzzy search modal

---

## Prompt 4 — Premium Auth Pages

**Goal:** Visually stunning login and signup.

**Changes:**
- Split-panel layout: left (feature highlights) + right (form)
- Radial gradient backgrounds, dot-grid pattern
- Password show/hide toggles
- Email rate-limit error surfaced with actionable Supabase fix
- Post-signup confirmation screen

---

## Prompt 5 — Demo Account

**Goal:** Instant access for reviewers without creating a Supabase account.

**Changes:**
- Credentials: `demo@devportal.io` / `demo123`
- "Try demo account" card auto-fills the login form on click
- `signIn()` checks demo credentials first — bypasses Supabase entirely
- All other credentials go through real Supabase auth

---

## Prompt 6 — README + Demo Video

**Goal:** Deliverable-quality README with video.

**Changes:**
- Recorded full walkthrough (`demo.webp`): login → docs → sandbox → keys → analytics → status → changelog → Cmd+K → Stub API
- README with embedded video, Supabase setup, email rate-limit fix, architecture diagram

---

## Prompt 7 — Dark/Light Theme Fix

**Root cause:** Tailwind utility classes (`bg-gray-950`) are hardcoded dark values with no `.light` path.

**Fix:**
- All values replaced with CSS custom properties (`--bg-app`, `--bg-sidebar`, `--text-primary`, etc.)
- `:root` = dark defaults, `.light` = full token overrides
- All components (card, sidebar, header, glass, skeleton, prose) now theme-reactive
- Layout updated to use `bg-sidebar`, `bg-header`, `bg-app`, `border-subtle`

---

## Architecture Decisions

| Decision | Rationale |
|---|---|
| Registry-driven | 1 spec + 1 registry entry = new API, zero component changes |
| TanStack Query | Caching, optimistic updates, loading/error states |
| Zustand persist | Auth session + history survive page reloads |
| Supabase RLS | Data isolation at DB level (not just app) |
| CSS custom properties | Only sound approach to runtime theme switching in Tailwind v4 |
| Demo mode fallback | App works without Supabase credentials |
