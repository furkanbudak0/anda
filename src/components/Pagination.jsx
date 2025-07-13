import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const maxVisiblePages = 5;
  let startPage, endPage;

  if (totalPages <= maxVisiblePages) {
    startPage = 1;
    endPage = totalPages;
  } else {
    const maxPagesBeforeCurrent = Math.floor(maxVisiblePages / 2);
    const maxPagesAfterCurrent = Math.ceil(maxVisiblePages / 2) - 1;

    if (currentPage <= maxPagesBeforeCurrent) {
      startPage = 1;
      endPage = maxVisiblePages;
    } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
      startPage = totalPages - maxVisiblePages + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - maxPagesBeforeCurrent;
      endPage = currentPage + maxPagesAfterCurrent;
    }
  }

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  return (
    <nav className="flex items-center justify-center space-x-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <FiChevronLeft className="h-5 w-5" />
      </button>

      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className={`px-4 py-2 rounded-md border ${
              1 === currentPage
                ? "border-purple-500 bg-purple-50 text-purple-600"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            1
          </button>
          {startPage > 2 && <span className="px-2 py-2">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-md border ${
            page === currentPage
              ? "border-purple-500 bg-purple-50 text-purple-600"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2 py-2">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className={`px-4 py-2 rounded-md border ${
              totalPages === currentPage
                ? "border-purple-500 bg-purple-50 text-purple-600"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <FiChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
};

export default Pagination;
