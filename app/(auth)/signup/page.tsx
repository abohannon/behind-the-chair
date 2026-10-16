import Link from "next/link";
export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16">
      <p className="text-sm font-medium text-primary">
        PRIVATE ALPHA · PORTLAND
      </p>
      <h1 className="text-3xl font-semibold">Your next chapter starts here.</h1>
      <p className="text-muted-foreground">
        Behind the Chair is currently open to invited businesses and beauty
        professionals. Ask the person who shared this app with you for an
        invitation.
      </p>
      <p>
        Already invited? Follow the link in your email to set your password.
      </p>
      <Link href="/login" className="underline">
        Sign in
      </Link>
    </div>
  );
}
