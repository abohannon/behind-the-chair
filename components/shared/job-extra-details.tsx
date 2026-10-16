import { roleLabel } from "@/lib/constants/job-roles";
export function JobExtraDetails({
  job,
}: {
  job: {
    role_category?: string | null;
    schedule?: string;
    schedule_details?: string | null;
    benefits?: string | null;
  };
}) {
  const role = roleLabel(job.role_category);
  const schedule =
    job.schedule === "full_time"
      ? "Full-time"
      : job.schedule === "part_time"
        ? "Part-time"
        : "Flexible / discuss with business";
  return (
    <div className="space-y-5">
      {role && (
        <div>
          <h3 className="font-medium">Role</h3>
          <p className="mt-1 text-sm text-muted-foreground">{role}</p>
        </div>
      )}
      <div>
        <h3 className="font-medium">Days and hours</h3>
        <p className="mt-1 text-sm text-muted-foreground">{schedule}</p>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm">
          {job.schedule_details || "Discuss with business"}
        </p>
      </div>
      {job.benefits && (
        <div>
          <h3 className="font-medium">Benefits and perks</h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm">
            {job.benefits}
          </p>
        </div>
      )}
    </div>
  );
}
