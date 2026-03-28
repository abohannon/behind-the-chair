import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPayRange(lowCents: number | null, highCents: number | null): string {
  if (!lowCents && !highCents) return "Not specified";
  const low = lowCents ? `$${(lowCents / 100).toLocaleString()}` : "";
  const high = highCents ? `$${(highCents / 100).toLocaleString()}` : "";
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
