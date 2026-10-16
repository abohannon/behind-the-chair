import { z } from "zod";
export const contactSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(200),
  email: z.email("Enter a valid contact email").max(254),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine(
      (v) =>
        /^[+\d\s().-]+$/.test(v) &&
        v.replace(/\D/g, "").length >= 7 &&
        v.replace(/\D/g, "").length <= 15,
      "Enter a valid phone number",
    ),
});
export const websiteSchema = z.union([
  z.literal(""),
  z.url().refine((v) => /^https?:\/\//i.test(v), "Use an http or https URL"),
]);
export function instagramHandle(value: string) {
  const handle = value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");
  if (handle && !/^[a-zA-Z0-9._]{1,30}$/.test(handle))
    throw new Error("Enter an Instagram handle or profile URL");
  return handle || null;
}
export function validateResume(file: unknown): string | null {
  if (!(file instanceof File) || !file.size) return "A PDF resume is required";
  if (file.type !== "application/pdf") return "Resume must be a PDF";
  if (file.size > 10 * 1024 * 1024) return "Resume must be 10 MB or smaller";
  return null;
}
export const ratingSchema = z.number().int().min(1).max(5).nullable();
