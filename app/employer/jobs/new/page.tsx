import { requireUser } from "@/lib/auth/require-user";
import { JobForm } from "@/components/forms/job-form";
export default async function NewJob() {
  await requireUser("employer");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-semibold">Find your next team member.</h1>
      <JobForm />
    </div>
  );
}
