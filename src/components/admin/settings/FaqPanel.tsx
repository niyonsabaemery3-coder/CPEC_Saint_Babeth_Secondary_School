import { useState } from "react";
import { useApp } from "../../../context/AppContext";
import FField from "./FField";
import SettingsMsg from "./SettingsMsg";

export default function FaqPanel() {
  const { faqs, setFaqs, addFaq, deleteFaq } = useApp();
  const [draft, setDraft] = useState(faqs);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [msg, setMsg] = useState<{ text: string; type: "ok" | "err" | null }>({ text: "", type: null });

  const setItem = (index: number, key: "q" | "a", value: string) => {
    const next = [...draft];
    next[index] = { ...next[index], [key]: value };
    setDraft(next);
  };

  const save = () => {
    setFaqs(draft);
    setMsg({ text: "Chat questions updated — exit to the website to see it live.", type: "ok" });
  };

  const handleAdd = () => {
    const q = newQ.trim();
    const a = newA.trim();
    if (!q || !a) {
      setMsg({ text: "Please enter both a question and an answer.", type: "err" });
      return;
    }
    addFaq({ q, a });
    setDraft((d) => [...d, { q, a }]);
    setNewQ("");
    setNewA("");
    setMsg({ text: "Question added.", type: "ok" });
  };

  const handleDelete = (index: number) => {
    if (!confirm("Delete this question? This cannot be undone.")) return;
    deleteFaq(index);
    setDraft((d) => d.filter((_, i) => i !== index));
  };

  return (
    <>
      <h3>Chat Questions (FAQ)</h3>
      <p className="sp-sub">Edit the questions and answers shown to visitors in the chat widget on the website.</p>

      <div className="sp-block">
        {draft.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: "13px" }}>No questions yet — add one below.</p>
        ) : (
          draft.map((f, i) => (
            <div className="faq-admin-item" key={i}>
              <FField label="Question" value={f.q} onChange={(v) => setItem(i, "q", v)} />
              <FField label="Answer" value={f.a} onChange={(v) => setItem(i, "a", v)} multiline />
              <div className="faq-admin-item-actions">
                <button className="a-del-btn" onClick={() => handleDelete(i)}>
                  <i className="fa-solid fa-trash" /> Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="sp-block">
        <h5>Add a new question</h5>
        <FField label="Question" value={newQ} onChange={setNewQ} />
        <FField label="Answer" value={newA} onChange={setNewA} multiline />
        <div className="sp-save-row">
          <button className="a-add-btn" onClick={handleAdd}>
            <i className="fa-solid fa-plus" /> Add question
          </button>
        </div>
      </div>

      <SettingsMsg text={msg.text} type={msg.type} />
      <div className="sp-save-row">
        <button className="a-add-btn" onClick={save}>
          <i className="fa-solid fa-check" /> Save changes
        </button>
      </div>
    </>
  );
}
