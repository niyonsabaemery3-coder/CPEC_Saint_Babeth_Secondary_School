import { useState } from "react";
import { useApp } from "../../context/AppContext";

export default function FloatingActions() {
  const { faqs, site } = useApp();
  const [panelOpen, setPanelOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAnswer = (i: number) => setOpenIndex((cur) => (cur === i ? null : i));

  const openWhatsApp = () => {
    let phone = (site.contactPhone || "").replace(/[^\d]/g, "");
    if (phone.startsWith("0")) phone = "250" + phone.slice(1); // Rwanda country code
    else if (!phone.startsWith("250")) phone = "250" + phone;
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  return (
    <div className="float-actions">
      <div className={`faq-panel ${panelOpen ? "open" : ""}`}>
        <div className="faq-head">
          <div>
            <h4>Ask a question</h4>
            <p>Common questions about our school</p>
          </div>
          <button className="faq-close" onClick={() => setPanelOpen(false)}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="faq-body">
          <div className="faq-list">
            {faqs.length === 0 ? (
              <div className="faq-empty">No questions have been added yet.</div>
            ) : (
              faqs.map((f, i) => (
                <div key={i}>
                  <button className={`faq-q ${openIndex === i ? "open" : ""}`} onClick={() => toggleAnswer(i)}>
                    <span>{f.q}</span>
                    <i className="fa-solid fa-chevron-down" />
                  </button>
                  <div className={`faq-answer ${openIndex === i ? "show" : ""}`}>{f.a}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <button className="fab fab-chat" onClick={() => setPanelOpen((o) => !o)} title="Frequently asked questions">
        <i className="fa-solid fa-comment-dots" />
      </button>
      <button className="fab fab-whatsapp" onClick={openWhatsApp} title="Chat on WhatsApp">
        <i className="fa-brands fa-whatsapp" />
      </button>
    </div>
  );
}
