import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Reusable pagination component.
 *
 * @param {Object} props
 * @param {number} props.page - Current 1-based page number
 * @param {number} props.pages - Total number of pages
 * @param {number} props.count - Total item count across all pages
 * @param {number} props.pageSize - Number of items per page
 * @param {(newPage: number) => void} props.onPageChange - Callback when a new page is clicked
 */
export default function Pagination({ page, pages, count, pageSize = 12, onPageChange }) {
  if (pages <= 1 && count <= pageSize) return null;

  const startItem = Math.min((page - 1) * pageSize + 1, count);
  const endItem = Math.min(page * pageSize, count);

  // Generate page numbers to display with smart ellipsis
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-xl">
      <div className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700">{startItem}</span> to{" "}
        <span className="font-medium text-slate-700">{endItem}</span> of{" "}
        <span className="font-medium text-slate-700">{count}</span> results
      </div>

      <nav className="inline-flex items-center gap-1" aria-label="Pagination">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
          <span>Previous</span>
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-slate-400">
                  …
                </span>
              );
            }
            const isActive = p === page;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-brand-600 text-white shadow-sm font-semibold"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Page ${p}`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <span className="sm:hidden text-xs text-slate-500 px-2">
          {page} / {pages}
        </span>

        <button
          onClick={() => onPageChange(Math.min(pages, page + 1))}
          disabled={page >= pages}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </nav>
    </div>
  );
}
