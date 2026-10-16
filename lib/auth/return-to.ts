/** Only same-app destinations; never accept protocol-relative URLs or auth loops. */
export function safeReturnTo(value: unknown, fallback = "/jobs"): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return fallback;
  try {
    const url = new URL(value, "https://local.invalid");
    if (
      url.origin !== "https://local.invalid" ||
      !/^\/(jobs|seeker|employer)(\/|$)/.test(url.pathname)
    )
      return fallback;
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}
