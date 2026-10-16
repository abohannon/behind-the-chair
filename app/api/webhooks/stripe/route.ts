/** Legacy payment events must never publish or modify free alpha jobs. */
export async function POST() {
  return Response.json(
    { error: "Payments are disabled during the private alpha." },
    { status: 410 },
  );
}
