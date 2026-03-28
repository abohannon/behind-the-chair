"use client";

import { useState } from "react";
import { updateApplicationStatus } from "@/actions/applications";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPLICATION_STATUSES } from "@/lib/constants/categories";
import { toast } from "sonner";

export function StatusSelect({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleChange(newStatus: string) {
    setLoading(true);
    const result = await updateApplicationStatus(applicationId, newStatus);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      setStatus(newStatus);
      toast.success("Status updated");
    }
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={loading}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {APPLICATION_STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
