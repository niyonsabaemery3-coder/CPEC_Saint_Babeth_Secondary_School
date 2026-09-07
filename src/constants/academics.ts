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
  group: "Ordinary Level" | "Software Development (SOD)" | "Multimedia Technology (MRT)" | "Multimedia Production (MLT)" | "Other";
}

export const SCHOOL_CLASSES: AcademicClass[] = [
  { value: "S1", label: "S1", group: "Ordinary Level" },
  { value: "S2", label: "S2", group: "Ordinary Level" },
  { value: "S3", label: "S3", group: "Ordinary Level" },

  { value: "L3SOD", label: "L3 SOD", group: "Software Development (SOD)" },
  { value: "L4SOD", label: "L4 SOD", group: "Software Development (SOD)" },
  { value: "L5SOD", label: "L5 SOD", group: "Software Development (SOD)" },

  { value: "L3MRT", label: "L3 MRT", group: "Multimedia Technology (MRT)" },
  { value: "L4MRT", label: "L4 MRT", group: "Multimedia Technology (MRT)" },
  { value: "L5MRT", label: "L5 MRT", group: "Multimedia Technology (MRT)" },

  { value: "OTHER", label: "Other", group: "Other" },
  { value: "SC_SOD", label: "Short Course – Software Development", group: "Other" },
  { value: "SC_MLT", label: "Short Course – Multimedia Production", group: "Other" },
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
