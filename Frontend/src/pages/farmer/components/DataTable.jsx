import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';

function DataTable({
  columns = [],
  rows = [],
  emptyMessage = 'No data available in table.',
  emptyTitle = 'No Records',
  onRowClick,
}) {
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className="farmer-table-wrapper">
      <table className="farmer-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  width: col.width || 'auto',
                  textAlign: col.align || 'left',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id || row.transactionId || index}
              onClick={() => onRowClick && onRowClick(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col) => (
                <td
                  key={`${col.key}-${index}`}
                  style={{
                    textAlign: col.align || 'left',
                  }}
                >
                  {col.render ? (
                    col.render(row[col.key], row, index)
                  ) : col.badge ? (
                    <StatusBadge status={row[col.badge] || row[col.key]} />
                  ) : (
                    row[col.key] ?? '-'
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
