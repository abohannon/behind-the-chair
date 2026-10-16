import { test } from "node:test";
import assert from "node:assert/strict";
import { safeReturnTo } from "../lib/auth/return-to.ts";
import {
  contactSchema,
  instagramHandle,
  ratingSchema,
  validateResume,
} from "../lib/validation/alpha.ts";
test("return destinations reject external URLs, encoded protocol tricks, and auth loops", () => {
  for (const path of [
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/login",
    "/callback",
    "/jobs\n/evil",
    "/%2f%2fevil",
    "/jobs/../../login",
    null,
  ])
    assert.equal(safeReturnTo(path), "/jobs");
  assert.equal(
    safeReturnTo("/jobs/abc?category=Hair"),
    "/jobs/abc?category=Hair",
  );
  assert.equal(safeReturnTo("/employer/dashboard"), "/employer/dashboard");
});
test("contact details require email and phone while Instagram remains optional", () => {
  const contact = {
    fullName: "Taylor",
    email: "taylor@example.com",
    phone: "+1 (503) 555-0100",
  };
  assert.equal(contactSchema.safeParse(contact).success, true);
  for (const patch of [
    { phone: "" },
    { phone: "abc5035550100" },
    { phone: "123" },
    { email: "" },
    { email: "not-an-email" },
    { fullName: " " },
  ])
    assert.equal(
      contactSchema.safeParse({ ...contact, ...patch }).success,
      false,
    );
  assert.equal(instagramHandle(""), null);
});
test("Instagram normalization accepts handle or profile URL and rejects arbitrary links", () => {
  assert.equal(instagramHandle("@taylor.hair"), "taylor.hair");
  assert.equal(
    instagramHandle("https://www.instagram.com/taylor.hair/"),
    "taylor.hair",
  );
  assert.throws(() => instagramHandle("https://example.com/taylor"));
});
test("ratings distinguish unrated from 1 and reject decimals and out-of-range values", () => {
  for (const value of [null, 1, 2, 3, 4, 5])
    assert.equal(ratingSchema.safeParse(value).success, true);
  for (const value of [0, 6, 1.5, "5", undefined])
    assert.equal(ratingSchema.safeParse(value).success, false);
});
test("resume boundary validates required PDF type and 10 MB size limit", () => {
  assert.ok(validateResume(null));
  assert.ok(
    validateResume(new File(["x"], "resume.txt", { type: "text/plain" })),
  );
  assert.ok(
    validateResume(
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], "resume.pdf", {
        type: "application/pdf",
      }),
    ),
  );
  assert.equal(
    validateResume(
      new File(["%PDF-1.4"], "resume.pdf", { type: "application/pdf" }),
    ),
    null,
  );
});

test("business hours distinguish missing and closed and reject malformed or overnight intervals", async () => {
  const { hoursSchema, hoursFromForm, formatBusinessTime } =
    await import("../lib/validation/business.ts");
  assert.equal(
    hoursSchema.safeParse({
      Monday: { state: "closed" },
      Tuesday: { state: "open", opens: "09:00", closes: "17:00" },
    }).success,
    true,
  );
  for (const hours of [
    { Funday: { state: "closed" } },
    { Monday: { state: "open", opens: "25:00", closes: "27:00" } },
    { Monday: { state: "open", opens: "17:00", closes: "09:00" } },
    { Monday: { state: "closed", opens: "09:00" } },
  ])
    assert.equal(hoursSchema.safeParse(hours).success, false);
  const f = new FormData();
  f.set("Monday-state", "closed");
  assert.deepEqual(hoursFromForm(f), { Monday: { state: "closed" } });
  assert.equal(formatBusinessTime("00:00"), "12:00 AM");
  assert.equal(formatBusinessTime("12:30"), "12:30 PM");
});
test("job roles work across industries or only in the matching industry", async () => {
  const { roleMatchesIndustry, roleLabel } =
    await import("../lib/constants/job-roles.ts");
  assert.equal(roleMatchesIndustry("receptionist", "Nails"), true);
  assert.equal(roleMatchesIndustry("cut_stylist", "Nails"), false);
  assert.equal(roleMatchesIndustry("nail_technician", "Nails"), true);
  assert.equal(roleMatchesIndustry("not-a-role", "Hair"), false);
  assert.equal(roleLabel("salon_manager"), "Salon Manager");
  assert.equal(roleLabel(null), null);
});
