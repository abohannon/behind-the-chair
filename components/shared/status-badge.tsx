import { Badge } from "@/components/ui/badge";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  draft: { label: "Draft", variant: "outline" },
  active: { label: "Active", variant: "default" },
  closed: { label: "Closed", variant: "secondary" },
  submitted: { label: "Submitted", variant: "outline" },
  reviewed: { label: "Reviewed", variant: "secondary" },
  interview: { label: "Interview", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  hired: { label: "Hired", variant: "default" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? {
    label: status,
    variant: "outline" as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
