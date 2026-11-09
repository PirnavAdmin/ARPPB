import { statusClassMap } from '../utils/farmerHelpers';

function StatusBadge({ status }) {
  if (!status) return null;
  const tone = statusClassMap[status] || 'neutral';

  return (
    <span className={`farmer-status-badge ${tone}`}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          display: 'inline-block',
        }}
      />
      {status}
    </span>
  );
}

export default StatusBadge;
