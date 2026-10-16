import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url ?? ""))
  throw new Error("Demo accounts are for local Supabase only.");
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const password = "BehindTheChair-Alpha1!";
function ok(r) {
  if (r.error) throw r.error;
  return r.data;
}
async function account(email, role, name) {
  ok(await admin.from("alpha_invites").upsert({ email, role }));
  const { users } = ok(
    await admin.auth.admin.listUsers({ page: 1, perPage: 100 }),
  );
  let user = users.find((u) => u.email === email);
  if (!user)
    user = ok(
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name },
      }),
    ).user;
  ok(
    await admin
      .from("profiles")
      .update({ full_name: name, profile_complete: true })
      .eq("id", user.id),
  );
  return user;
}
const owner = await account(
  "business@alpha.example",
  "employer",
  "Morgan Studio",
);
const applicant = await account(
  "applicant@alpha.example",
  "seeker",
  "Taylor Morgan",
);
const business = ok(
  await admin
    .from("employer_profiles")
    .upsert(
      {
        user_id: owner.id,
        salon_name: "Juniper Studio",
        location_city: "Portland",
        location_state: "OR",
        description:
          "A small, welcoming Portland beauty studio. We believe great work starts with a supportive team and room to grow.",
        instagram_handle: "juniperstudio",
      },
      { onConflict: "user_id" },
    )
    .select()
    .single(),
);
const seeker = ok(
  await admin
    .from("seeker_profiles")
    .upsert(
      {
        user_id: applicant.id,
        headline: "Colorist & stylist · Thoughtful color, confident clients",
        bio: "I love working with dimensional color and helping clients feel at home in the chair. Looking for a collaborative Portland team.",
        contact_email: applicant.email,
        phone: "503-555-0100",
        city: "Portland",
        state: "OR",
        specialties: ["Stylist", "Colorist"],
        years_experience: 4,
      },
      { onConflict: "user_id" },
    )
    .select()
    .single(),
);
const existing = ok(
  await admin
    .from("job_posts")
    .select("id,title")
    .eq("employer_id", business.id),
);
for (const row of [
  {
    title: "Hair stylist · Make room for your next chapter",
    category: "Hair",
    specialties: ["Stylist", "Colorist"],
    description:
      "Join a warm, collaborative team in Portland. Bring your craft, curiosity, and care for clients. We offer a thoughtful onboarding process, flexible scheduling, and a supportive environment to grow your books.",
    pay_range_low: 2500,
    pay_range_high: 4000,
    pay_unit: "hour",
    commission_percent: 10,
  },
  {
    title: "Nail artist · Creativity welcome",
    category: "Nails",
    specialties: ["Nail Artist"],
    description:
      "We’re looking for a nail artist who values precise work and personal expression. Share your portfolio, tell us about your approach, and let’s find a schedule that works for you.",
    pay_range_low: 2200,
    pay_range_high: 3200,
    pay_unit: "hour",
  },
  {
    title: "Esthetician · Care beyond the surface",
    category: "Skin & Facials",
    specialties: ["Esthetician"],
    description:
      "Help our clients build thoughtful skincare routines. We welcome estheticians who value education, attentive care, and working as part of a close-knit team.",
    pay_range_low: 2400,
    pay_range_high: 3600,
    pay_unit: "hour",
  },
]) {
  if (existing.some((j) => j.title === row.title)) continue;
  ok(
    await admin.from("job_posts").insert({
      ...row,
      employer_id: business.id,
      job_type: "hourly",
      experience_level: "mid",
      city: "Portland",
      state: "OR",
      arrangement: "employment",
      schedule: "flexible",
      status: "active",
      posted_at: new Date().toISOString(),
    }),
  );
}
console.log("Local demo is ready at http://localhost:3000.");
console.log("Business: business@alpha.example");
console.log("Applicant: applicant@alpha.example");
console.log(`Password for both synthetic demo accounts: ${password}`);
console.log(
  "These accounts and listings exist only in the local test database.",
);
void seeker;
