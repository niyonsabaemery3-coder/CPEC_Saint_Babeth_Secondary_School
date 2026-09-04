import { useEffect, useMemo, useState } from "react";
import { useApp } from "../../../context/AppContext";
import type { ResourceType, SchoolClass } from "../../../types";
import ClassOptions from "../../common/ClassOptions";
import Pagination from "../../common/Pagination";

const TYPE_LABEL: Record<ResourceType, string> = {
  notes: "Notes",
  presentation: "Presentation",
  pastpaper: "Past Paper",
};

const PAGE_SIZE = 10;

export default function MyResourcesView() {
  const { resources, deleteResource, currentTeacher } = useApp();

  const [cls, setCls] = useState<SchoolClass | "all">("all");
  const [type, setType] = useState<ResourceType | "all">("all");
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const mineAll = useMemo(
    () => resources.filter((r) => r.uploaderId === currentTeacher?.id),
    [resources, currentTeacher]
  );

  const query = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    const rows = mineAll.filter(
      (r) =>
        (cls === "all" || r.schoolClass === cls) &&
        (type === "all" || r.type === type) &&
        (!query || r.title.toLowerCase().includes(query) || r.subject.toLowerCase().includes(query))
    );
    rows.sort((a, b) => (sortDir === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)));
    return rows;
  }, [mineAll, cls, type, query, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [cls, type, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="admin-panel-view active">
      <div className="rc-filters students-filters">
        <div className="rc-search">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your resources by title or subject…"
            aria-label="Search my resources"
          />
        </div>

        <select value={cls} onChange={(e) => setCls(e.target.value as SchoolClass | "all")}>
          <ClassOptions includeAll />
        </select>

        <select value={type} onChange={(e) => setType(e.target.value as ResourceType | "all")}>
          <option value="all">All Types</option>
          <option value="notes">Notes</option>
          <option value="presentation">Presentation</option>
          <option value="pastpaper">Past Paper</option>
        </select>

        <button
          type="button"
          className="btn-ghost"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
        >
          <i className={`fa-solid ${sortDir === "asc" ? "fa-arrow-down-a-z" : "fa-arrow-down-z-a"}`} /> Title{" "}
          {sortDir === "asc" ? "A–Z" : "Z–A"}
        </button>

        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setCls("all");
            setType("all");
            setSearch("");
          }}
        >
          <i className="fa-solid fa-rotate-left" /> Reset
        </button>
      </div>

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
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="a-empty">
                  {mineAll.length === 0
                    ? 'You haven\'t uploaded any resources yet. Use "Add Resource" to get started.'
                    : "No resources match those filters yet."}
                </td>
              </tr>
            ) : (
              visible.map((r) => (
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

      <Pagination page={safePage} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
    </div>
  );
}
