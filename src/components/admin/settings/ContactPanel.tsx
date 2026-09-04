import { useEffect, useState } from "react";
import { useApp } from "../../../context/AppContext";
import FField from "./FField";
import SettingsMsg from "./SettingsMsg";
import { pick } from "../../../utils/pick";

const OWNED_KEYS = ["contactAddress", "contactPhone", "contactHours"] as const;

export default function ContactPanel() {
  const { site, saveSiteSection } = useApp();
  const [draft, setDraft] = useState(site);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(site), [site]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      // Only Contact's own fields are sent — PUT /api/site/contact, which on
      // the backend can only ever write contact_address/phone/hours.
      await saveSiteSection("contact", pick(draft, OWNED_KEYS));
      setSaved(true);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h3>Contact</h3>
      <p className="sp-sub">
        Edit the address, phone number and office hours shown on the Contact section. The phone number is also
        used by the floating WhatsApp button.
      </p>
      <div className="sp-block">
        <FField label="Address" value={draft.contactAddress} onChange={(v) => setDraft((d) => ({ ...d, contactAddress: v }))} />
        <FField label="Phone" value={draft.contactPhone} onChange={(v) => setDraft((d) => ({ ...d, contactPhone: v }))} />
        <FField label="Office hours" value={draft.contactHours} onChange={(v) => setDraft((d) => ({ ...d, contactHours: v }))} />
      </div>

      <SettingsMsg
        text={error || "Contact details updated — exit to the website to see it live."}
        type={error ? "err" : saved ? "ok" : null}
      />
      <div className="sp-save-row">
        <button className="a-add-btn" onClick={save} disabled={saving}>
          <i className="fa-solid fa-check" /> {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </>
  );
}
