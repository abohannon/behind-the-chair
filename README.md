# Behind the Chair

A private Portland alpha for beauty-industry hiring: businesses post free listings, applicants submit a tailored PDF and optional cover letter, and businesses review candidates, contact them directly, update interview status, and privately rate applications from 1–5.

Built with Next.js 16.2.1, React 19, TypeScript, Supabase Postgres/Auth/Storage, Tailwind CSS, and shadcn/ui. Payments and application emails are disabled for this alpha. No Stripe or Resend keys are required.

## Local setup

Use Node 22.17 or newer and Docker. Keep Docker running.

```sh
npm ci
npx supabase start -x studio,logflare,vector,imgproxy,realtime
npm run alpha:env
npm run dev:alpha
```

Run `npm run demo:alpha` to add synthetic Portland listings and two local demo accounts. Both use password `BehindTheChair-Alpha1!`: `business@alpha.example` and `applicant@alpha.example`. This command refuses hosted backends.

Open http://localhost:3000. `alpha:env` writes ignored `.env.alpha` using only the local Supabase instance. It preserves `.env.local` and the backend it points at. `dev:alpha` explicitly loads the local environment before Next.js starts. The local email inbox is http://127.0.0.1:54324.

For an existing local database, apply pending migrations with `npx supabase migration up --local`. Do not reset a database containing data you want to preserve. `npx supabase db reset --local` is only for disposable local fixtures.

Invite yourself to each role using different email addresses:

```sh
npm run invite:alpha -- owner@example.com employer
npm run invite:alpha -- applicant@example.com seeker
```

Invitations stay in the local email inbox. Follow the invitation link to set a password. Public signup is intentionally disabled. The service-role-only `alpha_invites` table determines roles; user-editable account metadata does not grant privileges.

## Verification

With local Supabase and the alpha dev server running:

```sh
npm run lint
npm run typecheck
npm test
npm run test:alpha
npx playwright install chromium
npm run test:browser
```

The integration and browser suites refuse non-local backends and create/delete synthetic accounts. They test actual database and storage authorization, not only UI redirects. Do not run fixture suites concurrently. Browser traces live in ignored `test-results/`.

To build against the local backend, stop the dev server first, then run `npm run build:alpha`. Restart with `npm run dev:alpha` afterward. `npm run build` uses your normal environment instead.

## Data boundaries

- Only invited accounts can be created. Applicants and employers use separate roles; one owner per business.
- Public access is limited to business information and active jobs. Applicant profiles are visible to their owner and businesses receiving their applications.
- A submitted application preserves the name, email, phone, cover letter, and original PDF supplied for that application. Profile updates do not rewrite submitted contact details or attachments.
- Resumes upload directly to private Supabase storage, avoiding web-host request-size limits. Each attempt gets a unique path. Submitted files cannot be overwritten or removed by applicants. Downloads use five-minute signed URLs.
- Employer ratings live in a separate RLS-protected table. Applicants cannot read them, including through embedded application queries. Unrated is distinct from 1.
- Database functions serialize application creation against listing closure. New submissions require owned resume files, valid email/phone, an applicant account, and an active job. Duplicate submissions are constrained by the database.
- Legacy applications remain readable without inventing historical contact details or tailored resumes. The migration does not rewrite old pay amounts with guessed units.

Abandoned resumes older than 24 hours can be inspected with `node --env-file=.env.alpha scripts/cleanup-uploads.mjs`; add `--delete` to remove eligible files. The job skips referenced resumes and legacy profile files and processes at most 100 accounts and 100 folders per account. For a larger pilot, paginate this maintenance task or schedule an equivalent job.

## Private hosted preview

A hosted preview requires a selected repository/host and a dedicated Supabase alpha project. Do not apply these migrations to an unidentified existing project.

1. Configure the host's private-preview access protection. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_APP_URL` to the dedicated alpha deployment. The running app does not need a service role key; invitation/maintenance scripts do.
2. Inspect existing records and migration history, then apply the forward SQL migrations in `supabase/migrations/` to the intended project. Generate types with `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/database.ts` after schema changes.
3. In hosted Supabase Auth, disable unrestricted signup, set the site URL to the preview origin, and allow the exact `/callback` URL. Local TOML settings do not configure a hosted project automatically.
4. Set the invitation and recovery email templates to the corresponding files in `supabase/templates/`. Their token-hash links work across browsers/devices. Configure auth email delivery for invited testers.
5. To send a hosted invitation, load that environment explicitly and run `node scripts/invite.mjs email@example.com employer` (or `seeker`). The `invite:alpha` shortcut always targets local `.env.alpha`.
6. Run the partner walkthrough against that exact hosted preview with synthetic accounts. Verify a second business cannot fetch unrelated applicant information or ratings. A passing local build is not evidence of a working hosted setup.

Stripe webhook and checkout actions are disabled. Bringing back paid listings requires a separate reviewed change, including pricing, duration, and reliable payment activation. New-application emails are deferred; the dashboard is the source of truth for alpha applications.

The detailed scope, acceptance scenario, and outstanding hosted checks are in [the alpha plan](docs/superpowers/plans/2026-10-16-behind-the-chair-alpha.md). Earlier March documents are historical and do not override this plan.
