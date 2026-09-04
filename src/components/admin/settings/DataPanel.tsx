import { API_URL } from "../../../lib/api";

export default function DataPanel() {
  return (
    <div className="settings-panel">
      <h3>Data &amp; Storage</h3>
      <p className="sp-sub">
        This site is backed by a real MySQL database through the API in <code>/server</code> — teachers,
        resources, applications, FAQs and page content are stored on the server, not in the browser, so
        every visitor and every device sees the same up-to-date information.
      </p>

      <div className="sp-block">
        <h5>HOW STORAGE WORKS HERE</h5>
        <ul className="data-info-list">
          <li>All content lives in the MySQL database (see <code>server/src/schema.sql</code>), shared by everyone who visits the site.</li>
          <li>Uploaded files (resource PDFs/slides, application reports, site images) are saved on the API server's disk under <code>server/uploads/</code> and served back as normal file URLs.</li>
          <li>Only your dark/light mode preference stays local to your own browser — everything else is shared.</li>
          <li>
            Currently connected to: <code>{API_URL}</code>
          </li>
        </ul>
      </div>

      <div className="sp-block">
        <h5>RESETTING TO DEFAULT DEMO DATA</h5>
        <p style={{ fontSize: "13px", color: "var(--ink-soft)" }}>
          Because this now affects everyone who visits the live site, resetting isn't a button here — run
          it from the server instead:
        </p>
        <pre className="sp-code-block">cd server{"\n"}npm run db:seed</pre>
        <p style={{ fontSize: "13px", color: "var(--ink-soft)" }}>
          (<code>db:seed</code> only adds rows that don't exist yet, so it's safe to run again — it won't
          duplicate or wipe data that's already there.)
        </p>
      </div>
    </div>
  );
}
