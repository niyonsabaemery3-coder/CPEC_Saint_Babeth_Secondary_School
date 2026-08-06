import { useApp } from "../../../context/AppContext";

const TYPE_LABEL: Record<string, string> = {
  notes: "Notes",
  presentation: "Presentation",
  pastpaper: "Past Paper",
};

export default function MyResourcesView() {
  const { resources, deleteResource, currentTeacher } = useApp();
  const mine = resources.filter((r) => r.uploaderId === currentTeacher?.id);

  return (
    <div className="admin-panel-view active">
      <div className="a-table-wrap">
        <table className="a-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Class</th>
              <th>Subject</th>
              <th>Type</th>
              <th>Uploaded</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {mine.length === 0 ? (
              <tr>
                <td colSpan={6} className="a-empty">
                  You haven't uploaded any resources yet. Use "Add Resource" to get started.
                </td>
              </tr>
            ) : (
              mine.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.title}</b></td>
                  <td>{r.schoolClass}</td>
                  <td>{r.subject}</td>
                  <td>{TYPE_LABEL[r.type]}</td>
                  <td>{r.createdAt}</td>
                  <td>
                    <button className="a-del-btn" onClick={() => deleteResource(r.id)}>
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
