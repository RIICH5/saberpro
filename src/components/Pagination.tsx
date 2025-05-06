import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  count: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  page,
  count,
  itemsPerPage,
  onPageChange,
}: PaginationProps) => {
  const hasPrev = page > 1;
  const hasNext = page * itemsPerPage < count;
  const totalPages = Math.ceil(count / itemsPerPage);

  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Create array of page numbers to show
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show a subset with current page in middle when possible
      let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      // Adjust if we're near the end
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis indicators
      if (startPage > 1) {
        pageNumbers.unshift("first");
        if (startPage > 2) pageNumbers.splice(1, 0, "ellipsis-start");
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pageNumbers.push("ellipsis-end");
        pageNumbers.push("last");
      }
    }

    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="p-4 flex items-center justify-between text-saberPro-gray">
      <button
        disabled={!hasPrev}
        className="py-2 px-4 rounded-md bg-gray-100 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 hover:bg-gray-200 transition-all duration-300 active:scale-95"
        onClick={() => changePage(page - 1)}
      >
        <ChevronLeft
          size={14}
          className="transition-transform group-hover:-translate-x-1"
        />
        <span>Anterior</span>
      </button>

      <div className="flex items-center gap-1 text-sm">
        {pageNumbers.map((pageNumber, idx) => {
          if (
            pageNumber === "ellipsis-start" ||
            pageNumber === "ellipsis-end"
          ) {
            return (
              <span key={`ellipsis-${idx}`} className="px-2">
                ...
              </span>
            );
          } else if (pageNumber === "first") {
            return (
              <button
                key="first"
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-gray-100`}
                onClick={() => changePage(1)}
              >
                1
              </button>
            );
          } else if (pageNumber === "last") {
            return (
              <button
                key="last"
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-gray-100`}
                onClick={() => changePage(totalPages)}
              >
                {totalPages}
              </button>
            );
          } else {
            return (
              <button
                key={pageNumber}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 ${
                  page === pageNumber
                    ? "bg-gray-200 font-medium"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => changePage(pageNumber as number)}
              >
                {pageNumber}
              </button>
            );
          }
        })}
      </div>

      <button
        className="py-2 px-4 rounded-md bg-gray-100 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 hover:bg-gray-200 transition-all duration-300 active:scale-95"
        disabled={!hasNext}
        onClick={() => changePage(page + 1)}
      >
        <span>Siguiente</span>
        <ChevronRight
          size={14}
          className="transition-transform group-hover:translate-x-1"
        />
      </button>
    </div>
  );
};

export default Pagination;
