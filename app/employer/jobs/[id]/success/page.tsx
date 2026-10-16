import { redirect } from "next/navigation";
export default async function LegacySuccess({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  redirect(`/employer/jobs/${(await params).id}/preview`);
}
