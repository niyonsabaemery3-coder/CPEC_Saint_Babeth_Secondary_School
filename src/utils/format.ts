export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Parses a "YYYY-MM-DD" date string as a local date (avoids UTC day-shift). */
function parseIsoDate(isoDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate || "");
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

/** "2026-08-18" -> "August 18, 2026" — used on News cards. */
export function formatNewsDate(isoDate: string): string {
  const d = parseIsoDate(isoDate);
  if (!d) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** "2026-09-01" -> { month: "SEP", day: "1", year: "2026" } — used on Event cards. */
export function formatEventDateParts(isoDate: string): { month: string; day: string; year: string } {
  const d = parseIsoDate(isoDate);
  if (!d) return { month: "", day: "", year: "" };
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: String(d.getDate()),
    year: String(d.getFullYear()),
  };
}
