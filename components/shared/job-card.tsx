import { roleLabel } from "@/lib/constants/job-roles";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock } from "lucide-react";
import { formatCompensation, formatRelativeDate } from "@/lib/utils";
import { JOB_TYPES, EXPERIENCE_LEVELS } from "@/lib/constants/categories";

interface JobCardProps {
  job: {
    id: string;
    title: string;
    city: string;
    state: string;
    job_type: string;
    experience_level: string;
    category: string;
    role_category?: string | null;
    pay_range_low: number | null;
    pay_range_high: number | null;
    posted_at: string | null;
    pay_unit?: string | null;
    commission_percent?: number | null;
    arrangement?: string;
    employer_profiles: {
      salon_name: string;
      logo_url: string | null;
    } | null;
  };
}

export function JobCard({ job }: JobCardProps) {
  const jobTypeLabel =
    JOB_TYPES.find((t) => t.value === job.job_type)?.label ?? job.job_type;
  const expLabel =
    EXPERIENCE_LEVELS.find((l) => l.value === job.experience_level)?.label ??
    job.experience_level;

  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={job.employer_profiles?.logo_url ?? undefined} />
              <AvatarFallback>
                {job.employer_profiles?.salon_name?.[0] ?? "S"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base">{job.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {job.employer_profiles?.salon_name}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{job.category}</Badge>
            {roleLabel(job.role_category) && (
              <Badge variant="outline">{roleLabel(job.role_category)}</Badge>
            )}
            <Badge variant="outline">{jobTypeLabel}</Badge>
            <Badge variant="outline">{expLabel}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.city}, {job.state}
            </span>
            {(job.pay_range_low || job.pay_range_high) && (
              <span>{formatCompensation(job)}</span>
            )}
            {job.posted_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatRelativeDate(job.posted_at)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
