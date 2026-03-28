# Salon Job Board — Thin Thread Design Spec

**Date:** 2026-03-27
**Status:** Draft
**Author:** Adam Bohannon + Claude

## Overview

A niche job board for the salon/beauty industry — "Poached Jobs for salons." Two-sided marketplace: salon owners post jobs (paid, $39/post), stylists/beauty professionals browse and apply (free). This spec covers the initial thin thread: a single vertical slice that exercises every layer of the stack end-to-end.

### Core Loop

1. Employer signs up → creates salon profile → posts a paid job listing (Stripe Checkout) → job goes live
2. Job seeker browses public job listings → views job detail → signs up → creates profile → applies to job
3. Employer sees the application in their dashboard

No messaging, boosts, SmartSort, or shifts. Just the post → browse → apply → review loop.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Server Components, Server Actions) |
| Database/Auth/Storage | Supabase (Postgres, Supabase Auth, Supabase Storage) |
| Styling | Tailwind CSS + shadcn/ui |
| Payments | Stripe Checkout (redirect flow) |
| Email | Resend (single transactional template) |
| Hosting | Vercel |
| Icons | Lucide React |

## Data Model

### `profiles` (extends `auth.users`)

Created automatically via Postgres trigger on `auth.users` insert.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, FK to auth.users.id |
| role | enum ('employer', 'seeker') | Set during signup |
| full_name | text | |
| avatar_url | text | nullable |
| profile_complete | boolean | default false |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### `employer_profiles`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK to profiles.id, unique |
| salon_name | text | required |
| location_city | text | required |
| location_state | text | required |
| description | text | required |
| website_url | text | nullable |
| instagram_handle | text | nullable |
| logo_url | text | nullable |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### `seeker_profiles`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK to profiles.id, unique |
| headline | text | nullable |
| bio | text | nullable |
| resume_url | text | nullable |
| portfolio_url | text | nullable |
| instagram_handle | text | nullable |
| city | text | required to apply |
| state | text | required to apply |
| specialties | jsonb | array of specialty strings, at least one required to apply |
| years_experience | integer | nullable |
| open_to_work | boolean | default true |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### `job_posts`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| employer_id | uuid | FK to employer_profiles.id |
| title | text | required |
| description | text | required |
| job_type | enum ('booth_rental', 'commission', 'salary', 'hourly') | required |
| experience_level | enum ('entry', 'mid', 'senior') | required |
| category | text | single top-level category |
| specialties | jsonb | array of specialty strings within the selected category |
| city | text | required |
| state | text | required |
| pay_range_low | integer | nullable, cents — UI displays as dollars (value / 100) |
| pay_range_high | integer | nullable, cents — UI displays as dollars (value / 100) |
| status | enum ('draft', 'active', 'closed') | default 'draft' |
| posted_at | timestamptz | set when payment completes |
| expires_at | timestamptz | posted_at + 30 days |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### `applications`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| job_post_id | uuid | FK to job_posts.id |
| seeker_id | uuid | FK to seeker_profiles.id |
| cover_letter | text | nullable |
| status | enum ('submitted', 'reviewed', 'interview', 'rejected', 'hired') | default 'submitted' |
| applied_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Unique constraint on `(job_post_id, seeker_id)` to prevent duplicate applications.

### `payments`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| employer_id | uuid | FK to employer_profiles.id |
| job_post_id | uuid | FK to job_posts.id |
| stripe_payment_id | text | unique, for webhook idempotency |
| amount_cents | integer | 3900 for thin thread |
| type | enum ('single_post') | |
| created_at | timestamptz | default now() |

### RLS Policies

**profiles:**
- SELECT: users can read any profile (needed for displaying names/avatars)
- UPDATE: users can update their own row only

**employer_profiles:**
- SELECT: public (anyone can see salon info on job listings)
- INSERT/UPDATE: owner only (user_id = auth.uid())
- DELETE: owner only

**seeker_profiles:**
- SELECT: any authenticated user (thin thread simplification — tighten later to owner + employers with applications from this seeker)
- INSERT/UPDATE: owner only (user_id = auth.uid())
- DELETE: owner only

**job_posts:**
- SELECT: public when status = 'active'; employer can see all their own (any status)
- INSERT: authenticated employers only, where employer_id references an employer_profiles row with user_id = auth.uid()
- UPDATE/DELETE: owner only (employer_id references an employer_profiles row with user_id = auth.uid())

**applications:**
- SELECT: seeker can see their own; employer can see applications for their job posts
- INSERT: authenticated seekers only
- UPDATE: employer who owns the related job post (for status changes)
- DELETE: none (applications can't be withdrawn in thin thread)

**payments:**
- SELECT: employer can see their own
- INSERT: service role only (webhook handler)

### Indexes

- `job_posts(status, posted_at DESC)` — public listing query
- `job_posts(employer_id)` — employer dashboard
- `applications(job_post_id)` — employer viewing applications per job
- `applications(seeker_id)` — seeker viewing their applications
- `payments(stripe_payment_id)` — idempotency lookup

### Storage Buckets

| Bucket | Access | File Types |
|--------|--------|-----------|
| avatars | public | images |
| logos | public | images |
| resumes | private — uploader can read/write own; any authenticated employer can read | PDF |

### Database Triggers

**Profile creation trigger:** On `auth.users` INSERT, a Postgres function creates the corresponding `profiles` row with the `role` from user metadata. This ensures the profiles row always exists regardless of how signup happens.

**updated_at trigger:** A shared Postgres function `set_updated_at()` that sets `updated_at = now()` on UPDATE. Applied as a BEFORE UPDATE trigger on all tables with an `updated_at` column: `profiles`, `employer_profiles`, `seeker_profiles`, `job_posts`, `applications`.

## Categories & Specialties

Hardcoded in `lib/constants/categories.ts`. Not stored in the database — JSONB columns store string values from these lists.

**Categories (top-level, for job posts):**
- Hair
- Nails
- Skin & Facials
- Lashes & Brows
- Barbering
- Massage & Body
- Makeup

**Specialties (granular, for seeker profiles and job post tags):**
- **Hair:** Stylist, Colorist, Balayage Specialist, Extensions, Braids & Locs, Hair Replacement, Bridal/Event
- **Nails:** Nail Technician, Nail Artist, Gel/Acrylic Specialist
- **Skin & Facials:** Esthetician, Laser Technician, Chemical Peels, Microneedling
- **Lashes & Brows:** Lash Technician, Lash Extensions, Microblading, Brow Shaping/Threading
- **Barbering:** Barber, Fade Specialist
- **Massage & Body:** Massage Therapist, Body Treatments
- **Makeup:** Makeup Artist, Permanent Makeup/PMU

## Auth & Routing

### Signup Flow

Shared signup page with role selection: "I'm hiring" or "I'm looking for work." Role is stored in Supabase Auth user metadata and copied to the `profiles` table via the database trigger.

**Employer path:** Signup → mandatory profile form → employer dashboard. Cannot access any employer features until profile is complete.

**Seeker path:** Signup → redirected to `/jobs` (public listing). Persistent banner: "Complete your profile to apply to jobs." Can browse freely. Profile required before applying (redirected to profile form with `returnTo` param).

### Middleware

Next.js middleware using Supabase SSR helper:
- Routes under `(employer)/` require authenticated user with `role = 'employer'` and `profile_complete = true` (except the profile form itself)
- Routes under `(seeker)/` require authenticated user with `role = 'seeker'`
- `(public)/` routes are accessible to everyone
- Unauthenticated users hitting protected routes redirect to login

### Navigation

Shared top nav/header component adapting to auth state:
- **Logged out:** Logo + "Post a Job" CTA + "Sign In" link
- **Employer:** Logo + "Dashboard" + "Post a Job" + account menu
- **Seeker:** Logo + "Jobs" + "My Applications" + "Profile" + account menu
- **Mobile:** Hamburger menu using shadcn Sheet

## Project Structure

```
app/
  layout.tsx                          # Root layout, font, Toaster
  page.tsx                            # Redirects to /jobs
  (auth)/
    login/page.tsx
    signup/page.tsx
    callback/route.ts                 # Supabase auth callback
  (employer)/
    layout.tsx                        # Employer layout, profile_complete guard
    dashboard/page.tsx                # Job list + app counts
    profile/page.tsx                  # Salon profile form
    jobs/
      new/page.tsx                    # Job post form
      [id]/
        edit/page.tsx                 # Edit job post
        preview/page.tsx              # Preview + "Publish for $39" CTA
        success/page.tsx              # Post-payment success
        applications/page.tsx         # Applications for this job
        applications/[appId]/page.tsx # Single application detail
    seekers/[id]/page.tsx             # Applicant profile (employer-only, auth-checked)
  (seeker)/
    layout.tsx                        # Seeker layout, profile banner
    profile/page.tsx                  # Seeker profile form
    applications/page.tsx             # Seeker's application history
  (public)/
    layout.tsx                        # Public layout
    jobs/page.tsx                     # SSR job listing
    jobs/[id]/page.tsx                # SSR job detail
  api/
    webhooks/stripe/route.ts          # Stripe webhook handler
components/
  ui/                                 # shadcn components
  shared/
    nav.tsx                           # Shared navigation header
    profile-banner.tsx                # "Complete your profile" banner
    job-card.tsx                      # Reusable job listing card
    status-badge.tsx                  # Status badge component
lib/
  supabase/
    client.ts                         # Browser client
    server.ts                         # Server client (cookies)
    admin.ts                          # Service role client
    middleware.ts                     # Middleware helper
  stripe.ts                           # Stripe client initialization
  constants/
    categories.ts                     # Categories + specialties
  types/
    database.ts                       # Generated via supabase gen types
  utils.ts
actions/
  auth.ts                             # Auth-related server actions
  employer-profile.ts                 # Employer profile CRUD
  seeker-profile.ts                   # Seeker profile CRUD
  job-posts.ts                        # Job post CRUD
  applications.ts                     # Application submission + status updates
  stripe.ts                           # Checkout session creation
emails/
  application-notification.tsx        # React email template
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
NEXT_PUBLIC_APP_URL
```

## Stripe Integration

### Flow

1. Employer fills out job post form → saved as `draft` in DB
2. Preview page shows job details + "Publish for $39" button
3. Button triggers Server Action that creates Stripe Checkout Session with `job_post_id` and `employer_id` in metadata
4. Employer redirected to Stripe Checkout
5. On success: redirected to success page ("Your job is being published!")
6. Webhook `checkout.session.completed` fires → API route handler:
   - Verifies Stripe signature
   - Checks idempotency: if `payments` record with this `stripe_payment_id` exists, returns 200
   - Creates `payments` record (amount_cents: 3900, type: 'single_post')
   - Updates job post: status → `active`, `posted_at = now()`, `expires_at = now() + 30 days`
   - Uses Supabase admin client (service role)
7. Success page links to dashboard — no polling, no realtime

### Abandoned Checkout

Draft jobs stay as drafts indefinitely. Employer dashboard shows "Complete Payment" button on draft jobs, which creates a new Stripe Checkout Session with the same `job_post_id` in metadata.

### Pricing

$39/post, 30 days active. Hardcoded for the thin thread. Benchmarked against Poached ($59-65 for restaurants), priced lower to reduce friction in a smaller market.

## Application Flow

### "Apply Now" Button States (Job Detail Page)

This is the most important UX in the app. Five states:

1. **Not logged in** → "Apply Now" redirects to signup with `returnTo` URL
2. **Logged in as seeker, profile incomplete** → "Apply Now" redirects to `/seeker/profile?returnTo=/jobs/[id]`
3. **Logged in as seeker, profile complete** → "Apply Now" opens application Sheet
4. **Logged in as seeker, already applied** → "Already Applied" shown as disabled state
5. **Logged in as employer** → button hidden (or shows "This is your listing" if it's their job)

The "already applied" check is a query on the `applications` table for the current seeker + job post. Prevents duplicate applications.

### Application Sheet

shadcn Sheet sliding from the bottom on mobile. Contains:
- Cover letter textarea (optional)
- Note if no resume on profile: "Want to include a resume? [Add one to your profile]" (non-blocking)
- Submit button

### Server Action

- Inserts into `applications` with status `submitted`
- Fire-and-forget: sends Resend email to the employer (non-blocking, errors don't fail the submission)
- Returns success → toast "Application submitted!"

### Email Template

One Resend email via React email:
- **Subject:** "New application for {Job Title}"
- **Body:** "{Seeker Name} applied to your {Job Title} position."
- **CTA button:** "View Application" deep-linking to the specific application in the employer dashboard

Triggered server-side from the application Server Action. Fire-and-forget — email is a side effect, not part of the critical path.

### Employer Application Review

- Employer dashboard shows application count per job
- Click through to see applications list for a job
- Each application shows: seeker name, avatar, headline, specialties, city/state, applied date, status badge
- Click application to see full detail: cover letter, link to full seeker profile, resume download
- Status update via select dropdown: submitted → reviewed → interview → rejected → hired
- Status updates are employer-side only — no email sent to seeker on status change (future feature)

## Implementation Phases

Each phase extends a working system and is independently testable.

### Phase 1: Foundation (Effort: L)

Project scaffold, database schema, auth, middleware, shared navigation.

**Testable outcome:** Can sign up as employer or seeker, role is set correctly, middleware routing works, nav adapts to auth state.

**Includes:**
- `npx create-next-app` with App Router
- shadcn/ui init + install required components
- Supabase project setup, SQL migration (all tables, RLS, indexes, trigger)
- Supabase Storage buckets (avatars, logos, resumes)
- `lib/` setup: Supabase clients, Stripe client, constants, generated types
- Auth pages: signup (with role selection), login, callback
- Middleware: role-based routing, profile_complete guard
- Root layout, shared nav component
- Environment variables setup

### Phase 2: Employer Profile + Job Posting (Effort: M)

**Testable outcome:** Sign up as employer → complete profile → create a job post → see it as a draft on the dashboard.

**Includes:**
- Employer profile form (react-hook-form + zod, logo upload)
- Employer dashboard (job list with status badges)
- Job post form (category → specialty selection with clear-on-switch behavior)
- Job preview page
- Server Actions for employer profile and job post CRUD

### Phase 3: Stripe Integration (Effort: M)

**Testable outcome:** Draft job → Stripe test payment → job status flips to active in the database.

**Includes:**
- Stripe Checkout Session creation (Server Action)
- Stripe webhook handler (signature verification, idempotency, status flip)
- Success page
- "Complete Payment" retry on dashboard for draft jobs

### Phase 4: Public Job Pages (Effort: S)

**Testable outcome:** Active jobs appear on the public listing, job detail pages are server-rendered.

**Includes:**
- SSR job listing page (Server Component)
- SSR job detail page (Server Component, SEO metadata)
- Job card component (shared)
- "Apply Now" button with all 5 auth states

### Phase 5: Seeker Auth + Profile (Effort: S)

**Testable outcome:** Sign up as seeker → land on job listings → see profile banner → complete profile → banner disappears.

**Includes:**
- Seeker profile form (specialties multi-select, resume upload, `returnTo` support)
- Profile completion banner component
- Seeker layout with banner integration

### Phase 6: Application Flow (Effort: M)

**Testable outcome:** Seeker applies to a job → application saved → employer receives email.

**Includes:**
- Application Sheet (cover letter, resume note)
- Application submission Server Action (with fire-and-forget Resend email)
- Resend email template (React email)
- Seeker application tracking page
- Duplicate application prevention (unique constraint + "Already Applied" UI state)

### Phase 7: Employer Dashboard + Application Review (Effort: M)

**Testable outcome:** Full loop — employer posts a job, seeker applies, employer sees the application and updates its status.

**Includes:**
- Applications list per job (sub-page of employer dashboard)
- Application detail view (cover letter, seeker profile link, resume download)
- Application status update (select dropdown, Server Action)
- Seeker profile page under `(employer)/` route group (auth-checked, employer-only)
- Application count badges on employer dashboard job list

## Critical Integration Points

1. **Supabase Auth ↔ Next.js Middleware:** Supabase SSR package handles cookie-based sessions. Middleware reads session, checks role and profile_complete, redirects accordingly.

2. **Database Trigger ↔ Signup:** Postgres trigger on `auth.users` INSERT creates the `profiles` row. The role comes from user metadata set during signup. This must work reliably — if the trigger fails, the user is in a broken state.

3. **Stripe Checkout ↔ Job Status:** The webhook is the source of truth for payment. The success page redirect is cosmetic. Idempotency check on `stripe_payment_id` prevents duplicate processing. Service role Supabase client bypasses RLS in the webhook handler.

4. **File Uploads ↔ Supabase Storage:** Direct client-side upload using Supabase Storage SDK. Storage bucket policies must align with the RLS-like access rules (public for logos/avatars, restricted for resumes).

5. **Server Action ↔ Resend:** Application submission triggers a fire-and-forget email send. The email must not block or fail the application submission. Wrap in try/catch with no await on the response path.

## Security Requirements

### Row Level Security

RLS must be enabled on every table in the Phase 1 migration with no exceptions. Even tables that currently only use service role access (e.g., `payments`) must have RLS enabled to prevent accidental exposure if a client-side query is ever added.

### Server Action Validation

Every Server Action must validate its inputs with Zod before performing any database operation. This is defense-in-depth — even if the client-side form has validation, the server must re-validate independently. Zod schemas should be co-located with the Server Actions that use them.

### Auth Verification at the Data Layer

Auth must be verified at the data layer using `supabase.auth.getUser()`, not just middleware. Middleware is a convenience for routing/redirects, not a security boundary. Every Server Action and API route that performs a write or reads private data must call `getUser()` and verify the returned user before proceeding. Never trust the session from middleware alone.

### Service Role Client Isolation

The Supabase service role client (which bypasses RLS) is only used in two places:
1. `lib/supabase/admin.ts` — the shared module that initializes it
2. `app/api/webhooks/stripe/route.ts` — the Stripe webhook handler

No other file should import or use the service role key. This limits the blast radius if a Server Action has a bug — it can only access data within the RLS policies of the authenticated user.

### File Upload Security

All file uploads must:
- **Validate MIME types server-side** — avatars/logos accept `image/jpeg`, `image/png`, `image/webp` only; resumes accept `application/pdf` only
- **Enforce size limits** — images: 5MB max; resumes: 10MB max
- **Use Supabase Storage policies** to enforce bucket-level access (not just application-level checks)

Client-side validation is for UX; server-side validation is for security. Both are required.

### Security Headers

Configure security headers in `next.config.js`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restricting unused browser features
- Content Security Policy (CSP) appropriate for Next.js + Supabase + Stripe

### Pre-Launch Security Audit

The following checklist is a **hard gate** before production deployment. The app does not go live until every item passes:

- [ ] RLS enabled on all tables, tested with anon and authenticated roles
- [ ] Every Server Action validates input with Zod and calls `getUser()`
- [ ] Service role client only imported in `lib/supabase/admin.ts` and `api/webhooks/stripe/route.ts`
- [ ] Stripe webhook signature verification tested with invalid signatures
- [ ] File upload MIME type and size validation tested with malicious payloads
- [ ] Storage bucket policies tested: anon cannot read resumes, seekers cannot read other seekers' resumes
- [ ] Security headers present and validated (check via securityheaders.com or similar)
- [ ] No secrets in client-side code (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` are server-only)
- [ ] Environment variables validated at startup (app fails fast if required vars are missing)
- [ ] RLS policies tested: seeker cannot update another seeker's profile, employer cannot see another employer's draft jobs, etc.
- [ ] CSRF protection via Server Actions' built-in origin checking is functional
- [ ] Rate limiting considered for auth endpoints and application submissions (may defer to Vercel's built-in protections for thin thread)

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Pricing | $39/post, 30 days | Below Poached ($59-65), reduces friction for smaller market |
| Categories | Hardcoded constants file | Avoid DB complexity; move to DB-driven later if needed |
| Auth | Email/password via Supabase Auth | Simplest for thin thread |
| Employer onboarding | Mandatory profile before dashboard | High-intent users (paying), 60-second form isn't a barrier |
| Seeker onboarding | Browse-first, profile when applying | Reduces drop-off; let seekers see value before committing |
| Application UX | Sheet dialog on job detail page | Keeps context, avoids page navigation |
| Email | Single template via Resend | Exercises the integration; Supabase and Stripe handle their own emails |
| Payment failure UX | "Being published" success page, no polling | Simple; webhook lands before user navigates to dashboard |
| Status update emails | Not in thin thread | Employer-side only; seeker notifications are a future feature |
| DB types | Generated via Supabase CLI | Stays in sync with schema automatically |

## Out of Scope (Thin Thread)

- Messaging between employers and seekers
- Job boosts or featured listings
- SmartSort or algorithmic ranking
- Shift-based scheduling
- Social login (Google, etc.)
- Advanced search/filtering on job listings
- Pagination
- Marketing landing page
- Admin dashboard
- Analytics
- Application withdrawal
- Seeker notification emails on status changes
- A/B pricing tests
