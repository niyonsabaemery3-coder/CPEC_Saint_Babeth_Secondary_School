import { useApp } from "../../../context/AppContext";

export default function ApplicationsView() {
  const { applications, deleteApplication } = useApp();

  return (
    <div className="admin-panel-view active">
      <div className="a-table-wrap">
        <table className="a-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>DOB</th>
              <th>Gender</th>
              <th>Track / Year</th>
              <th>Previous School</th>
              <th>District / Sector</th>
              <th>Parent / Phones</th>
              <th>Report</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan={9} className="a-empty">No applications submitted yet.</td>
              </tr>
            ) : (
              applications.map((a) => (
                <tr key={a.id}>
                  <td><b>{a.name}</b></td>
                  <td>{a.dob || "—"}</td>
                  <td>{a.gender || "—"}</td>
                  <td>{a.trackyear || "—"}</td>
                  <td>{a.prevschool || "—"}</td>
                  <td>{a.district || "—"} / {a.sector || "—"}</td>
                  <td>
                    {a.parent || "—"}
                    <br />
                    <span style={{ color: "var(--ink-soft)" }}>
                      {a.phone1 || ""}{a.phone2 ? " · " + a.phone2 : ""}
                    </span>
                  </td>
                  <td>
                    {a.report && a.reportData ? (
                      <a className="a-dl-btn" href={a.reportData} download={a.report}>
                        <i className="fa-solid fa-download" /> {a.report}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <button
                      className="a-del-btn"
                      onClick={() => {
                        if (confirm(`Delete ${a.name}'s application? This cannot be undone.`)) deleteApplication(a.id);
                      }}
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
