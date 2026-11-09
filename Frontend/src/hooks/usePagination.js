import { useState, useMemo, useCallback } from 'react';

export function usePagination(items = [], initialPageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalRecords = Array.isArray(items) ? items.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, safeCurrentPage, pageSize]);

  const handlePageChange = useCallback(
    (page) => {
      const next = Math.min(Math.max(1, Number(page) || 1), totalPages);
      setCurrentPage(next);
    },
    [totalPages]
  );

  const handlePageSizeChange = useCallback((newSize) => {
    const size = Number(newSize) || 10;
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage: safeCurrentPage,
    pageSize,
    totalRecords,
    totalPages,
    paginatedItems,
    paginatedData: paginatedItems,
    setCurrentPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    goToPage: handlePageChange,
    resetPagination,
    startIndex: totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1,
    endIndex: Math.min(safeCurrentPage * pageSize, totalRecords),
  };
}

export default usePagination;
