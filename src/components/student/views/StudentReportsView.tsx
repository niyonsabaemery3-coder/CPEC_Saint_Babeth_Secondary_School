import { useEffect } from "react";
import { useApp } from "../../../context/AppContext";

export default function StudentReportsView() {
  const { myReport, fetchMyReport } = useApp();

  useEffect(() => {
    fetchMyReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="admin-panel-view active">
      {myReport ? (
        <div className="sr-report-card">
          <div className="sr-report-icon">
            <i className="fa-solid fa-file-circle-check" />
          </div>
          <div className="sr-report-info">
            <h3>{myReport.title || "Your Report"}</h3>
            <p>
              {myReport.fileName || "Report file"} · Uploaded{" "}
              {new Date(myReport.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <a className="a-add-btn" href={myReport.fileData || "#"} target="_blank" rel="noreferrer">
            <i className="fa-solid fa-download" /> View / Download
          </a>
        </div>
      ) : (
        <div className="sr-report-empty">
          <i className="fa-solid fa-file-circle-xmark" />
          <p>No report has been uploaded for you yet. Check back once the school has posted one.</p>
        </div>
      )}
    </div>
  );
}
