/**
 * Small, dependency-free validation helpers shared by every form in the app.
 * Each validator returns an error string (shown to the user) or "" when the
 * value is valid, so callers can do: `const err = validateEmail(email); if (err) ...`
 */

export function required(value: string, label = "This field"): string {
  return value.trim() ? "" : `${label} is required.`;
}

export function validateEmail(value: string): string {
  const v = value.trim();
  if (!v) return "Email is required.";
  // Deliberately simple/permissive — good enough to catch typos without
  // rejecting valid addresses (no need to fully match RFC 5322 here).
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
  return "";
}

export function validatePassword(value: string, minLength = 8): string {
  if (!value) return "Password is required.";
  if (value.length < minLength) return `Password must be at least ${minLength} characters.`;
  return "";
}

export function validateConfirmPassword(password: string, confirm: string): string {
  if (!confirm) return "Please confirm your password.";
  if (password !== confirm) return "Passwords do not match.";
  return "";
}

// Accepts Rwandan mobile numbers in local (07XXXXXXXX) or international
// (+2507XXXXXXXX / 2507XXXXXXXX) form, with optional spaces/dashes.
export function validateRwandaPhone(value: string, label = "Phone number"): string {
  const v = value.trim();
  if (!v) return `${label} is required.`;
  const digits = v.replace(/[\s-]/g, "");
  if (!/^(\+?250|0)7[2389]\d{7}$/.test(digits)) {
    return `Enter a valid Rwandan phone number (e.g. 078xxxxxxx or +2507xxxxxxxx).`;
  }
  return "";
}

// Same as above but the value is allowed to be empty (for optional secondary numbers).
export function validateOptionalRwandaPhone(value: string, label = "Phone number"): string {
  if (!value.trim()) return "";
  return validateRwandaPhone(value, label);
}

export function validateMinLength(value: string, min: number, label = "This field"): string {
  if (value.trim().length < min) return `${label} must be at least ${min} characters.`;
  return "";
}

export function validateMaxFileSizeMB(file: { size: number } | null, maxMB: number, label = "File"): string {
  if (!file) return "";
  if (file.size > maxMB * 1024 * 1024) return `${label} must be smaller than ${maxMB}MB.`;
  return "";
}

/** Returns true if every value in the errors record is empty. */
export function isValid(errors: Record<string, string>): boolean {
  return Object.values(errors).every((e) => !e);
}
