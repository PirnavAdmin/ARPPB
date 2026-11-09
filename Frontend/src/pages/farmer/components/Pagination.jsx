function Pagination({ currentPage = 1, totalPages = 1, onPageChange, totalItems = 0, pageSize = 10 }) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 4px 4px',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <span style={{ fontSize: '0.84rem', color: 'var(--farmer-secondary)' }}>
        Showing <strong>{start}</strong> to <strong>{end}</strong> of <strong>{totalItems}</strong> entries
      </span>

      <div style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          className="farmer-btn farmer-btn-outline farmer-btn-sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
        >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            type="button"
            className={`farmer-btn farmer-btn-sm ${
              currentPage === page ? 'farmer-btn-primary' : 'farmer-btn-outline'
            }`}
            onClick={() => onPageChange(page)}
            style={{ minWidth: 34 }}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          className="farmer-btn farmer-btn-outline farmer-btn-sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;
