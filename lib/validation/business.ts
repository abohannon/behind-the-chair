import { z } from "zod";
export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const day = z.discriminatedUnion("state", [
  z.object({ state: z.literal("closed") }).strict(),
  z
    .object({ state: z.literal("open"), opens: time, closes: time })
    .strict()
    .refine(
      (v) => v.opens < v.closes,
      "Opening time must be before closing time",
    ),
]);
export const hoursSchema = z
  .object({
    Monday: day.optional(),
    Tuesday: day.optional(),
    Wednesday: day.optional(),
    Thursday: day.optional(),
    Friday: day.optional(),
    Saturday: day.optional(),
    Sunday: day.optional(),
  })
  .strict();
export type BusinessHours = z.infer<typeof hoursSchema>;
export function hoursFromForm(form: FormData): BusinessHours {
  const hours: Record<string, unknown> = {};
  for (const day of WEEKDAYS) {
    const state = String(form.get(`${day}-state`) ?? "unspecified");
    if (state === "unspecified") continue;
    hours[day] =
      state === "closed"
        ? { state }
        : {
            state,
            opens: String(form.get(`${day}-opens`) ?? ""),
            closes: String(form.get(`${day}-closes`) ?? ""),
          };
  }
  return hoursSchema.parse(hours);
}
export function formatBusinessTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
