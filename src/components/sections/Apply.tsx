import { useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import type { StudentApplication } from "../../types";
import FieldError from "../common/FieldError";
import { required, validateMinLength, validateRwandaPhone, validateOptionalRwandaPhone, isValid } from "../../utils/validation";
import { useFadeUp } from "../../hooks/useScrollAnimations";
import { Link } from "react-router-dom";

// ─── Admission type definitions ──────────────────────────────────────────────

const ADMISSION_TYPES = [
  { value: "new_student",  label: "New Student" },
  { value: "transfer",     label: "Transfer / Continuing Student" },
  { value: "short_course", label: "Short Course" },
] as const;
type AdmissionType = typeof ADMISSION_TYPES[number]["value"] | "";

// Programs available per admission type
const NEW_STUDENT_LEVELS = [
  { value: "S1",    label: "S1 — Senior 1 (Ordinary Level)" },
  { value: "L3SOD", label: "L3 Software Development (SOD)" },
  { value: "L3MLT", label: "L3 Multimedia Production (MLT)" },
];

const TRANSFER_LEVELS = [
  { value: "S2",    label: "S2 — Senior 2 (Ordinary Level)" },
  { value: "S3",    label: "S3 — Senior 3 (Ordinary Level)" },
  { value: "L4SOD", label: "L4 Software Development (SOD)" },
  { value: "L5SOD", label: "L5 Software Development (SOD)" },
  { value: "L4MLT", label: "L4 Multimedia Production (MLT)" },
  { value: "L5MLT", label: "L5 Multimedia Production (MLT)" },
];

const SHORT_COURSES = [
  { value: "SC_SOD", label: "Short Course – Software Development" },
  { value: "SC_MLT", label: "Short Course – Multimedia Production" },
];

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  // Step 1
  name: string;
  dob: string;
  gender: string;
  // Step 2
  admissionType: AdmissionType;
  trackyear: string;
  indexNumber: string;
  // Step 3 (conditional — school info)
  prevschool: string;
  currentLevel: string;
  district: string;
  sector: string;
  // Step 4
  parent: string;
  email: string;
  phone1: string;
  phone2: string;
}

const EMPTY_FORM: FormState = {
  name: "", dob: "", gender: "",
  admissionType: "", trackyear: "", indexNumber: "",
  prevschool: "", currentLevel: "", district: "", sector: "",
  parent: "", email: "", phone1: "", phone2: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Apply() {
  const { addApplication } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [reportFile, setReportFile] = useState<{ name: string; data: string } | null>(null);
  const [toast, setToast] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  const update = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: "" }));
    // Reset trackyear when admission type changes
    if (key === "admissionType") setForm((f) => ({ ...f, admissionType: value as AdmissionType, trackyear: "", indexNumber: "" }));
  };

  const handleReportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setReportFile({ name: file.name, data: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  // Whether to show school-info step (step 3):
  // New students need previous school + location.
  // Transfer students need current school + level + location.
  // Short course: no school step — skip it.
  const showSchoolStep = form.admissionType !== "short_course";

  // Determine actual wizard step labels and count dynamically
  // (short course skips School step)
  const effectiveLabels = form.admissionType === "short_course"
    ? ["Student", "Admission", "Parent", "Review"]
    : ["Student", "Admission", "School", "Parent", "Review"];
  const effectiveTotal = effectiveLabels.length;

  // Map real step number to display step (short course: skip step 3 in display)
  const displayStep = form.admissionType === "short_course" && step >= 3 ? step - 1 : step;

  const validateStep = (s: number): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (s === 1) {
      e.name = validateMinLength(form.name, 3, "Student full name");
      e.dob  = required(form.dob, "Date of birth");
      e.gender = required(form.gender, "Gender");
    } else if (s === 2) {
      e.admissionType = required(form.admissionType, "Admission type");
      e.trackyear = required(form.trackyear, "Requested level / program");
    } else if (s === 3 && showSchoolStep) {
      e.prevschool = required(form.prevschool, form.admissionType === "transfer" ? "Current school" : "Previous school");
      if (form.admissionType === "transfer") {
        e.currentLevel = required(form.currentLevel, "Current level");
      }
      e.district = required(form.district, "District");
      e.sector   = required(form.sector, "Sector");
    } else if ((s === 4 && showSchoolStep) || (s === 3 && !showSchoolStep)) {
      e.parent = validateMinLength(form.parent, 3, "Parent / guardian name");
      e.phone1 = validateRwandaPhone(form.phone1, "Parent / guardian phone (1)");
      e.phone2 = validateOptionalRwandaPhone(form.phone2, "Parent / guardian phone (2)");
    }
    setErrors((prev) => ({ ...prev, ...e }));
    return isValid(e as Record<string, string>);
  };

  const wizNext = (from: number) => { if (validateStep(from)) setStep(from + 1); };
  const wizBack = (from: number) => setStep(from - 1);

  const submitApplication = async () => {
    const app: StudentApplication = {
      id: Date.now(),
      name: form.name,
      dob: form.dob,
      gender: form.gender,
      admissionType: form.admissionType,
      trackyear: form.trackyear,
      indexNumber: form.indexNumber,
      currentSchool: form.prevschool,
      currentLevel: form.currentLevel,
      report: reportFile?.name ?? null,
      reportData: reportFile?.data ?? null,
      prevschool: form.prevschool,
      district: form.district,
      sector: form.sector,
      parent: form.parent,
      email: form.email,
      phone1: form.phone1,
      phone2: form.phone2,
      status: "pending",
      feedback: "",
      feedbackFile: null,
      feedbackFileName: null,
      createdAt: "",
      updatedAt: "",
    };
    try {
      const created = await addApplication(app);
      setSubmittedId(created.id);
    } catch {
      return;
    }
    setForm(EMPTY_FORM);
    setErrors({});
    setReportFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStep(1);
    setToast(true);
    setTimeout(() => setToast(false), 8000);
  };

  // Admission type label for display
  const admTypeLabel = ADMISSION_TYPES.find((t) => t.value === form.admissionType)?.label ?? "—";

  // Level label for display
  const allLevels = [...NEW_STUDENT_LEVELS, ...TRANSFER_LEVELS, ...SHORT_COURSES];
  const levelLabel = (allLevels.find((l) => l.value === form.trackyear)?.label ?? form.trackyear) || "—";

  // Review rows
  const reviewRows: [string, string][] = [
    ["Student full name", form.name || "—"],
    ["Date of birth", form.dob || "—"],
    ["Gender", form.gender || "—"],
    ["Admission type", admTypeLabel],
    ["Requested level / program", levelLabel],
    ...(form.indexNumber ? [["Index number", form.indexNumber] as [string, string]] : []),
    ...(form.admissionType !== "short_course" ? [["Previous / current school", form.prevschool || "—"] as [string, string]] : []),
    ...(form.admissionType === "transfer" ? [["Current level", form.currentLevel || "—"] as [string, string]] : []),
    ...(form.admissionType !== "short_course" ? [["District", form.district || "—"] as [string, string], ["Sector", form.sector || "—"] as [string, string]] : []),
    ["Previous school report", reportFile ? reportFile.name : "Not uploaded"],
    ["Parent / guardian name", form.parent || "—"],
    ["Parent / guardian phone (1)", form.phone1 || "—"],
    ["Parent / guardian phone (2)", form.phone2 || "Not provided"],
    ...(form.email ? [["Parent / guardian email", form.email] as [string, string]] : []),
  ];

  // Determine the actual last real step
  const lastStep = showSchoolStep ? 5 : 4;

  return (
    <section id="apply" className="card" ref={ref}>
      <div className="section-head">
        <div className="eyebrow"><span className="bar" /> Admissions</div>
        <h2>Request Admission</h2>
        <p>
          Interested in joining CPEC Saint Babeth TSS? Submit an admission request online.
          All requests are reviewed by the school and are subject to eligibility, available places, and the applicable admission process.
        </p>
      </div>

      <div className="apply-wrap">
        <div className="apply-note">
          <h4>Before you begin</h4>
          <ul>
            <li><span className="dot" /> Student's full name, date of birth &amp; gender</li>
            <li><span className="dot" /> Admission type (New Student, Transfer, or Short Course)</li>
            <li><span className="dot" /> A photo/scan of the previous school report (where applicable)</li>
            <li><span className="dot" /> Parent or guardian name and phone number(s)</li>
            <li><span className="dot" /> Home address (District &amp; Sector) where applicable</li>
            <li><span className="dot" /> Index number if available (optional)</li>
          </ul>
          <p style={{ fontSize: "12.5px", color: "var(--ink-soft)", marginTop: "16px" }}>
            Submitting this form is an admission request only. It does not guarantee enrolment.
            The school will review your request and contact you with the outcome.
            Original documents should be brought in person once your request is approved.
          </p>
          <Link to="/track-application" className="apply-track-btn">
            <i className="fa-solid fa-magnifying-glass" /> Track your request
          </Link>
        </div>

        <div className="form-card">
          <h3>Admission Request Form</h3>
          <p>Complete each step carefully. You will review all information before submitting.</p>

          {/* Wizard progress */}
          <div className="wizard-steps">
            {effectiveLabels.map((label, idx) => {
              const i = idx + 1;
              const state = i < displayStep ? "done" : i === displayStep ? "current" : "";
              return (
                <div className="w-step-wrap" key={label} style={{ display: "contents" }}>
                  <div className={`w-step ${state}`}>
                    <div>
                      <div className="w-dot">{i < displayStep ? <i className="fa-solid fa-check" /> : i}</div>
                      <span className="w-step-label">{label}</span>
                    </div>
                  </div>
                  {i < effectiveTotal && <div className="w-line" />}
                </div>
              );
            })}
          </div>

          <form onSubmit={(e) => e.preventDefault()}>

            {/* ── STEP 1: Student details ─────────────────────────────── */}
            <div className={`step-panel ${step === 1 ? "active" : ""}`}>
              <div className="field-grid">
                <div className="full ffield">
                  <input type="text" placeholder=" " required value={form.name} onChange={(e) => update("name", e.target.value)} className={errors.name ? "field-invalid" : ""} />
                  <label>Student full name</label>
                </div>
                <FieldError message={errors.name} />
                <div className="ffield always-float">
                  <input type="date" placeholder=" " required value={form.dob} onChange={(e) => update("dob", e.target.value)} className={errors.dob ? "field-invalid" : ""} />
                  <label>Date of birth</label>
                </div>
                <FieldError message={errors.dob} />
                <div>
                  <select required value={form.gender} onChange={(e) => update("gender", e.target.value)} className={errors.gender ? "field-invalid" : ""}>
                    <option value="" disabled>Gender</option>
                    <option>Female</option>
                    <option>Male</option>
                  </select>
                </div>
                <FieldError message={errors.gender} />
              </div>
              <div className="wizard-nav">
                <span />
                <button type="button" className="btn-primary" onClick={() => wizNext(1)}>Next <i className="fa-solid fa-arrow-right" /></button>
              </div>
            </div>

            {/* ── STEP 2: Admission type + level ─────────────────────── */}
            <div className={`step-panel ${step === 2 ? "active" : ""}`}>
              <div className="field-grid">
                {/* Admission type selector */}
                <div className="full">
                  <select required value={form.admissionType} onChange={(e) => update("admissionType", e.target.value)} className={errors.admissionType ? "field-invalid" : ""}>
                    <option value="" disabled>Select admission type</option>
                    {ADMISSION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <FieldError message={errors.admissionType} />

                {/* Level / program — shown only after type is selected */}
                {form.admissionType && (
                  <>
                    <div className="full">
                      <select required value={form.trackyear} onChange={(e) => update("trackyear", e.target.value)} className={errors.trackyear ? "field-invalid" : ""}>
                        <option value="" disabled>
                          {form.admissionType === "new_student" ? "Select level / program" :
                           form.admissionType === "transfer"    ? "Select requested level / program" :
                                                                  "Select short course"}
                        </option>
                        {(form.admissionType === "new_student"  ? NEW_STUDENT_LEVELS :
                          form.admissionType === "transfer"     ? TRANSFER_LEVELS :
                                                                  SHORT_COURSES
                        ).map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                    <FieldError message={errors.trackyear} />
                  </>
                )}

                {/* Transfer notice */}
                {form.admissionType === "transfer" && (
                  <div className="full review-note" style={{ marginTop: "8px" }}>
                    <i className="fa-solid fa-circle-info" /> Transfer requests are subject to eligibility, available places, and the school's official admission process.
                  </div>
                )}

                {/* Index number — relevant for transfer and new students with results */}
                {(form.admissionType === "transfer" || form.admissionType === "new_student") && (
                  <div className="full ffield">
                    <input type="text" placeholder=" " value={form.indexNumber} onChange={(e) => update("indexNumber", e.target.value)} />
                    <label>Index number (if applicable)</label>
                  </div>
                )}
                {(form.admissionType === "transfer" || form.admissionType === "new_student") && (
                  <div className="full" style={{ fontSize: "12px", color: "var(--ink-soft)", marginTop: "-8px" }}>
                    Enter your official examination index number if you have one.
                  </div>
                )}

                {/* Report upload — for new and transfer students */}
                {form.admissionType !== "short_course" && (
                  <div className="full">
                    <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={handleReportUpload} id="ap_report" />
                    <div className={`file-tile ${reportFile ? "has-file" : ""}`} onClick={() => fileInputRef.current?.click()}>
                      <i className={reportFile ? "fa-solid fa-circle-check" : "fa-solid fa-cloud-arrow-up"} />
                      <span>{reportFile ? reportFile.name : "Click to upload previous school report (optional)"}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="wizard-nav">
                <button type="button" className="btn-wiz-back" onClick={() => wizBack(2)}><i className="fa-solid fa-arrow-left" /> Back</button>
                <button type="button" className="btn-primary" onClick={() => wizNext(2)}>Next <i className="fa-solid fa-arrow-right" /></button>
              </div>
            </div>

            {/* ── STEP 3: School / location (skipped for short course) ─ */}
            <div className={`step-panel ${step === 3 && showSchoolStep ? "active" : ""}`}>
              <div className="field-grid">
                <div className="full ffield">
                  <input type="text" placeholder=" " required value={form.prevschool} onChange={(e) => update("prevschool", e.target.value)} className={errors.prevschool ? "field-invalid" : ""} />
                  <label>{form.admissionType === "transfer" ? "Current school" : "Previous school"}</label>
                </div>
                <FieldError message={errors.prevschool} />

                {form.admissionType === "transfer" && (
                  <>
                    <div className="full">
                      <select required value={form.currentLevel} onChange={(e) => update("currentLevel", e.target.value)} className={errors.currentLevel ? "field-invalid" : ""}>
                        <option value="" disabled>Current level at your school</option>
                        <option value="S1">S1</option>
                        <option value="S2">S2</option>
                        <option value="S3">S3</option>
                        <option value="L3SOD">L3 SOD</option>
                        <option value="L4SOD">L4 SOD</option>
                        <option value="L3MLT">L3 MLT</option>
                        <option value="L4MLT">L4 MLT</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <FieldError message={errors.currentLevel} />
                  </>
                )}

                <div className="ffield">
                  <input type="text" placeholder=" " required value={form.district} onChange={(e) => update("district", e.target.value)} className={errors.district ? "field-invalid" : ""} />
                  <label>District</label>
                </div>
                <FieldError message={errors.district} />
                <div className="ffield">
                  <input type="text" placeholder=" " required value={form.sector} onChange={(e) => update("sector", e.target.value)} className={errors.sector ? "field-invalid" : ""} />
                  <label>Sector</label>
                </div>
                <FieldError message={errors.sector} />
              </div>
              <div className="wizard-nav">
                <button type="button" className="btn-wiz-back" onClick={() => wizBack(3)}><i className="fa-solid fa-arrow-left" /> Back</button>
                <button type="button" className="btn-primary" onClick={() => wizNext(3)}>Next <i className="fa-solid fa-arrow-right" /></button>
              </div>
            </div>

            {/* ── STEP 4: Parent / guardian ───────────────────────────── */}
            {/* For short course this is step 3 in real step count, step 3 display */}
            <div className={`step-panel ${(step === 4 && showSchoolStep) || (step === 3 && !showSchoolStep) ? "active" : ""}`}>
              <div className="field-grid">
                <div className="ffield">
                  <input type="text" placeholder=" " required value={form.parent} onChange={(e) => update("parent", e.target.value)} className={errors.parent ? "field-invalid" : ""} />
                  <label>Parent / guardian name</label>
                </div>
                <FieldError message={errors.parent} />
                <div className="full ffield">
                  <input type="email" placeholder=" " value={form.email} onChange={(e) => update("email", e.target.value)} />
                  <label>Parent / guardian email (optional)</label>
                </div>
                <div className="ffield">
                  <input type="tel" placeholder=" " required value={form.phone1} onChange={(e) => update("phone1", e.target.value)} className={errors.phone1 ? "field-invalid" : ""} />
                  <label>Parent / guardian phone (1)</label>
                </div>
                <FieldError message={errors.phone1} />
                <div className="full ffield">
                  <input type="tel" placeholder=" " value={form.phone2} onChange={(e) => update("phone2", e.target.value)} className={errors.phone2 ? "field-invalid" : ""} />
                  <label>Parent / guardian phone (2) (optional)</label>
                </div>
                <FieldError message={errors.phone2} />
              </div>
              <div className="wizard-nav">
                <button type="button" className="btn-wiz-back" onClick={() => wizBack(showSchoolStep ? 4 : 3)}><i className="fa-solid fa-arrow-left" /> Back</button>
                <button type="button" className="btn-primary" onClick={() => wizNext(showSchoolStep ? 4 : 3)}>Review <i className="fa-solid fa-arrow-right" /></button>
              </div>
            </div>

            {/* ── STEP 5 (or 4 for short course): Review & submit ──────── */}
            <div className={`step-panel ${step === lastStep ? "active" : ""}`}>
              <div className="review-note">
                <i className="fa-solid fa-circle-info" /> Please check everything carefully. If anything is incorrect, click "Back" to fix it before submitting.
              </div>
              <div className="review-grid">
                {reviewRows.map(([label, value]) => (
                  <div className="r-item" key={label}>
                    <div className="r-label">{label}</div>
                    <div className="r-value">{value}</div>
                  </div>
                ))}
              </div>
              <div className="review-note" style={{ marginTop: "12px", background: "rgba(230,169,53,.08)", borderColor: "rgba(230,169,53,.3)", color: "var(--ink-soft)", fontSize: "12.5px" }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ color: "var(--gold-dark)" }} /> Submitting this form is an admission request only. It does not guarantee enrolment. The school will review your request and contact you.
              </div>
              <div className="wizard-nav">
                <button type="button" className="btn-wiz-back" onClick={() => wizBack(lastStep)}><i className="fa-solid fa-arrow-left" /> Back</button>
                <button type="button" className="btn-primary" onClick={submitApplication}><i className="fa-solid fa-paper-plane" /> Submit Request</button>
              </div>
            </div>

            {/* Success toast */}
            <div className={`toast-msg ${toast ? "show" : ""}`}>
              <i className="fa-solid fa-circle-check" /> Admission request submitted! Your reference number is <strong>#{submittedId}</strong>. Save it to track your request status.
              <br /><Link to="/track-application" style={{ color: "inherit", textDecoration: "underline" }}>Track your request</Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
