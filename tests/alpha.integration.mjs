import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !/^http:\/\/(127\.0\.0\.1|localhost):/.test(url))
  throw new Error(
    "Integration tests require the isolated local Supabase environment.",
  );
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const ids = [];
const paths = [];
const emails = [];
const run = crypto.randomUUID().slice(0, 8);
async function account(role) {
  const email = `${role}-${emails.length}-${run}@alpha.example`;
  emails.push(email);
  const { error: inviteError } = await admin
    .from("alpha_invites")
    .insert({ email, role });
  assert.equal(inviteError, null);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: "Alpha-test-12345!",
    email_confirm: true,
  });
  assert.equal(error, null);
  ids.push(data.user.id);
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  assert.equal(
    (
      await client.auth.signInWithPassword({
        email,
        password: "Alpha-test-12345!",
      })
    ).error,
    null,
  );
  return { client, user: data.user };
}
function ok(result) {
  assert.equal(result.error, null, JSON.stringify(result.error));
  return result.data;
}
let employer,
  other,
  seeker,
  seeker2,
  business,
  job,
  job2,
  application,
  firstPath;
async function cleanup() {
  if (paths.length) ok(await admin.storage.from("resumes").remove(paths));
  for (const id of ids) ok(await admin.auth.admin.deleteUser(id));
  if (emails.length)
    ok(await admin.from("alpha_invites").delete().in("email", emails));
}
await test("uninvited accounts cannot register even through the direct Auth API", async () => {
  const result = await anon.auth.signUp({
    email: `uninvited-${run}@alpha.example`,
    password: "Alpha-test-12345!",
  });
  assert.ok(result.error);
});
await test("create isolated employer and applicant fixtures", async () => {
  employer = await account("employer");
  other = await account("employer");
  seeker = await account("seeker");
  seeker2 = await account("seeker");
  business = ok(
    await employer.client
      .from("employer_profiles")
      .upsert(
        {
          user_id: employer.user.id,
          salon_name: `Alpha Salon ${run}`,
          location_city: "Portland",
          location_state: "OR",
          description: "A synthetic test business",
        },
        { onConflict: "user_id" },
      )
      .select()
      .single(),
  );
  ok(
    await other.client.from("employer_profiles").insert({
      user_id: other.user.id,
      salon_name: "Unrelated salon",
      location_city: "Portland",
      location_state: "OR",
      description: "A different business",
    }),
  );
  for (const a of [seeker, seeker2])
    ok(
      await a.client.from("seeker_profiles").upsert(
        {
          user_id: a.user.id,
          contact_email: a.user.email,
          phone: "503-555-0100",
        },
        { onConflict: "user_id" },
      ),
    );
  const fields = {
    employer_id: business.id,
    title: "Portland stylist",
    description: "Hair and nail professionals welcome",
    job_type: "hourly",
    experience_level: "entry",
    category: "Hair",
    city: "Portland",
    state: "OR",
    arrangement: "employment",
    schedule: "part_time",
    pay_unit: "hour",
    pay_range_low: 2500,
    pay_range_high: 3500,
  };
  job = ok(
    await employer.client.from("job_posts").insert(fields).select().single(),
  );
  job2 = ok(
    await employer.client
      .from("job_posts")
      .insert({ ...fields, title: "Portland colorist" })
      .select()
      .single(),
  );
});
await test("roles, draft visibility, and ownership cannot be bypassed through REST", async () => {
  assert.ok(
    (
      await seeker.client
        .from("profiles")
        .update({ role: "employer" })
        .eq("id", seeker.user.id)
    ).error,
  );
  assert.ok(
    (
      await seeker.client.from("employer_profiles").insert({
        user_id: seeker.user.id,
        salon_name: "Bypass",
        location_city: "Portland",
        location_state: "OR",
        description: "No",
      })
    ).error,
  );
  assert.equal(
    ok(await anon.from("job_posts").select().eq("id", job.id)).length,
    0,
  );
  assert.equal(
    ok(await other.client.from("job_posts").select().eq("id", job.id)).length,
    0,
  );
  assert.ok(
    (
      await other.client.rpc("set_job_status", {
        job_id: job.id,
        new_status: "active",
      })
    ).error,
  );
  assert.ok(
    (
      await employer.client
        .from("job_posts")
        .update({ status: "active" })
        .eq("id", job.id)
    ).error,
  );
  ok(
    await employer.client.rpc("set_job_status", {
      job_id: job.id,
      new_status: "active",
    }),
  );
  ok(
    await employer.client.rpc("set_job_status", {
      job_id: job2.id,
      new_status: "active",
    }),
  );
  assert.equal(
    ok(await anon.from("job_posts").select().eq("id", job.id)).length,
    1,
  );
});
await test("keyword search includes business name and category", async () => {
  const matches = ok(
    await anon.rpc("search_jobs", { keyword: run, industry: "Hair" }),
  );
  assert.equal(matches.length, 2);
  assert.equal(
    ok(await anon.rpc("search_jobs", { keyword: run, industry: "Nails" }))
      .length,
    0,
  );
});
async function resume(marker) {
  const path = `${seeker.user.id}/${crypto.randomUUID()}/resume.pdf`;
  paths.push(path);
  ok(
    await seeker.client.storage
      .from("resumes")
      .upload(
        path,
        new Blob([`%PDF-1.4\n${marker}\n%%EOF`], { type: "application/pdf" }),
        { contentType: "application/pdf" },
      ),
  );
  return path;
}
const args = (path, jobId = job.id) => ({
  job_id: jobId,
  applicant_name: "Taylor Applicant",
  email: "taylor@alpha.example",
  telephone: "503-555-0100",
  letter: "I would love to join your team.",
  file_path: path,
  file_name: "tailored.pdf",
});
await test("application submission requires email, phone, and owned resume", async () => {
  firstPath = await resume("Resume A");
  for (const patch of [
    { email: "" },
    { telephone: "" },
    { file_path: "" },
    { file_path: `${other.user.id}/resume.pdf` },
    { applicant_name: "" },
  ])
    assert.ok(
      (
        await seeker.client.rpc("submit_application", {
          ...args(firstPath),
          ...patch,
        })
      ).error,
    );
  assert.ok(
    (
      await seeker.client.from("applications").insert({
        job_post_id: job.id,
        seeker_id: crypto.randomUUID(),
        status: "hired",
      })
    ).error,
  );
  application = ok(
    await seeker.client.rpc("submit_application", args(firstPath)),
  );
  assert.ok(
    (await seeker.client.rpc("submit_application", args(firstPath))).error,
  );
});
await test("tailored attachments and contact snapshots remain independent", async () => {
  const path2 = await resume("Resume B");
  ok(
    await seeker.client.rpc("submit_application", {
      ...args(path2, job2.id),
      letter: "",
    }),
  );
  ok(
    await seeker.client
      .from("seeker_profiles")
      .update({ contact_email: "new@alpha.example", phone: "5035550199" })
      .eq("user_id", seeker.user.id),
  );
  const original = ok(
    await employer.client
      .from("applications")
      .select("*")
      .eq("id", application)
      .single(),
  );
  assert.equal(original.resume_path, firstPath);
  assert.equal(original.contact_email, "taylor@alpha.example");
  assert.match(
    await ok(
      await employer.client.storage.from("resumes").download(firstPath),
    ).text(),
    /Resume A/,
  );
  assert.match(
    await ok(
      await employer.client.storage.from("resumes").download(path2),
    ).text(),
    /Resume B/,
  );
  assert.ok(
    (
      await seeker.client.storage
        .from("resumes")
        .upload(firstPath, new Blob(["changed"], { type: "application/pdf" }), {
          upsert: true,
        })
    ).error,
  );
  await seeker.client.storage.from("resumes").remove([firstPath]);
  assert.ok(
    ok(await seeker.client.storage.from("resumes").download(firstPath)),
  );
});
await test("private applicant information is isolated from anonymous visitors and unrelated users", async () => {
  for (const client of [anon, other.client, seeker2.client]) {
    assert.equal(
      ok(await client.from("applications").select().eq("id", application))
        .length,
      0,
    );
    assert.equal(
      ok(
        await client
          .from("seeker_profiles")
          .select()
          .eq("user_id", seeker.user.id),
      ).length,
      0,
    );
    assert.equal(
      ok(await client.from("profiles").select().eq("id", seeker.user.id))
        .length,
      0,
    );
    assert.ok(
      (await client.storage.from("resumes").createSignedUrl(firstPath, 60))
        .error,
    );
  }
  assert.equal(
    ok(
      await employer.client
        .from("seeker_profiles")
        .select()
        .eq("user_id", seeker.user.id),
    ).length,
    1,
  );
});
await test("private integer ratings support set, edit, clear and never change interview status", async () => {
  ok(
    await employer.client
      .from("applications")
      .update({ status: "interview" })
      .eq("id", application),
  );
  for (const rating of [0, 6, 1.5])
    assert.ok(
      (
        await employer.client
          .from("application_ratings")
          .upsert({ application_id: application, rating })
      ).error,
    );
  for (const rating of [5, 2]) {
    ok(
      await employer.client
        .from("application_ratings")
        .upsert({ application_id: application, rating }),
    );
    assert.equal(
      ok(
        await employer.client
          .from("application_ratings")
          .select()
          .eq("application_id", application)
          .single(),
      ).rating,
      rating,
    );
  }
  for (const client of [seeker.client, other.client]) {
    assert.equal(
      ok(
        await client
          .from("application_ratings")
          .select()
          .eq("application_id", application),
      ).length,
      0,
    );
    assert.ok(
      (
        await client
          .from("application_ratings")
          .upsert({ application_id: application, rating: 1 })
      ).error,
    );
  }
  const embedded = ok(
    await seeker.client
      .from("applications")
      .select("id,application_ratings(rating)")
      .eq("id", application)
      .single(),
  );
  assert.equal(embedded.application_ratings, null);
  ok(
    await employer.client
      .from("application_ratings")
      .delete()
      .eq("application_id", application),
  );
  assert.equal(
    ok(
      await employer.client
        .from("application_ratings")
        .select()
        .eq("application_id", application),
    ).length,
    0,
  );
  assert.equal(
    ok(
      await employer.client
        .from("applications")
        .select("status")
        .eq("id", application)
        .single(),
    ).status,
    "interview",
  );
  assert.ok(
    (
      await employer.client
        .from("applications")
        .update({ contact_email: "changed@alpha.example" })
        .eq("id", application)
    ).error,
  );
});
await test("closed listings stop submissions but preserve applicant history and can reopen", async () => {
  ok(
    await employer.client.rpc("set_job_status", {
      job_id: job.id,
      new_status: "closed",
    }),
  );
  assert.equal(
    ok(await anon.from("job_posts").select().eq("id", job.id)).length,
    0,
  );
  assert.equal(
    ok(await seeker.client.from("job_posts").select().eq("id", job.id)).length,
    1,
  );
  assert.ok(
    (await seeker.client.rpc("submit_application", args(firstPath))).error,
  );
  ok(
    await employer.client.rpc("set_job_status", {
      job_id: job.id,
      new_status: "active",
    }),
  );
  assert.equal(
    ok(await anon.from("job_posts").select().eq("id", job.id)).length,
    1,
  );
});

await test("manual invitations produce a one-time link without email delivery", async () => {
  const email = `manual-${run}@alpha.example`;
  emails.push(email);
  const output = execFileSync(
    process.execPath,
    ["scripts/invite.mjs", email, "seeker", "--link"],
    { encoding: "utf8", env: process.env },
  );
  const link = new URL(output.trim().split("\n").at(-1));
  assert.equal(link.origin, process.env.NEXT_PUBLIC_APP_URL);
  assert.equal(link.pathname, "/callback");
  assert.equal(link.searchParams.get("type"), "invite");
  assert.ok(link.searchParams.get("token_hash"));
  const { users } = ok(
    await admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  );
  const invited = users.find((u) => u.email === email);
  assert.ok(invited);
  ids.push(invited.id);
});
await cleanup();
