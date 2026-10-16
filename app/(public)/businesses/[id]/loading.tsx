export default function LoadingBusiness() {
  return (
    <div
      role="status"
      aria-label="Loading business"
      className="animate-pulse space-y-6"
    >
      <div className="h-64 rounded-2xl bg-secondary" />
      <div className="h-12 w-2/3 rounded bg-secondary" />
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="h-48 rounded-xl bg-secondary sm:col-span-2" />
        <div className="h-48 rounded-xl bg-secondary" />
      </div>
      <span className="sr-only">Loading business…</span>
    </div>
  );
}
