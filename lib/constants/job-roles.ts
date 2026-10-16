export const JOB_ROLES = [
  { value: "receptionist", label: "Receptionist", industries: [] },
  { value: "salon_manager", label: "Salon Manager", industries: [] },
  {
    value: "stylist_assistant",
    label: "Stylist Assistant",
    industries: ["Hair", "Barbering"],
  },
  { value: "cut_stylist", label: "Cut Stylist", industries: ["Hair"] },
  { value: "color_stylist", label: "Color Stylist", industries: ["Hair"] },
  {
    value: "cut_color_stylist",
    label: "Cut/Color Stylist",
    industries: ["Hair"],
  },
  { value: "nail_technician", label: "Nail Technician", industries: ["Nails"] },
  {
    value: "esthetician",
    label: "Esthetician / Skin Specialist",
    industries: ["Skin & Facials"],
  },
  {
    value: "lash_brow_specialist",
    label: "Lash / Brow Specialist",
    industries: ["Lashes & Brows"],
  },
  { value: "barber", label: "Barber", industries: ["Barbering"] },
  {
    value: "massage_body",
    label: "Massage / Body Professional",
    industries: ["Massage & Body"],
  },
  { value: "makeup_artist", label: "Makeup Artist", industries: ["Makeup"] },
  { value: "other", label: "Other", industries: [] },
] as const;
export function roleMatchesIndustry(value: string, industry: string) {
  const role = JOB_ROLES.find((r) => r.value === value);
  return (
    !!role &&
    (!industry ||
      role.industries.length === 0 ||
      (role.industries as readonly string[]).includes(industry))
  );
}
export function roleLabel(value: string | null | undefined) {
  return JOB_ROLES.find((r) => r.value === value)?.label ?? null;
}
