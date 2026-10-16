"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16">
      <h1 className="text-2xl font-semibold">We couldn’t load this page.</h1>
      <p className="text-muted-foreground">
        Please try again. If this keeps happening, contact the person who
        invited you to the alpha.
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-primary px-5 py-3 text-primary-foreground"
      >
        Try again
      </button>
    </div>
  );
}
