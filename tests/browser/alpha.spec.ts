import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
const api = process.env.NEXT_PUBLIC_SUPABASE_URL!;
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(api))
  throw new Error("Browser tests require local Supabase");
const admin = createClient(api, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const users: string[] = [];
const emails: string[] = [];
const paths: string[] = [];
const suffix = crypto.randomUUID().slice(0, 8);
const password = "Alpha-browser-12345!";
async function account(role: "employer" | "seeker") {
  const email = `browser-${role}-${emails.length}-${suffix}@alpha.example`;
  emails.push(email);
  const { error: inviteError } = await admin
    .from("alpha_invites")
    .insert({ email, role });
  if (inviteError) throw inviteError;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  users.push(data.user!.id);
  return { id: data.user!.id, email };
}
async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
async function emailLink(email: string, type: "invite" | "recovery") {
  let link = "";
  await expect
    .poll(
      async () => {
        const inbox = await (
          await fetch("http://127.0.0.1:54324/api/v1/messages")
        ).json();
        for (const message of inbox.messages ?? []) {
          if (
            !message.To?.some((to: { Address: string }) => to.Address === email)
          )
            continue;
          const detail = await (
            await fetch(`http://127.0.0.1:54324/api/v1/message/${message.ID}`)
          ).json();
          const candidate =
            String(detail.HTML ?? "")
              .match(/href="([^"]*token_hash=[^"]+)"/)?.[1]
              ?.replaceAll("&amp;", "&") ?? "";
          if (candidate.includes(`type=${type}`)) {
            link = candidate;
            return true;
          }
        }
        return false;
      },
      { message: "Expected local auth email to arrive" },
    )
    .toBe(true);
  return link;
}
test.afterAll(async () => {
  // Capture files before cascading fixture accounts away.
  const { data: apps } = await admin.from("applications").select("resume_path");
  for (const a of apps ?? [])
    if (a.resume_path && users.some((id) => a.resume_path.startsWith(`${id}/`)))
      paths.push(a.resume_path);
  if (paths.length) {
    const { error } = await admin.storage.from("resumes").remove(paths);
    if (error) throw error;
  }
  for (const id of users) {
    const { data: images } = await admin.storage.from("logos").list(id);
    if (images?.length)
      await admin.storage
        .from("logos")
        .remove(images.filter((i) => i.id).map((i) => `${id}/${i.name}`));
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;
  }
  await admin.from("alpha_invites").delete().in("email", emails);
});
for (const role of ["employer", "seeker"] as const) {
  test(`${role} self-registration creates the right profile and handles duplicate email`, async ({
    page,
  }) => {
    const email = `signup-browser-${role}-${suffix}@alpha.example`;
    emails.push(email);
    await page.goto("/signup");
    await page
      .getByRole("radio", {
        name: role === "seeker" ? "Find work" : "Hire for my business",
        exact: true,
      })
      .check();
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/${role}/profile$`));
    const { data, error } = await admin.auth.admin.listUsers();
    if (error) throw error;
    const created = data.users.find((user) => user.email === email);
    if (created) users.push(created.id);
    await expect(
      page.getByRole("heading", {
        name: role === "seeker" ? "Your profile" : "Your business",
        exact: true,
      }),
    ).toBeVisible();
    await page.context().clearCookies();
    await page.goto("/signup");
    await page
      .getByRole("radio", {
        name: role === "seeker" ? "Find work" : "Hire for my business",
        exact: true,
      })
      .check();
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(
      page.getByRole("alert").filter({ hasText: "already has an account" }),
    ).toBeVisible();
  });
}
test("business posts, applicant applies with a tailored resume, business reviews and rates, mobile history stays private", async ({
  browser,
  page,
}) => {
  const business = await account("employer");
  const applicant = await account("seeker");
  await login(page, business.email);
  await expect(
    page.getByRole("heading", { name: "Your business", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Business name").fill(`Chapter Studio ${suffix}`);
  await page
    .getByLabel("About your business")
    .fill("A welcoming Portland studio for hair and beauty professionals.");
  await page
    .getByLabel("Public street address", { exact: false })
    .fill("123 Test Street, Suite 4");
  await page.getByLabel("Monday hours", { exact: true }).selectOption("open");
  await page.getByLabel("Monday opens", { exact: true }).fill("09:00");
  await page.getByLabel("Monday closes", { exact: true }).fill("17:00");
  await page.getByLabel("Sunday hours", { exact: true }).selectOption("closed");
  await page.getByLabel("Monday closes", { exact: true }).fill("08:00");
  await page
    .getByRole("button", { name: "Save business", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Check your business hours" }),
  ).toBeVisible();
  await expect(page.getByLabel("Business name")).toHaveValue(
    `Chapter Studio ${suffix}`,
  );
  await page.getByLabel("Monday closes", { exact: true }).fill("17:00");

  await page
    .getByRole("button", { name: "Save business", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Business saved" }),
  ).toBeVisible();
  await page.getByLabel("Business image", { exact: true }).setInputFiles({
    name: "studio.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9WQAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByRole("button", { name: "Upload image", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Image saved." }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: `Chapter Studio ${suffix} gallery photo 1`,
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Business name")).toHaveValue(
    `Chapter Studio ${suffix}`,
  );
  await page
    .getByRole("link", { name: "Post a Job", exact: true })
    .first()
    .click();
  await page.getByLabel("Job title").fill(`Hair stylist ${suffix}`);
  await page
    .getByLabel("Description", { exact: false })
    .fill(
      "Bring your creativity to our Portland team. Hourly plus commission.",
    );
  await page
    .getByLabel("Role", { exact: false })
    .selectOption("cut_color_stylist");
  await page
    .getByLabel("Days and hours", { exact: false })
    .fill("Tuesday–Saturday, 10am–6pm");
  await page
    .getByLabel("Benefits and perks", { exact: false })
    .fill("Paid education and product discounts");
  await page.getByLabel("Minimum ($)", { exact: true }).fill("25");
  await page.getByLabel("Maximum ($)", { exact: true }).fill("40");
  await page.getByLabel("Rate unit").selectOption("hour");
  await page.getByLabel("Commission (%)").fill("10");
  await page.getByLabel("Minimum ($)", { exact: true }).fill("50");
  await page.getByRole("button", { name: "Create draft", exact: true }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Minimum pay must not exceed maximum pay" }),
  ).toBeVisible();
  await expect(page.getByLabel("Job title")).toHaveValue(
    `Hair stylist ${suffix}`,
  );
  await expect(page.getByLabel("Minimum ($)", { exact: true })).toHaveValue(
    "50",
  );
  await page.getByLabel("Minimum ($)", { exact: true }).fill("25");

  await page.getByRole("button", { name: "Create draft", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Job Preview", exact: true }),
  ).toBeVisible();
  const jobId = new URL(page.url()).pathname.split("/")[3];
  await expect(
    page.getByText("Paid education and product discounts", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Edit Post", exact: true }).click();
  await expect(page.getByLabel("Role", { exact: false })).toHaveValue(
    "cut_color_stylist",
  );
  await expect(page.getByLabel("Days and hours", { exact: false })).toHaveValue(
    "Tuesday–Saturday, 10am–6pm",
  );
  await expect(
    page.getByLabel("Benefits and perks", { exact: false }),
  ).toHaveValue("Paid education and product discounts");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Job Preview", exact: true }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Publish job · Free", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Close listing", exact: true }),
  ).toBeVisible();
  const candidateContext = await browser.newContext({
    viewport: { width: 375, height: 844 },
  });
  const candidatePage = await candidateContext.newPage();
  const publicHref = (await page
    .getByRole("link", { name: "View public page", exact: true })
    .count())
    ? await page
        .getByRole("link", { name: "View public page", exact: true })
        .getAttribute("href")
    : null;
  const { data: publicBusiness } = await admin
    .from("employer_profiles")
    .select("id")
    .eq("user_id", business.id)
    .single();
  const businessUrl = publicHref ?? `/businesses/${publicBusiness!.id}`;
  await candidatePage.goto(businessUrl);
  await expect(
    candidatePage.getByRole("heading", {
      name: `Chapter Studio ${suffix}`,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    candidatePage.getByText("123 Test Street, Suite 4", { exact: true }),
  ).toBeVisible();
  await expect(
    candidatePage.getByText("9:00 AM–5:00 PM", { exact: true }),
  ).toBeVisible();
  await expect(
    candidatePage.getByText("Closed", { exact: true }),
  ).toBeVisible();
  await expect(
    candidatePage.getByRole("link", {
      name: new RegExp(`Hair stylist ${suffix}`),
    }),
  ).toBeVisible();
  expect(
    await candidatePage.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await candidatePage.goto(
    `/jobs?q=${suffix}&category=Hair&role=cut_color_stylist`,
  );
  await expect(
    candidatePage.getByRole("link", {
      name: new RegExp(`Hair stylist ${suffix}`),
    }),
  ).toBeVisible();

  await candidatePage.goto(`/jobs/${jobId}`);
  await expect(
    candidatePage.getByText("Tuesday–Saturday, 10am–6pm", { exact: true }),
  ).toBeVisible();
  await expect(
    candidatePage.getByText("Paid education and product discounts", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    candidatePage.getByRole("link", { name: "View business", exact: true }),
  ).toHaveAttribute("href", businessUrl);

  await candidatePage
    .getByRole("button", { name: "Apply Now", exact: true })
    .click();
  await expect(candidatePage).toHaveURL(new RegExp(`/login\\?returnTo=`));
  await candidatePage
    .getByLabel("Email", { exact: true })
    .fill(applicant.email);
  await candidatePage.getByLabel("Password", { exact: true }).fill(password);
  await candidatePage
    .getByRole("button", { name: "Sign in", exact: true })
    .click();
  await expect(candidatePage).toHaveURL(new RegExp(`/jobs/${jobId}$`));
  await candidatePage
    .getByRole("button", { name: "Apply Now", exact: true })
    .click();
  await expect(
    candidatePage.getByRole("heading", { name: "Your profile", exact: true }),
  ).toBeVisible();
  await candidatePage.getByLabel("Full name").fill("Taylor Test");
  await candidatePage.getByLabel("Phone number").fill("503-555-0100");
  await candidatePage
    .getByRole("button", { name: "Save profile", exact: true })
    .click();
  await expect(
    candidatePage.getByRole("heading", {
      name: `Hair stylist ${suffix}`,
      exact: true,
    }),
  ).toBeVisible();
  await candidatePage
    .getByRole("button", { name: "Apply Now", exact: true })
    .click();
  await candidatePage.getByLabel("Resume (PDF, up to 10 MB)").setInputFiles({
    name: "taylor-tailored.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\nTailored to Chapter Studio\n%%EOF"),
  });
  await candidatePage
    .getByLabel("Personalized cover letter")
    .fill(
      "I love your approach to community and would love to join your team.",
    );
  // A listing may close after an applicant opens the form. Preserve their
  // cover letter and staged upload so they can retry if the business reopens it.
  await page
    .getByRole("button", { name: "Close listing", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Reopen listing", exact: true }),
  ).toBeVisible();
  await candidatePage
    .getByRole("button", { name: "Submit application", exact: true })
    .click();
  await expect(
    candidatePage
      .getByRole("alert")
      .filter({ hasText: "This job is no longer accepting applications" }),
  ).toBeVisible();
  await expect(
    candidatePage.getByLabel("Personalized cover letter"),
  ).toHaveValue(
    "I love your approach to community and would love to join your team.",
  );
  await expect(
    candidatePage.getByText(/Ready to submit: taylor-tailored.pdf/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reopen listing", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Close listing", exact: true }),
  ).toBeVisible();
  await candidatePage
    .getByRole("button", { name: "Submit application", exact: true })
    .click();
  await expect(
    candidatePage.getByRole("button", { name: "Already Applied", exact: true }),
  ).toBeVisible();
  await page.goto(`/employer/jobs/${jobId}/applications`);
  await page.getByRole("link").filter({ hasText: "Taylor Test" }).click();
  await expect(
    page.getByRole("link", { name: "503-555-0100", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "I love your approach to community and would love to join your team.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Open resume/ })).toBeVisible();
  await page.getByLabel("Private rating", { exact: true }).selectOption("5");
  await expect(page.getByLabel("Private rating", { exact: true })).toHaveValue(
    "5",
  );
  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "Interview", exact: true }).click();
  await expect(page.getByRole("combobox").first()).toHaveText("Interview");
  await page.reload();
  await expect(page.getByLabel("Private rating", { exact: true })).toHaveValue(
    "5",
  );
  await page.goto(`/employer/jobs/${jobId}/applications`);
  await page.getByLabel("Rating", { exact: true }).selectOption("5");
  await page.getByLabel("Stage", { exact: true }).selectOption("interview");
  await page
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await expect(
    page.getByRole("link").filter({ hasText: "Taylor Test" }),
  ).toBeVisible();
  await page.getByLabel("Rating", { exact: true }).selectOption("1");
  await page
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await expect(
    page.getByText("No candidates match these filters.", { exact: true }),
  ).toBeVisible();
  await candidatePage.goto("/seeker/applications");
  await expect(
    candidatePage.getByText("Interview", { exact: true }),
  ).toBeVisible();
  await expect(candidatePage.getByText(/Private rating/)).toHaveCount(0);
  await expect(
    candidatePage.getByRole("link", { name: /Submitted resume/ }),
  ).toBeVisible();
  await expect(candidatePage.locator("body")).toBeVisible();
  expect(
    await candidatePage.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto(`/employer/jobs/${jobId}/applications`);
  await page
    .getByRole("button", { name: "Close listing", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Reopen listing", exact: true }),
  ).toBeVisible();
  await candidatePage.reload();
  await expect(candidatePage.getByText(/Listing closed/)).toBeVisible();
  await page.goto(businessUrl);
  await expect(
    page.getByText("No open positions right now", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: new RegExp(`Hair stylist ${suffix}`) }),
  ).toHaveCount(0);
  await candidateContext.close();
});
test("invitation token exchange and expired-link recovery", async ({
  page,
}) => {
  const email = `invited-${suffix}@alpha.example`;
  emails.push(email);
  const { error } = await admin
    .from("alpha_invites")
    .insert({ email, role: "seeker" });
  if (error) throw error;
  const generated = await admin.auth.admin.inviteUserByEmail(email);
  if (generated.error) throw generated.error;
  users.push(generated.data.user!.id);
  await page.goto(await emailLink(email, "invite"));
  await expect(
    page.getByRole("heading", { name: "Set your password", exact: true }),
  ).toBeVisible();
  await page.getByLabel("New password").fill(password);
  await page
    .getByRole("button", { name: "Save password", exact: true })
    .click();
  await expect(page).toHaveURL(/\/jobs$/);
  await page.goto("/callback?token_hash=invalid&type=invite");
  await expect(
    page.getByRole("heading", { name: "Recover your account", exact: true }),
  ).toBeVisible();
});

test("password recovery email works in a fresh browser context", async ({
  page,
  browser,
}) => {
  const applicant = await account("seeker");
  await page.goto("/forgot-password");
  await page.getByLabel("Email", { exact: true }).fill(applicant.email);
  await page
    .getByRole("button", { name: "Send recovery email", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText(
    "If an account exists, you’ll receive a recovery email shortly.",
  );
  const recoveryLink = await emailLink(applicant.email, "recovery");
  const fresh = await browser.newContext();
  const recovered = await fresh.newPage();
  await recovered.goto(recoveryLink);
  await expect(
    recovered.getByRole("heading", { name: "Set your password", exact: true }),
  ).toBeVisible();
  await recovered.getByLabel("New password").fill("Recovered-alpha-12345!");
  await recovered
    .getByRole("button", { name: "Save password", exact: true })
    .click();
  await expect(recovered).toHaveURL(/\/jobs$/);
  await fresh.close();
});

test("public business fallback, role discovery and pagination preserve filters and hide nonpublic jobs", async ({
  page,
}) => {
  const owner = await account("employer");
  const { data: business, error } = await admin
    .from("employer_profiles")
    .insert({
      user_id: owner.id,
      salon_name: `Discovery Studio ${suffix}`,
      description:
        "A Portland workplace with opportunities across beauty industries.",
      location_city: "Portland",
      location_state: "OR",
    })
    .select("id")
    .single();
  if (error) throw error;
  const fields = {
    employer_id: business!.id,
    description: "A welcoming team",
    job_type: "hourly" as const,
    experience_level: "entry" as const,
    city: "Portland",
    state: "OR",
  };
  const listings = [
    ...Array.from({ length: 13 }, (_, i) => ({
      ...fields,
      title: `Reception ${suffix} ${i}`,
      category: "Hair",
      role_category: "receptionist",
      status: "active" as const,
      posted_at: new Date(1700000000000 + i * 1000).toISOString(),
    })),
    {
      ...fields,
      title: `Nails reception ${suffix}`,
      category: "Nails",
      role_category: "receptionist",
      status: "active" as const,
    },
    {
      ...fields,
      title: `Legacy opportunity ${suffix}`,
      category: "Hair",
      status: "active" as const,
    },
    {
      ...fields,
      title: `Draft hidden ${suffix}`,
      category: "Hair",
      status: "draft" as const,
    },
    {
      ...fields,
      title: `Closed hidden ${suffix}`,
      category: "Hair",
      status: "closed" as const,
    },
  ];
  const inserted = await admin.from("job_posts").insert(listings);
  if (inserted.error) throw inserted.error;
  await page.goto(`/businesses/${business!.id}`);
  await expect(
    page.getByRole("heading", {
      name: `Discovery Studio ${suffix}`,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Hours not specified. Contact the business for details.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: new RegExp(`Draft hidden ${suffix}`) }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: new RegExp(`Closed hidden ${suffix}`) }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "test-results/business-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 844 });
  await page.screenshot({
    path: "test-results/business-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto(`/jobs?q=${suffix}&category=Hair&role=receptionist`);
  await expect(
    page.getByRole("link", { name: new RegExp(`Reception ${suffix}`) }),
  ).toHaveCount(12);
  await page.getByRole("link", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(new RegExp("role=receptionist"));
  await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: new RegExp(`Reception ${suffix}`) }),
  ).toHaveCount(1);
  await page
    .getByRole("combobox", { name: "Industry", exact: true })
    .selectOption("Nails");
  await page.getByRole("button", { name: "Find jobs", exact: true }).click();
  await expect(page.getByText("Page 1", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: new RegExp(`Nails reception ${suffix}`) }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Role", exact: true })
    .selectOption("nail_technician");
  await page
    .getByRole("combobox", { name: "Industry", exact: true })
    .selectOption("Hair");
  await expect(
    page.getByRole("combobox", { name: "Role", exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByRole("status").filter({ hasText: "Role filter reset" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Find jobs", exact: true }).click();
  // Legacy jobs without a role stay available in general industry searches.
  await page.goto(`/jobs?q=Legacy%20opportunity%20${suffix}&category=Hair`);
  await expect(
    page.getByRole("link", {
      name: new RegExp(`Legacy opportunity ${suffix}`),
    }),
  ).toBeVisible();
  await page.goto(`/jobs?q=${suffix}&category=Hair&role=nail_technician`);
  await expect(
    page.getByRole("status").filter({ hasText: "role filter was reset" }),
  ).toBeVisible();
  await page.goto("/businesses/not-a-valid-id");
  await expect(
    page.getByRole("heading", { name: "404", exact: true }),
  ).toBeVisible();
});
