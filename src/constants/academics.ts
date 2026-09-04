import type { SchoolClass } from "../types";

/**
 * Every class/track offered at CPEC Saint Babeth TSS. This is the ONE place
 * that lists them — every dropdown, filter, and validator in the app should
 * import from here instead of hardcoding "S1"/"S2"/"S3" etc., so adding or
 * renaming a class only ever needs to happen in this one file.
 */
export interface AcademicClass {
  value: SchoolClass;
  label: string;
  group: "Ordinary Level" | "Software Development (SOD)" | "Multimedia Technology (MLT)";
}

export const SCHOOL_CLASSES: AcademicClass[] = [
  { value: "S1", label: "Senior 1 (S1)", group: "Ordinary Level" },
  { value: "S2", label: "Senior 2 (S2)", group: "Ordinary Level" },
  { value: "S3", label: "Senior 3 (S3)", group: "Ordinary Level" },

  { value: "L3SOD", label: "Level 3 — Software Development (L3 SOD)", group: "Software Development (SOD)" },
  { value: "L4SOD", label: "Level 4 — Software Development (L4 SOD)", group: "Software Development (SOD)" },
  { value: "L5SOD", label: "Level 5 — Software Development (L5 SOD)", group: "Software Development (SOD)" },
  { value: "SC_SOD", label: "Short Course — Software Development", group: "Software Development (SOD)" },

  { value: "L3MLT", label: "Level 3 — Multimedia Technology (L3 MLT)", group: "Multimedia Technology (MLT)" },
  { value: "L4MLT", label: "Level 4 — Multimedia Technology (L4 MLT)", group: "Multimedia Technology (MLT)" },
  { value: "L5MLT", label: "Level 5 — Multimedia Technology (L5 MLT)", group: "Multimedia Technology (MLT)" },
  { value: "SC_MLT", label: "Short Course — Multimedia Technology", group: "Multimedia Technology (MLT)" },
];

export const SCHOOL_CLASS_VALUES: SchoolClass[] = SCHOOL_CLASSES.map((c) => c.value);

export function classLabel(value: string): string {
  return SCHOOL_CLASSES.find((c) => c.value === value)?.label ?? value;
}

/** Renders the full set of `<option>`s, grouped by department — drop straight into any `<select>`. */
export function classOptionGroups(): { group: string; options: AcademicClass[] }[] {
  const groups: { group: string; options: AcademicClass[] }[] = [];
  for (const cls of SCHOOL_CLASSES) {
    let bucket = groups.find((g) => g.group === cls.group);
    if (!bucket) {
      bucket = { group: cls.group, options: [] };
      groups.push(bucket);
    }
    bucket.options.push(cls);
  }
  return groups;
}
