// Centralized field-level validation, used only where it materially helps:
//
//   - Public, unauthenticated write endpoints with many free-text fields
//     (application submissions, contact form) — these are the app's biggest
//     untrusted-input surface, and previously only checked 2-3 of ~15 fields.
//   - Account-creation code paths, which had drifted out of sync with each
//     other: self-registration validated email format, admin-created
//     accounts did not (see server/README.md audit notes).
//
// This is deliberately NOT a general validation framework and does not add
// a new dependency (no zod/joi) — the project has no other schema-validation
// library, and these are flat, non-nested request bodies where a ~90-line
// helper covers every case the routes actually need. Business-logic
// validation that requires a live DB lookup (e.g. "is this score within the
// subject's max_score", "is this student actually in this class") stays in
// the route handlers, where it already lives correctly (see markRoutes.js) —
// a schema validator can't do that kind of check anyway.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accepts spaces, dashes, parentheses and an optional leading "+" — permissive
// enough for the general "email or phone" contact form, strict enough to
// catch garbage ("N/A", free text).
const PHONE_RE = /^\+?[0-9()\-\s]{7,20}$/;
// Mirrors the frontend's validateRwandaPhone() (src/utils/validation.ts)
// exactly, so client and server agree on what counts as a valid guardian
// phone number for the admissions form — this is the number the public
// application-tracking lookup matches against later (see
// applicationRoutes.js /track/:id), so it matters that it's entered
// correctly, not just non-empty.
const RWANDA_PHONE_RE = /^(\+?250|0)7[2389]\d{7}$/;

function isEmail(value) {
  return typeof value === "string" && value.trim().length <= 254 && EMAIL_RE.test(value.trim());
}

function isPhone(value) {
  return typeof value === "string" && PHONE_RE.test(value.trim());
}

function isRwandaPhone(value) {
  return typeof value === "string" && RWANDA_PHONE_RE.test(value.trim().replace(/[\s-]/g, ""));
}

/**
 * Validates `body` against `schema`, an object of fieldName -> rule:
 *   { required, type: "string"|"email"|"phone"|"date"|"enum"|"number",
 *     min, max, values (for "enum"), label, trim (default true) }
 *
 * Returns { errors: string[], data: {...trimmed/normalized values} }.
 * Never throws — callers check `errors.length` and respond 400 with the
 * first message (or all of them) as they prefer.
 */
function validate(body, schema) {
  const errors = [];
  const data = {};
  const b = body || {};

  for (const [key, rule] of Object.entries(schema)) {
    const label = rule.label || key;
    let value = b[key];

    if (value === undefined || value === null || value === "") {
      if (rule.required) errors.push(`${label} is required.`);
      else data[key] = rule.default !== undefined ? rule.default : null;
      continue;
    }

    if (typeof value === "string" && rule.trim !== false) value = value.trim();

    switch (rule.type) {
      case "email":
        if (!isEmail(value)) errors.push(`${label} must be a valid email address.`);
        else value = String(value).trim().toLowerCase();
        break;
      case "phone":
        if (!isPhone(value)) errors.push(`${label} must be a valid phone number.`);
        break;
      case "rwandaPhone":
        if (!isRwandaPhone(value)) {
          errors.push(`${label} must be a valid Rwandan phone number (e.g. 078xxxxxxx or +2507xxxxxxxx).`);
        }
        break;
      case "contact": // email OR phone — used by the general contact form
        if (!isEmail(value) && !isPhone(value)) {
          errors.push(`${label} must be a valid email address or phone number.`);
        }
        break;
      case "enum":
        if (!rule.values.includes(value)) errors.push(`${label} is not a recognized value.`);
        break;
      case "date":
        if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
          errors.push(`${label} must be a valid date.`);
        }
        break;
      case "number": {
        const n = Number(value);
        if (!Number.isFinite(n)) errors.push(`${label} must be a number.`);
        else value = n;
        break;
      }
      default:
        if (typeof value !== "string") errors.push(`${label} must be text.`);
    }

    if (typeof value === "string") {
      if (rule.min && value.length < rule.min) {
        errors.push(`${label} must be at least ${rule.min} characters.`);
      }
      if (rule.max && value.length > rule.max) {
        errors.push(`${label} must be at most ${rule.max} characters.`);
      }
    }

    data[key] = value;
  }

  return { errors, data };
}

module.exports = { validate, isEmail, isPhone, isRwandaPhone, EMAIL_RE, PHONE_RE, RWANDA_PHONE_RE };
