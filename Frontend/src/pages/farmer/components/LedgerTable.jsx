import { formatCurrency, formatDate, buyerCategoryStyles } from '../utils/farmerHelpers';
import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';

function LedgerTable({ entries = [], onUpdateStatus }) {
  if (!entries || entries.length === 0) {
    return <EmptyState title="No Ledger Entries" message="No debits or credits recorded yet." />;
  }

  return (
    <div className="farmer-table-wrapper">
      <table className="farmer-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Transaction ID</th>
            <th>Description</th>
            <th>Party & Category</th>
            <th style={{ textAlign: 'right' }}>Debit (Out)</th>
            <th style={{ textAlign: 'right' }}>Credit (In)</th>
            <th style={{ textAlign: 'right' }}>Running Balance</th>
            <th>Expected Payment</th>
            <th>Payment Status</th>
            <th style={{ textAlign: 'center' }}>Manual Audit</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isDebit = entry.debit > 0;
            const categoryStyle = buyerCategoryStyles[entry.partyCategory] || {
              bg: '#F1F5F9',
              color: '#475569',
            };

            return (
              <tr key={entry.id}>
                <td style={{ whiteSpace: 'nowrap', fontSize: '0.86rem' }}>
                  {formatDate(entry.date)}
                </td>
                <td style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--farmer-primary)' }}>
                  {entry.transactionId}
                </td>
                <td style={{ maxWidth: 260, fontSize: '0.88rem' }}>
                  {entry.description}
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{entry.partyName}</div>
                  <span
                    className="buyer-badge"
                    style={{
                      backgroundColor: categoryStyle.bg,
                      color: categoryStyle.color,
                      fontSize: '0.7rem',
                      marginTop: 2,
                    }}
                  >
                    {entry.partyCategory}
                  </span>
                </td>
                <td
                  style={{
                    textAlign: 'right',
                    color: isDebit ? 'var(--farmer-danger)' : 'var(--farmer-secondary)',
                    fontWeight: isDebit ? 700 : 400,
                  }}
                >
                  {isDebit ? formatCurrency(entry.debit) : '—'}
                </td>
                <td
                  style={{
                    textAlign: 'right',
                    color: !isDebit ? 'var(--farmer-primary)' : 'var(--farmer-secondary)',
                    fontWeight: !isDebit ? 700 : 400,
                  }}
                >
                  {!isDebit ? formatCurrency(entry.credit) : '—'}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 800 }}>
                  {formatCurrency(entry.runningBalance)}
                </td>
                <td style={{ fontSize: '0.86rem', whiteSpace: 'nowrap' }}>
                  {formatDate(entry.expectedPaymentDate)}
                </td>
                <td>
                  <StatusBadge status={entry.paymentStatus} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  {entry.paymentStatus === 'Payment Expected' ? (
                    <button
                      type="button"
                      className="farmer-btn farmer-btn-outline farmer-btn-sm"
                      onClick={() => onUpdateStatus && onUpdateStatus(entry.id, 'Received')}
                      title="Authorized Manual Audit: Mark as Received"
                    >
                      ✓ Mark Received
                    </button>
                  ) : entry.paymentStatus === 'Received' ? (
                    <span style={{ fontSize: '0.78rem', color: 'var(--farmer-success)', fontWeight: 600 }}>
                      ✓ Audited
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)' }}>
                      Settled
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default LedgerTable;
