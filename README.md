# Behzad Nadeem — Portfolio + CRM ("Mission Control")

Pure HTML/CSS/vanilla JS static site with a Supabase-powered admin panel + mini CRM.

Public side: single-page portfolio (`index.html`) with an embedded "Let's talk" contact form that creates a **lead** in Supabase.

Admin side: static pages under `admin/` (login, dashboard, leads CRM, lead detail, settings) — Supabase Auth + Postgres via the Supabase JS SDK from CDN.

No build step. Free-tier friendly: Vercel (static hosting) + Supabase (Postgres/Auth/Storage, free tier).

## Stack

- Static HTML/CSS/vanilla JS (no framework, no build step)
- GSAP 3.12.5 + ScrollTrigger + Lenis (public animations — untouched)
- Fraunces / Inter / Caveat fonts (public + admin)
- Supabase (Postgres + Auth + RLS) — free tier
- Supabase JS v2 via CDN: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js`
- Vercel deployment (static)

## Local development

Just open `index.html` in a browser (file:// works for the public side). Admin pages expect the Supabase env values to be set (see below) and a running Supabase project.

## Setup

1. **Create a Supabase project** (free tier): https://supabase.com/dashboard — New project.
2. **Run the schema**: open the project → SQL Editor → paste `supabase/schema.sql` → Run.
3. **Create the first admin user**: Supabase Dashboard → Authentication → Users → add the admin email (`behzadqureshiscience@gmail.com`) with a password. (Optionally add staff via `public.profiles`.)
4. **Configure env values** (client-side public values — anon key is safe to expose, RLS protects data):
   - Copy `.env.example` → `.env` (local) and set:
     - `PUBLIC_SUPABASE_URL` → your project ref URL, e.g. `https://xxxx.supabase.co`
     - `PUBLIC_SUPABASE_ANON_KEY` → your anon public key
     - `ADMIN_EMAILS` → comma-separated whitelisted admin emails
     - `RESEND_API_KEY` → optional (later step, email alerts)
   - In `index.html` and `admin/js/admin.js`, replace the placeholder `window.SUPABASE_URL` / `window.SUPABASE_ANON_KEY` values with your project values (static hosting cannot read server env vars).
5. **Start local admin server** (to avoid file:// issues with modules): e.g. `npx serve .` or `python -m http.server`.

## Deploy on Vercel (free)

- Push this repo to GitHub (or drag & drop the folder into Vercel).
- Vercel project settings: Framework preset **Other**, Build command **empty**, Output directory **`/`.
- Add env vars: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_EMAILS`, optional `RESEND_API_KEY`.
- `vercel.json` already includes a SPA rewrite so `/admin/...` deep links refresh correctly.

## Supabase free-tier notes

- Free tier Postgres/Auth/Storage; after ~1 week of inactivity the project is paused — open the dashboard once a week or use a hobby activity to keep it alive.
- Row Level Security is enabled via `supabase/schema.sql`:
  - `anon` can insert leads only (public contact form).
  - `authenticated` (admin/staff) full access via Supabase Auth JWT.

## Admin features

- Login (`/admin/login.html`) — whitelisted emails only, password reset supported.
- Dashboard: totals, new today/week/month, conversion rate, charts, last 10 leads.
- Leads CRM (`/admin/leads.html`): search, filters (status/source/assignee/date range), sorting, pagination, table + Kanban (drag & drop), add lead, CSV export, bulk status/delete, lead detail.
- Lead detail: info, edit, delete, status change, tags, notes, activity, follow-up badges, quick actions (call / WhatsApp / email).
- Settings: status labels, tags, team list.

## Security notes

- Admin routes: client-side guard + Supabase Auth + RLS. `robots.txt` + `noindex` on admin pages.
- Never expose the service-role key on the frontend.
- Honeypot + validation on public forms.

## QA checklist

- Public: contact form inserts a lead (check Supabase Table Editor → leads).
- Admin: login → dashboard renders stats → leads table/kanban/add/edit/delete/export work → filters/search work.
- Admin: deep-link refresh on /admin/... works (SPA rewrite).
- Mobile: admin sidebar off-canvas, responsive grids.

## Contact

Mian Behzad Nadeem — behzadqureshiscience@gmail.com
