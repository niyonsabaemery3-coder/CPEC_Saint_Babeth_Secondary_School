import { useApp } from "../../../context/AppContext";

export default function DashboardView() {
  const { applications, teachers, resources, teacherAccounts } = useApp();
  const recent = applications.slice(-5).reverse();

  return (
    <div className="admin-panel-view active">
      <div className="stat-grid">
        <div className="stat-card">
          <div className="num">{applications.length}</div>
          <div className="lbl">Applications received</div>
        </div>
        <div className="stat-card">
          <div className="num">{teachers.length}</div>
          <div className="lbl">Teachers listed</div>
        </div>
        <div className="stat-card">
          <div className="num">{resources.length}</div>
          <div className="lbl">Resources published</div>
        </div>
        <div className="stat-card">
          <div className="num">{teacherAccounts.length}</div>
          <div className="lbl">Teacher accounts</div>
        </div>
      </div>
      <div className="a-table-wrap">
        <table className="a-table">
          <thead>
            <tr>
              <th>Recent Applicant</th>
              <th>Track / Year</th>
              <th>Previous School</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={4} className="a-empty">No applications yet — new submissions will appear here.</td>
              </tr>
            ) : (
              recent.map((a) => (
                <tr key={a.id}>
                  <td><b>{a.name}</b></td>
                  <td>{a.trackyear || "—"}</td>
                  <td>{a.prevschool || "—"}</td>
                  <td>{a.phone1 || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
