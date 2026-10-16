# Behind the Chair — Private Alpha Plan

Date: 2026-10-16
Status: Hosted hiring flow verified; partner access and SMTP remain to configure

This plan replaces the March 2026 thin-thread plan for alpha scope and sequencing. Keep the earlier documents as history. The alpha reuses the existing app; it does not start a new scaffold.

## Outcome

A Portland salon can publish a job, an invited applicant can find it and submit a tailored application, and the business can review the application, contact the applicant outside the app, and track hiring status.

The first release is a private, shareable alpha for the business partner and invited testers. A successful deployment alone does not establish that the hiring flow works.

## Product decisions

- Brand: Behind the Chair. Use “business” in general account copy and industry-specific language where useful.
- Pilot: Portland, Oregon. Store city and state separately and default new listings to Portland, OR. Restrict alpha job creation to that pilot market; applicants may live elsewhere. Additional markets require a later deliberate expansion.
- Accounts: applicant or employer; one owner account per business for alpha. Team membership and multiple businesses per account are deferred.
- Access: provision invited accounts using Supabase invitations and disable unrestricted signup in the alpha environment. Provide invitation acceptance, password setup/recovery, login, and logout. Do not rely on hiding a signup link to enforce invitations.
- Posting: free during alpha, confirmed after partner feedback. Paid listings remain a later business-model requirement; pricing and listing duration are undecided. Stripe is outside the alpha publish path; retained payment code must not activate or alter alpha listings through old webhook routes.
- Applications: a reusable applicant profile plus a required application-specific resume, required email and phone, and an optional personalized cover letter written directly in the app. Instagram is optional.
- Required applicant details: name, contact email, and phone. Instagram, portfolio, bio, specialties, location, and years of experience are optional. Prefill contact details from the saved profile and let the applicant confirm or edit them for each application. Validate email and phone server-side; phone verification by SMS is outside alpha scope.
- Resume: one required PDF per application, maximum 10 MB. A submitted application retains the exact file submitted; later uploads cannot replace it.
- Hiring statuses: Submitted, Reviewed, Interview, Rejected, Hired. Employers update them manually; applicants can see their current status. No automated transition emails.
- Candidate ratings: an optional private integer rating from 1 to 5 per application, with a distinct Unrated state. The business can set, change, or clear it and sort/filter its applicants by rating. Ratings are independent of hiring status, are not shown to applicants, and are not shared across businesses or jobs. Store ratings separately from applicant-readable application rows; enforce access in database policies and grants, not only the UI.
- Communication: required contact email and phone visible to the applicant and the business receiving that application. Interviews and conversations happen outside the app. Businesses can leave an applicant unrated and take no action; viewing an application must not automatically reject it or change its status.
- Business profile: name, Portland location, description, optional website and Instagram, logo, and up to five photos. Images: JPEG, PNG, or WebP, maximum 5 MB each.
- Discovery: keyword search and industry/category filter; show Portland as the pilot location. Use existing categories initially. Add basic pagination with filters retained in the URL.
- Job details: title, description, category, optional specialties and experience, employment arrangement, full-time/part-time/flexible schedule, and clearly labeled compensation.
- Compensation: separate employment arrangement from pay. Support employment or booth rental; employment can combine hourly or annual pay with commission. Store commission percentages and booth rental rates separately, with explicit units. Unknown terms may be labeled “Discuss with business”; do not render a unitless dollar range.
- Lifecycle: Draft → Active → Closed; allow owner edits and reopening. No automatic 30-day expiry during alpha. Closed listings stop accepting applications but remain understandable in application history.

## Review baseline and limits

The existing source contains role-based accounts, profile forms, job creation/editing/preview, public listing/detail pages, profile-level PDF uploads, applications, status updates, Stripe checkout, and a Resend notification action.

The source review found these gaps:

- Applicant resumes use a shared, overwritten profile path rather than an application-specific attachment.
- Employer application detail lacks contact email and phone.
- Profile forms do not load saved values; uploads can happen before the corresponding profile exists.
- Checked-in RLS policies allow public base-profile reads, all authenticated users to read applicant profiles, and all employers to read resumes.
- Public job browsing lacks filters; the employer UI lacks close/reopen actions.
- Publishing requires payment; metadata and navigation still use SalonJobs.
- Authentication does not preserve the selected job through signup/login. Password recovery UI is absent.
- No automated tests were found. Dependencies were absent, so build, lint, browser behavior, hosted configuration, and deployed policies were not verified.
- Local environment variable names were inspected without exposing values. Resend was empty; other configured values were not validated.

## Milestone 1 — Establish a working, isolated foundation

Goal: run the app against a dedicated alpha/test backend and establish account and data boundaries before adding real applicant information.

- [x] Install dependencies from the lockfile. Read the relevant installed Next.js guides under `node_modules/next/dist/docs/` before changing application code, as required by AGENTS.md.
- [x] Run baseline lint, type checking, and production build. Record and repair existing blockers separately from feature additions.
- [ ] Confirm the intended Supabase project, applied migrations, storage policies, auth redirects, email delivery, and hosting setup. Do not assume the checked-in SQL matches the hosted database.
- [x] Use a dedicated nonproduction environment with synthetic data. Inspect any existing records before defining migration/backfill behavior; do not reset a populated database.
- [x] Add forward migrations to restrict base profiles, applicant profiles, applications, contact details, and resumes to their intended readers. Preserve public business information and active listing access.
- [x] Prevent users from changing their own account role or using alternate profile tables to gain another role's privileges. Enforce roles and ownership at the database/data access layer, not only in route redirects.
- [x] Restrict application writes: applicants create only their own submissions to active jobs; employers update only permitted hiring fields for their own jobs' applications. Applicants cannot choose a hiring outcome during insertion.
- [x] Implement invited account acceptance, password setup/recovery, and login routing. Preserve and validate local return destinations so an applicant resumes at the selected job.
- [x] Ensure confirmation and expired/invalid invitation states have clear recovery paths. Local invitation and recovery emails were exercised across browser contexts.
- [x] Verify hosted auth settings enforce the invitation boundary after the target project is selected.
- [x] Replace the stale starter README with local setup, required versus optional environment variables, migration commands, and verification instructions.

Acceptance: invited applicant and employer accounts can sign in and recover access. Anonymous visitors and unrelated accounts cannot retrieve applicant information or resumes through direct database/storage requests. Required environment failures are clear; missing Stripe or Resend configuration does not prevent core alpha use.

## Milestone 2 — Profiles and free job publishing

Goal: a business can present itself and manage a useful Portland listing without payment.

- [x] Load saved values into both profile forms, including existing links, image previews, and selected specialties. Preserve input on validation errors.
- [x] Require name, contact email, and phone while keeping Instagram and other profile enrichment optional. Treat account email and application contact email as distinct concepts. Prefill contact details when applying and validate submitted values server-side.
- [x] Normalize Instagram handles or profile URLs consistently; validate external links and render safe destinations.
- [x] Save a business profile before attaching images. Verify every upload is attached to an existing owned record; return an error when an update affects no record.
- [x] Add business photos with ordering, deletion, image limits, and storage ownership rules. Avoid orphaned uploads on failed saves.
- [x] Add forward migrations and form changes for employment arrangement, schedule, and compensation units. Inspect legacy job types and migrate them explicitly; do not infer missing pay units as fact.
- [x] Add owner-authorized publish, close, and reopen actions. Validate required listing fields server-side and show an accurate preview before publishing.
- [x] Remove checkout requirements and payment copy from the alpha UI. Disable legacy payment activation for the alpha environment. Remove duration claims and expiry-dependent behavior from this release.
- [x] Preserve an applicant's access to the job context for their own application after closure, without exposing unrelated drafts or private listings.
- [x] Apply Behind the Chair branding to navigation, auth screens, page metadata, application copy, and any retained email templates.

Acceptance: an invited business owner saves and revisits a profile, attaches photos, publishes a Portland job for free, edits it, closes it, and reopens it. Another business cannot modify the profile, files, or listing. Compensation is understandable without guessing its unit.

## Milestone 3 — Discovery and application submission

Goal: an applicant finds a relevant role and submits a stable, reviewable application.

- [x] Add keyword search over title, description, and business name, plus category filtering, deterministic newest-first ordering, and pagination. Preserve filters in URL query parameters.
- [x] Show the Portland pilot clearly. Distinguish no matching jobs from a data-loading error; provide reset filters and useful navigation.
- [x] Make application eligibility and redirects consistent for visitors, applicants, and employers. Return applicants to the selected role after authentication or profile completion.
- [x] Add a required application-specific private resume attachment and contact snapshot with submitted name, email, and phone. Add an optional personalized cover-letter textarea directly in the application form; persist its submitted text with the application. Clearly indicate that employers otherwise view the applicant's current profile.
- [x] Generate a unique file path for each submission attempt; attach it to one application only. Validate type and size on the server and at storage level. Use a short-lived upload/submission process with bounded orphan cleanup; do not introduce a large document-management subsystem.
- [x] Make submitted attachments immutable to applicants. Replacing a profile resume or submitting another application must not change an earlier attachment.
- [x] Prevent duplicates with a database constraint and useful UI feedback. Check active listing status at the database write boundary so closure cannot be bypassed by a stale page or direct request.
- [x] Make submission retries safe: prevent duplicate records, recover from upload/save failures, and clean unused files without deleting submitted attachments.
- [x] Show a clear confirmation and the submitted role, date, status, and resume in applicant history, including when the role closes.

Acceptance: one applicant applies to two jobs with different PDFs; each employer receives the correct original file. A later upload leaves both submissions intact. Duplicate applications and attempts to apply to closed jobs fail cleanly. Submission without a resume, email, or phone is rejected with useful validation; submission without a cover letter or Instagram succeeds.

## Milestone 4 — Employer review and partner handoff

Goal: complete and verify the hiring loop in a private hosted preview.

- [x] Make application lists and detail pages reliably show submitted identity/contact information, current profile/Instagram/portfolio, personalized cover letter when provided, and the application-specific resume.
- [x] Provide email and phone actions using the submitted contact details. Ensure private fields do not leak into public business or job responses.
- [x] Retain the existing status choices and add status filtering within each job's applicant list. Show save progress/errors and keep displayed status consistent after refresh.
- [x] Add a separate employer-private application rating record with a database constraint limiting values to integers 1–5 and one rating per application. Unrated means no rating record. Only the business owning the application's job can read, create, update, or clear the rating; applicants and unrelated businesses cannot access it through direct queries.
- [x] Add accessible 1–5 rating controls to candidate review, an explicit clear-rating action, and rating sorting/filtering in the job's applicant list. Keep Unrated distinct from 1, preserve hiring status when rating, and show save failures without falsely displaying a successful update.
- [x] Verify resume downloads use short-lived authorized URLs; unauthorized employers cannot generate them, including through direct API requests.
- [x] Treat new-application email as optional for alpha: dashboard records remain the source of truth. If enabled, configure a verified sender and reliable post-response delivery using the installed framework's supported mechanism. Failure must not lose an application or falsely report that a notification was sent.
- [x] Add focused automated tests for authorization, application attachment isolation, required contact/resume validation, rating range and privacy, active-job submission, duplicate handling, and job lifecycle. Run relevant lint, type, and build checks.
- [x] Exercise the full flow in a browser at mobile and desktop widths, including loading, empty, validation, expired invitation, and failure states. Record actual results rather than treating source inspection as runtime proof.
- [x] Deploy an access-restricted preview, configure auth callback URLs, and run the hiring loop against that exact deployment. Use synthetic resumes and test identities.
- [ ] Provide the partner with the preview URL, invited accounts, a short walkthrough, known limitations, and a simple feedback channel.

Acceptance: the partner can complete the scenario below without developer intervention. Any missing hosting/account configuration is reported as an explicit handoff blocker; a local build alone does not satisfy this milestone.

## End-to-end acceptance scenario

1. Invite business A, business B, and applicant A into the private alpha.
2. Business A creates a profile with images and publishes two Portland jobs without Stripe.
3. Applicant A searches by keyword/category, saves required email/phone details, and applies to both jobs using different PDFs. Include an in-app cover letter and Instagram for one application; omit both optional fields for the other. Verify missing resume/email/phone prevents submission.
4. Business A sees both applications, downloads each correct PDF, reads the submitted cover letter, opens email/phone contact actions, and changes a status to Interview. Rate one application 5 and the other 2, then verify rating sorting/filtering, editing, and clearing to Unrated. Rating changes leave interview status unchanged.
5. Applicant A sees the updated status. Editing the applicant profile does not change submitted contact details or either resume.
6. Business A closes a job. It disappears from active discovery and rejects new submissions; its previous application remains readable to the applicant and business A.
7. Business B cannot retrieve applicant A's private profile, contact details, applications, resumes, or business A's ratings. Applicant A cannot read or write employer ratings, including on their own applications. Test direct database/storage access, not just navigation. Reject ratings outside 1–5 and non-integer values.
8. Account recovery and returning to a selected job work on the deployed preview, on mobile and desktop.

## Later phases

After alpha feedback: improve usability, add withdrawal and employer notes if needed, strengthen operational monitoring and deletion/retention flows, and prepare for a controlled external pilot. Before accepting real public users, review abuse controls, accessibility, privacy/terms, upload handling, and operational ownership.

After the hiring workflow proves useful: payments and pricing, additional cities, team accounts, saved jobs/alerts, richer portfolios, and optional status notifications. In-app messaging, AI matching/ranking, scheduling, and a platform administrator UI are deferred.

## Execution order and completion reporting

Implement milestones sequentially in reviewable changes. Complete each milestone's acceptance checks before marking it done. Update these checkboxes as work is verified, and distinguish source changes, local checks, live backend checks, and hosted browser checks in handoff notes. Do not mark unavailable checks as passed.

## Local implementation handoff — 2026-10-16

Implemented on `feat/behind-the-chair-alpha`. The original `.env.local` and its configured backend were preserved. A separate Docker-backed local Supabase instance and ignored `.env.alpha` are used for the demo and tests. The repository remote is `https://github.com/abohannon/behind-the-chair.git`, with `main` as the primary branch. Automatic Vercel deployments are temporarily disabled in `vercel.json` until the hosted backend is configured. The empty Vercel project mistakenly created in the Housecall Pro account was deleted. The project `behind-the-chair` is now created and linked under the verified personal account `abohannon@protonmail.com`, team **Adam’s projects** (`adams-projects-a0f5e935`), with authentication protection on all deployments. Its separate CLI login is stored under `$HOME/Library/Application Support/com.vercel.cli-personal`; default CLI credentials remain the work account. No deployment has been created, and the hosted Supabase alpha project remains unconfirmed; publication and hosted verification remain outstanding.

Verified locally:

- Clean `npm ci` succeeds with the repaired lockfile.
- Forward migrations apply from a fresh disposable local database.
- Production build, TypeScript, ESLint, formatting, and diff checks pass.
- Five validation tests cover contact requirements, redirects, Instagram normalization, ratings, and resume bounds.
- Nine database/storage integration tests cover ownership, role protection, applicant privacy, application-specific attachments/contact snapshots, private ratings, required fields, duplicate prevention, and closing/reopening jobs.
- Three browser scenarios pass against the production build: the hiring loop at desktop/375px mobile widths, actual invitation emails and expired links, and password recovery in a fresh browser context. The hiring scenario also checks business photo upload, rating filters, retaining job input after validation errors, and retaining a cover letter/resume when a job closes before submission and later reopens.
- Desktop/mobile screenshots were visually inspected; public listings fit the 375px viewport. Browser automation used local Playwright after the in-app Browser connector failed before session initialization.
- Integration/browser fixtures are removed after verification. Two synthetic demo accounts and three Portland listings remain intentionally available.

Run `npm run demo:alpha` to recreate the local demo. Business login: `business@alpha.example`; applicant login: `applicant@alpha.example`. Both synthetic local accounts use `BehindTheChair-Alpha1!`. Start locally with `npm run dev:alpha`; see README for hosted prerequisites and invitation commands.

Application notification emails are deliberately disabled for alpha; the dashboard is the source of truth. Stripe checkout and payment webhooks are disabled. The hosted preview is not complete until its access protection, auth/mail configuration, migrations, and full hiring flow are verified on the selected deployment.

## Hosted configuration — 2026-10-16

The production Vercel variables were verified. `NEXT_PUBLIC_SUPABASE_URL` was corrected to the chosen hosted project, and its public key was accepted by Supabase. The existing “Salon App” project (`itpvubcxmvwxawibkicr`) belongs to the “Adam Bohannon” organization accessible through the CLI. Before migration it held two accounts, one business, one job, and no applicants or applications.

Only pending migration `00003_private_alpha.sql` was pushed after a dry run; existing data was preserved. Hosted auth now uses `https://behind-the-chair.vercel.app`, exact callback URLs, invitation-only signup, an enabled email provider, and the repository’s invitation/recovery templates. Custom SMTP remains unconfigured. The invitation script supports `--link` for manual one-time invitations without sending email; self-service recovery email still requires an email provider.

Ignored `.env.hosted` holds local administrative credentials for this project. Vercel has only the three public runtime variables. Automatic Git deployments are enabled. GitHub checks passed for commit `85990c1`.

## Hosted verification — 2026-10-16

Production deployment `dpl_48pAfxN5mSjm1JBYg6P4yqBZn5JB` is ready at https://behind-the-chair.vercel.app, built from `85990c1` in the personal Vercel account. Authentication protection remains enabled for all deployments.

The hosted browser hiring scenario passed at desktop and 375px mobile widths: business profile/photo upload, validation without losing input, free job publication, login return to the selected job, required applicant profile, tailored PDF and cover letter, closed-job retry, employer review, persistent private rating, interview stage, filtering, applicant history, and closed-listing history. All ten database/storage integration checks also passed against the hosted backend, covering invitation-only signup, ownership, unrelated-user privacy, resume isolation, application contact snapshots, private ratings, job lifecycle, and manual invitation link generation. Synthetic users, listings, applications, invitations, and uploads were removed afterward. Original hosted counts remain two profiles, one business, one job, and zero applications. The temporary Vercel automation bypass was revoked.

Remaining handoff: invite the partner to the protected Vercel deployment and create their application account using a manual one-time invitation. Custom SMTP and hosted email delivery/recovery remain unconfigured and unverified. Local email tests do not establish hosted email delivery. No real partner invitation has been sent.

## Business self-registration — 2026-10-16

Supersedes the invitation-only business access decision above. Businesses can create an account at `/signup` using email and password and continue to their profile. Applicants still receive their role through the trusted invitation registry. Migration `00004_business_registration.sql` defaults uninvited accounts to employer and ignores role metadata. Existing accounts and invited roles are preserved.

The production domain must be public for this flow; generated deployment URLs and previews remain protected. Email confirmation is disabled during this early alpha because SMTP is not configured. Password reset email still needs SMTP. Posting remains free and Portland-only.
