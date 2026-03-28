# Security Checklist — Salon Job Board

## Why This Matters

In 2025, a vulnerability (CVE-2025-48757) affected 170+ apps built with AI coding tools because they shipped without RLS policies. One leak exposed 13,000 users. The pattern is always the same: Supabase auto-generates a REST API from your schema, the anon key is public by design, and without RLS every table is wide open. This app will handle personal data (names, resumes, emails) and payment info — we need to get this right.

---

## 1. Supabase RLS (The #1 Risk)

### The Problem
When you create a table in Supabase, RLS is disabled by default. The anon API key is embedded in your frontend JavaScript — anyone can extract it from DevTools. Without RLS, that key becomes a master key to your entire database.

### Requirements
- [ ] **RLS enabled on EVERY table** — no exceptions, enforce in the migration SQL
- [ ] **No `USING (true)` SELECT policies on sensitive tables** — profiles, applications, and payments should never be globally readable. Only job_posts with status = 'active' should be publicly readable
- [ ] **Always use `auth.uid()` in policies, never client-provided user IDs** — the client can lie about who they are
- [ ] **INSERT policies need matching SELECT policies** — Postgres SELECTs newly inserted rows to return them, which fails without a SELECT policy
- [ ] **UPDATE policies need both USING and WITH CHECK** — USING checks you own the row, WITH CHECK validates the new values
- [ ] **Test RLS with Supabase Studio impersonation** — connect as different users and verify you only see your own data
- [ ] **Run Supabase Security Advisor** after setting up all tables (Dashboard → Database → Security Advisor)
- [ ] **Add indexes on every column used in RLS policies** — especially user_id, employer_id, seeker_id. Without indexes, RLS scans every row

### Specific RLS Policies for This App
```
-- profiles: users can read/update their own
-- employer_profiles: owner can CRUD, public can SELECT (for salon info on job listings)
-- seeker_profiles: owner can CRUD, authenticated employers can SELECT (to review applicants)
-- job_posts: public can SELECT where status = 'active', owner can INSERT/UPDATE/DELETE
-- applications: seeker can INSERT and SELECT their own, employer can SELECT for their job_posts
-- payments: owner can SELECT their own, no public access
```

---

## 2. Auth Security

### Requirements
- [ ] **Enable email confirmation** in Supabase Auth settings — without it, an attacker can sign up with any fake email and get a valid JWT, bypassing auth-gated RLS
- [ ] **Whitelist redirect URLs** — only allow your domain(s) in Supabase Auth redirect URL settings. Prevents open redirect attacks
- [ ] **Use `supabase.auth.getUser()` not `supabase.auth.getSession()`** for server-side auth checks — getSession reads from the JWT which can be tampered with, getUser validates against the server
- [ ] **Set minimum password strength** in Supabase Auth settings
- [ ] **Never trust middleware alone for auth** — Next.js had a critical middleware bypass vulnerability (CVE-2025-29927, CVSS 9.1). Always verify auth at the data access layer (Server Actions / RLS), not just middleware. Middleware is a UX convenience for redirects, not a security boundary

---

## 3. Service Role Key Protection

### The Problem
The service_role key bypasses ALL RLS. It's god mode. If it leaks to the client, game over.

### Requirements
- [ ] **SUPABASE_SERVICE_ROLE_KEY only in server-side code** — never in any file that starts with `"use client"`, never in NEXT_PUBLIC_ env vars
- [ ] **Only use the admin client (service role) in exactly two places:** the Stripe webhook handler and database trigger functions. Everywhere else, use the user-scoped client
- [ ] **Verify in code review:** grep the codebase for service role usage — it should appear in ≤ 2 files

---

## 4. Stripe Payment Security

### Requirements
- [ ] **Always verify the Stripe webhook signature** — use `stripe.webhooks.constructEvent()` with STRIPE_WEBHOOK_SECRET. Never trust unverified webhook payloads
- [ ] **Webhook idempotency** — check for existing payment record before processing. Stripe can send duplicate events
- [ ] **Never trust client-side price** — the $39 amount is set server-side when creating the Checkout Session, not passed from the client. An attacker could modify a client-side price field
- [ ] **Validate the job_post_id in webhook metadata** — verify it exists, belongs to the employer, and is in draft status before activating
- [ ] **Use Stripe test mode** for all development. Only switch to live keys at deploy time via environment variables

---

## 5. Input Validation

### Requirements
- [ ] **Zod validation on every Server Action** — validate all inputs server-side, even if the form has client-side validation. Client validation is a UX feature, not security
- [ ] **Validate file uploads:**
  - Resumes: only allow `application/pdf`, max 5MB
  - Images (logos, avatars): only allow `image/jpeg`, `image/png`, `image/webp`, max 2MB
  - Check MIME type server-side, not just file extension
- [ ] **Sanitize text inputs** — strip HTML from description fields, cover letters. Use a library like DOMPurify if you ever render user-generated HTML (or better: don't render HTML, use plain text)
- [ ] **Validate enum values** — job_type, experience_level, status. Don't trust client-sent enum values; validate against the allowed set in your Zod schema

---

## 6. API Route Security

### Requirements
- [ ] **Stripe webhook route: raw body parsing** — Stripe signature verification requires the raw request body. Don't use JSON middleware on this route
- [ ] **Rate limiting on auth endpoints** — Supabase handles this natively, but verify it's enabled in your project settings (Auth → Rate Limits)
- [ ] **No sensitive data in URLs** — don't put seeker IDs, application IDs, or job IDs in query params that could be logged. Use POST bodies for mutations
- [ ] **CORS is handled by Supabase and Vercel** — don't add custom CORS headers unless you have a specific reason

---

## 7. Storage Bucket Security

### Requirements
- [ ] **Resumes bucket: private** — authenticated users only
  - Upload policy: user can upload to their own path (`user_id/filename.pdf`)
  - Download policy: file owner OR any authenticated user with role = 'employer' (simplified for thin thread)
  - File paths should use the user's UUID, not a guessable name
- [ ] **Logos and avatars buckets: public read** — anyone can view, only owner can upload/overwrite
- [ ] **Validate file types at the bucket level** — Supabase Storage supports MIME type restrictions per bucket

---

## 8. Environment Variables & Secrets

### Requirements
- [ ] **`.env.local` in `.gitignore`** — verify this from the very first commit
- [ ] **No secrets in `NEXT_PUBLIC_` variables** — only SUPABASE_URL and SUPABASE_ANON_KEY are safe for the client
- [ ] **Different keys per environment** — don't use production Stripe keys in development
- [ ] **Vercel environment variables** for production — set SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY in the Vercel dashboard, never in committed code

---

## 9. Headers & Transport

### Requirements
- [ ] **Vercel handles HTTPS by default** — no additional config needed
- [ ] **Add security headers** via `next.config.js`:
  - `X-Frame-Options: DENY` (prevent clickjacking)
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` with reasonable defaults (restrict script sources)
- [ ] **Supabase enforces TLS** for all database connections and API calls

---

## 10. Pre-Launch Audit Checklist

Before going live with real users:
- [ ] Run `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'` — every table must show `rowsecurity = true`
- [ ] Run Supabase Security Advisor and fix all warnings
- [ ] Test every table with a curl request using only the anon key — you should get empty results or appropriate public data, never private data
- [ ] Test as each role (anon, seeker, employer) and verify data isolation
- [ ] Verify service_role key is not in any client bundle (check browser DevTools → Sources)
- [ ] Stripe webhook: test with Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
- [ ] Review all Server Actions for Zod validation
- [ ] Check storage bucket policies manually
