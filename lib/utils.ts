import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPayRange(
  lowCents: number | null,
  highCents: number | null,
): string {
  if (lowCents == null && highCents == null) return "Not specified";
  const low = lowCents != null ? `$${(lowCents / 100).toLocaleString()}` : "";
  const high =
    highCents != null ? `$${(highCents / 100).toLocaleString()}` : "";
  if (low && high) return `${low} - ${high}`;
  if (low) return `${low}+`;
  return `Up to ${high}`;
}

export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function formatCompensation(job: {
  pay_range_low: number | null;
  pay_range_high: number | null;
  pay_unit?: string | null;
  commission_percent?: number | null;
  arrangement?: string;
}) {
  const units: Record<string, string> = {
    hour: "hour",
    year: "year",
    week: "week",
    month: "month",
  };
  const amount =
    job.pay_unit && (job.pay_range_low != null || job.pay_range_high != null)
      ? `${formatPayRange(job.pay_range_low, job.pay_range_high)} / ${units[job.pay_unit] ?? job.pay_unit}`
      : "";
  const commission =
    job.commission_percent != null
      ? `${job.commission_percent}% commission`
      : "";
  const result = [amount, commission].filter(Boolean).join(" + ");
  return result
    ? job.arrangement === "booth_rental"
      ? `Booth rent: ${result}`
      : result
    : "Discuss with business";
}
