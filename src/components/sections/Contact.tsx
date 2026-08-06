import { useState } from "react";
import { useApp } from "../../context/AppContext";

export default function Contact() {
  const { site } = useApp();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");

  const send = () => {
    alert("Thank you! Your message has been noted. (demo only)");
    setName("");
    setContact("");
    setMessage("");
  };

  return (
    <section id="contact" className="card">
      <div className="section-head">
        <div className="eyebrow">
          <span className="bar" /> Contact
        </div>
        <h2>Get in touch</h2>
        <p>Reach out for admissions, partnerships, or general questions.</p>
      </div>
      <div className="contact-grid">
        <div>
          <div className="info-card">
            <div className="icon">
              <i className="fa-solid fa-location-dot" />
            </div>
            <div>
              <h4>Address</h4>
              <p>{site.contactAddress}</p>
            </div>
          </div>
          <div className="info-card">
            <div className="icon">
              <i className="fa-solid fa-phone" />
            </div>
            <div>
              <h4>Phone</h4>
              <p>{site.contactPhone}</p>
            </div>
          </div>
          <div className="info-card">
            <div className="icon">
              <i className="fa-regular fa-clock" />
            </div>
            <div>
              <h4>Office Hours</h4>
              <p>{site.contactHours}</p>
            </div>
          </div>
        </div>
        <div className="form-card">
          <h3>Send us a message</h3>
          <p>We'll get back to you as soon as possible.</p>
          <div className="ffield">
            <input type="text" placeholder=" " value={name} onChange={(e) => setName(e.target.value)} />
            <label>Full name</label>
          </div>
          <div className="ffield">
            <input type="text" placeholder=" " value={contact} onChange={(e) => setContact(e.target.value)} />
            <label>Email or phone</label>
          </div>
          <div className="ffield">
            <textarea rows={4} placeholder=" " value={message} onChange={(e) => setMessage(e.target.value)} />
            <label>Message</label>
          </div>
          <button type="button" onClick={send}>
            Send Message
          </button>
        </div>
      </div>
    </section>
  );
}
