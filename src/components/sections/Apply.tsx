import { useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import type { StudentApplication } from "../../types";
import { SCHOOL_CLASSES } from "../../constants/academics";
import FieldError from "../common/FieldError";
import { required, validateMinLength, validateRwandaPhone, validateOptionalRwandaPhone, isValid } from "../../utils/validation";
import { useFadeUp } from "../../hooks/useGsapAnimations";

const WIZ_LABELS = ["Student", "Track", "School", "Parent", "Review"];
const WIZ_TOTAL = WIZ_LABELS.length;

interface FormState {
  name: string;
  dob: string;
  gender: string;
  trackyear: string;
  prevschool: string;
  district: string;
  sector: string;
  parent: string;
  phone1: string;
  phone2: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  dob: "",
  gender: "",
  trackyear: "",
  prevschool: "",
  district: "",
  sector: "",
  parent: "",
  phone1: "",
  phone2: "",
};

export default function Apply() {
  const { addApplication } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [reportFile, setReportFile] = useState<{ name: string; data: string } | null>(null);
  const [toast, setToast] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  const update = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: "" }));
  };

  const handleReportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setReportFile({ name: file.name, data: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const resetReportTile = () => setReportFile(null);

  const validateStep = (s: number): boolean => {
    const stepErrors: Partial<Record<keyof FormState, string>> = {};
    if (s === 1) {
      stepErrors.name = validateMinLength(form.name, 3, "Student full name");
      stepErrors.dob = required(form.dob, "Date of birth");
      stepErrors.gender = required(form.gender, "Gender");
    } else if (s === 2) {
      stepErrors.trackyear = required(form.trackyear, "Preferred track / year");
    } else if (s === 3) {
      stepErrors.prevschool = required(form.prevschool, "Previous school");
      stepErrors.district = required(form.district, "District");
      stepErrors.sector = required(form.sector, "Sector");
    } else if (s === 4) {
      stepErrors.parent = validateMinLength(form.parent, 3, "Parent / guardian name");
      stepErrors.phone1 = validateRwandaPhone(form.phone1, "Parent / guardian phone (1)");
      stepErrors.phone2 = validateOptionalRwandaPhone(form.phone2, "Parent / guardian phone (2)");
    }
    setErrors((prev) => ({ ...prev, ...stepErrors }));
    return isValid(stepErrors as Record<string, string>);
  };

  const goTo = (n: number) => setStep(n);
  const wizNext = (from: number) => {
    if (!validateStep(from)) return;
    goTo(from + 1);
  };
  const wizBack = (from: number) => goTo(from - 1);

  const submitApplication = () => {
    const app: StudentApplication = {
      id: Date.now(),
      name: form.name,
      dob: form.dob,
      gender: form.gender,
      trackyear: form.trackyear,
      report: reportFile ? reportFile.name : null,
      reportData: reportFile ? reportFile.data : null,
      prevschool: form.prevschool,
      district: form.district,
      sector: form.sector,
      parent: form.parent,
      phone1: form.phone1,
      phone2: form.phone2,
    };
    addApplication(app);
    setForm(EMPTY_FORM);
    setErrors({});
    resetReportTile();
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStep(1);
    setToast(true);
    setTimeout(() => setToast(false), 6000);
  };

  const reviewRows: [string, string][] = [
    ["Student full name", form.name || "—"],
    ["Date of birth", form.dob || "—"],
    ["Gender", form.gender || "—"],
    ["Preferred track / year", form.trackyear || "—"],
    ["Previous school report", reportFile ? reportFile.name : "Not uploaded"],
    ["Previous school", form.prevschool || "—"],
    ["District", form.district || "—"],
    ["Sector", form.sector || "—"],
    ["Parent / guardian name", form.parent || "—"],
    ["Parent / guardian phone (1)", form.phone1 || "—"],
    ["Parent / guardian phone (2)", form.phone2 || "Not provided"],
  ];

  return (
    <section id="apply" className="card" ref={ref}>
      <div className="section-head">
        <div className="eyebrow">
          <span className="bar" /> Admissions
        </div>
        <h2>Apply for a place</h2>
        <p>Fill in the form below to request enrolment. Our admissions office will contact you once your application is reviewed.</p>
      </div>

      <div className="apply-wrap">
        <div className="apply-note">
          <h4>What you'll need</h4>
          <ul>
            <li><span className="dot" /> Child's full name, date of birth &amp; gender</li>
            <li><span className="dot" /> A photo/scan of the previous school report</li>
            <li><span className="dot" /> Name &amp; two phone numbers for the parent or guardian</li>
            <li><span className="dot" /> Home address (District &amp; Sector)</li>
            <li><span className="dot" /> Previous school attended</li>
            <li><span className="dot" /> Preferred track / year</li>
          </ul>
          <p style={{ fontSize: "12.5px", color: "var(--ink-soft)", marginTop: "16px" }}>
            Original documents (birth certificate, report card, transfer letter if applicable) should be brought in
            person after your online application is approved.
          </p>
        </div>

        <div className="form-card">
          <h3>Student Application Form</h3>
          <p>Go step by step — your information is saved as you move forward, and you'll review everything before submitting.</p>

          <div className="wizard-steps">
            {Array.from({ length: WIZ_TOTAL }, (_, idx) => {
              const i = idx + 1;
              const state = i < step ? "done" : i === step ? "current" : "";
              return (
                <div className="w-step-wrap" key={i} style={{ display: "contents" }}>
                  <div className={`w-step ${state}`}>
                    <div>
                      <div className="w-dot">{i < step ? <i className="fa-solid fa-check" /> : i}</div>
                      <span className="w-step-label">{WIZ_LABELS[idx]}</span>
                    </div>
                  </div>
                  {i < WIZ_TOTAL && <div className="w-line" />}
                </div>
              );
            })}
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            {/* STEP 1: Student details */}
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
                <button type="button" onClick={() => wizNext(1)}>Next <i className="fa-solid fa-arrow-right" /></button>
              </div>
            </div>

            {/* STEP 2: Track / year + report */}
            <div className={`step-panel ${step === 2 ? "active" : ""}`}>
              <div className="field-grid">
                <div className="full">
                  <select required value={form.trackyear} onChange={(e) => update("trackyear", e.target.value)} className={errors.trackyear ? "field-invalid" : ""}>
                    <option value="" disabled>Preferred track / year</option>
                    {SCHOOL_CLASSES.map((c) => (
                      <option key={c.value} value={c.label}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <FieldError message={errors.trackyear} />
                <div className="full">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: "none" }}
                    onChange={handleReportUpload}
                    id="ap_report"
                  />
                  <div
                    className={`file-tile ${reportFile ? "has-file" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className={reportFile ? "fa-solid fa-circle-check" : "fa-solid fa-cloud-arrow-up"} />
                    <span>{reportFile ? reportFile.name : "Click to upload previous school report"}</span>
                  </div>
                </div>
              </div>
              <div className="wizard-nav">
                <button type="button" className="btn-wiz-back" onClick={() => wizBack(2)}><i className="fa-solid fa-arrow-left" /> Back</button>
                <button type="button" onClick={() => wizNext(2)}>Next <i className="fa-solid fa-arrow-right" /></button>
              </div>
            </div>

            {/* STEP 3: Previous school / location */}
            <div className={`step-panel ${step === 3 ? "active" : ""}`}>
              <div className="field-grid">
                <div className="full ffield">
                  <input type="text" placeholder=" " required value={form.prevschool} onChange={(e) => update("prevschool", e.target.value)} className={errors.prevschool ? "field-invalid" : ""} />
                  <label>Previous school (P6 / current school)</label>
                </div>
                <FieldError message={errors.prevschool} />
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
                <button type="button" onClick={() => wizNext(3)}>Next <i className="fa-solid fa-arrow-right" /></button>
              </div>
            </div>

            {/* STEP 4: Parent / guardian */}
            <div className={`step-panel ${step === 4 ? "active" : ""}`}>
              <div className="field-grid">
                <div className="ffield">
                  <input type="text" placeholder=" " required value={form.parent} onChange={(e) => update("parent", e.target.value)} className={errors.parent ? "field-invalid" : ""} />
                  <label>Parent / guardian name</label>
                </div>
                <FieldError message={errors.parent} />
                <div className="ffield">
                  <input type="tel" placeholder=" " required value={form.phone1} onChange={(e) => update("phone1", e.target.value)} className={errors.phone1 ? "field-invalid" : ""} />
                  <label>Parent / guardian phone (1)</label>
                </div>
                <FieldError message={errors.phone1} />
                <div className="full ffield">
                  <input type="tel" placeholder=" " value={form.phone2} onChange={(e) => update("phone2", e.target.value)} className={errors.phone2 ? "field-invalid" : ""} />
                  <label>Parent / guardian phone (2)</label>
                </div>
                <FieldError message={errors.phone2} />
              </div>
              <div className="wizard-nav">
                <button type="button" className="btn-wiz-back" onClick={() => wizBack(4)}><i className="fa-solid fa-arrow-left" /> Back</button>
                <button type="button" onClick={() => wizNext(4)}>Review <i className="fa-solid fa-arrow-right" /></button>
              </div>
            </div>

            {/* STEP 5: Review & submit */}
            <div className={`step-panel ${step === 5 ? "active" : ""}`}>
              <div className="review-note">
                <i className="fa-solid fa-circle-info" /> Please check everything below. If something is wrong, click "Back" to fix it before submitting.
              </div>
              <div className="review-grid">
                {reviewRows.map(([label, value]) => (
                  <div className="r-item" key={label}>
                    <div className="r-label">{label}</div>
                    <div className="r-value">{value}</div>
                  </div>
                ))}
              </div>
              <div className="wizard-nav">
                <button type="button" className="btn-wiz-back" onClick={() => wizBack(5)}><i className="fa-solid fa-arrow-left" /> Back</button>
                <button type="button" onClick={submitApplication}><i className="fa-solid fa-paper-plane" /> Submit Application</button>
              </div>
            </div>

            <div className={`toast-msg ${toast ? "show" : ""}`}>
              <i className="fa-solid fa-circle-check" /> Application submitted! We'll reach out on the phone number provided.
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
