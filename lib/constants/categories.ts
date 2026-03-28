export const CATEGORIES = [
  "Hair",
  "Nails",
  "Skin & Facials",
  "Lashes & Brows",
  "Barbering",
  "Massage & Body",
  "Makeup",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const SPECIALTIES: Record<Category, string[]> = {
  Hair: [
    "Stylist",
    "Colorist",
    "Balayage Specialist",
    "Extensions",
    "Braids & Locs",
    "Hair Replacement",
    "Bridal/Event",
  ],
  Nails: ["Nail Technician", "Nail Artist", "Gel/Acrylic Specialist"],
  "Skin & Facials": [
    "Esthetician",
    "Laser Technician",
    "Chemical Peels",
    "Microneedling",
  ],
  "Lashes & Brows": [
    "Lash Technician",
    "Lash Extensions",
    "Microblading",
    "Brow Shaping/Threading",
  ],
  Barbering: ["Barber", "Fade Specialist"],
  "Massage & Body": ["Massage Therapist", "Body Treatments"],
  Makeup: ["Makeup Artist", "Permanent Makeup/PMU"],
};

export const ALL_SPECIALTIES = Object.values(SPECIALTIES).flat();

export function getSpecialtiesForCategory(category: Category): string[] {
  return SPECIALTIES[category] ?? [];
}

export const JOB_TYPES = [
  { value: "booth_rental", label: "Booth Rental" },
  { value: "commission", label: "Commission" },
  { value: "salary", label: "Salary" },
  { value: "hourly", label: "Hourly" },
] as const;

export type JobType = (typeof JOB_TYPES)[number]["value"];

export const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior Level" },
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]["value"];

export const APPLICATION_STATUSES = [
  { value: "submitted", label: "Submitted" },
  { value: "reviewed", label: "Reviewed" },
  { value: "interview", label: "Interview" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]["value"];
