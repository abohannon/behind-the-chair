import { requireUser } from "@/lib/auth/require-user";
export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("employer");
  return <>{children}</>;
}
