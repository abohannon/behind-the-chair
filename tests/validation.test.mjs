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
