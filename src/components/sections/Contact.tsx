import { useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import FieldError from "../common/FieldError";
import GoogleMapCard from "../common/GoogleMapCard";
import { validateMinLength, validateEmail, validateRwandaPhone, isValid } from "../../utils/validation";
import { useFadeUp } from "../../hooks/useGsapAnimations";

export default function Contact() {
  const { site } = useApp();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  // "Email or phone" — accept either a valid email or a valid Rwandan phone number.
  const validateContactField = (value: string): string => {
    if (!value.trim()) return "Enter an email or phone number.";
    const looksLikeEmail = value.includes("@");
    if (looksLikeEmail) return validateEmail(value);
    return validateRwandaPhone(value, "Phone number");
  };

  const send = () => {
    const nextErrors = {
      name: validateMinLength(name, 3, "Full name"),
      contact: validateContactField(contact),
      message: validateMinLength(message, 10, "Message"),
    };
    setErrors(nextErrors);
    if (!isValid(nextErrors)) return;

    setSent(true);
    setTimeout(() => setSent(false), 6000);
    setName("");
    setContact("");
    setMessage("");
    setErrors({});
  };

  return (
    <section id="contact" className="card" ref={ref}>
      <div className="section-head">
        <div className="eyebrow">
          <span className="bar" /> Contact
        </div>
        <h2>Get in touch</h2>
        <p>Reach out for admissions, partnerships, or general questions.</p>
      </div>
      <div className="contact-info-row">
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

      <div className="contact-grid">
        <GoogleMapCard
          address={site.contactAddress}
          coordinates={{ lat: -1.5755902, lng: 30.0667042 }}
          mapUrl="https://maps.app.goo.gl/ty8dHZwTUpjwchnY6"
          className="contact-map"
        />
        <div className="form-card">
          <h3>Send us a message</h3>
          <p>We'll get back to you as soon as possible.</p>
          {sent && (
            <div className="ta-notice info">
              <i className="fa-solid fa-circle-check" /> Thank you! Your message has been noted.
            </div>
          )}
          <div className="ffield">
            <input
              type="text"
              placeholder=" "
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? "field-invalid" : ""}
            />
            <label>Full name</label>
          </div>
          <FieldError message={errors.name} />
          <div className="ffield">
            <input
              type="text"
              placeholder=" "
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className={errors.contact ? "field-invalid" : ""}
            />
            <label>Email or phone</label>
          </div>
          <FieldError message={errors.contact} />
          <div className="ffield">
            <textarea
              rows={4}
              placeholder=" "
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={errors.message ? "field-invalid" : ""}
            />
            <label>Message</label>
          </div>
          <FieldError message={errors.message} />
          <button type="button" onClick={send}>
            Send Message
          </button>
        </div>
      </div>
    </section>
  );
}
