import { useState } from "react";
import { useApp } from "../../../context/AppContext";
import FField from "./FField";
import SettingsMsg from "./SettingsMsg";

export default function ContactPanel() {
  const { site, setSite } = useApp();
  const [draft, setDraft] = useState(site);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSite((s) => ({ ...s, ...draft }));
    setSaved(true);
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

      <SettingsMsg text="Contact details updated — exit to the website to see it live." type={saved ? "ok" : null} />
      <div className="sp-save-row">
        <button className="a-add-btn" onClick={save}>
          <i className="fa-solid fa-check" /> Save changes
        </button>
      </div>
    </>
  );
}
