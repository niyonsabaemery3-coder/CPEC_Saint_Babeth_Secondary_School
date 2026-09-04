import { classOptionGroups } from "../../constants/academics";

interface ClassOptionsProps {
  /** Include an "All Classes" option at the top (for filter dropdowns). */
  includeAll?: boolean;
  allLabel?: string;
}

/**
 * Just the <option>/<optgroup> markup for a class/track <select> — drop this
 * inside any existing <select> element so every dropdown in the app stays in
 * sync with SCHOOL_CLASSES in one place.
 */
export default function ClassOptions({ includeAll, allLabel = "All Classes" }: ClassOptionsProps) {
  return (
    <>
      {includeAll && <option value="all">{allLabel}</option>}
      {classOptionGroups().map((g) => (
        <optgroup key={g.group} label={g.group}>
          {g.options.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
