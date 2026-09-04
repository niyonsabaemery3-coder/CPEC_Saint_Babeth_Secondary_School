interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}

// Compact, mobile-friendly pager: Prev / page numbers (with ellipsis on long
// lists) / Next, plus a small "showing X–Y of Z" hint. Reused by every
// resource / report list in the app so pagination behaves the same everywhere.
export default function Pagination({ page, totalPages, onChange, totalItems, pageSize }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  const pages: (number | "dots")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "dots") {
      pages.push("dots");
    }
  }

  return (
    <div className="pagination">
      <span className="pagination-hint">
        Showing {from}–{to} of {totalItems}
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="page-btn"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          <i className="fa-solid fa-chevron-left" />
        </button>
        {pages.map((p, i) =>
          p === "dots" ? (
            <span key={`dots-${i}`} className="page-dots">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`page-btn ${p === page ? "active" : ""}`}
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          className="page-btn"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          <i className="fa-solid fa-chevron-right" />
        </button>
      </div>
    </div>
  );
}
