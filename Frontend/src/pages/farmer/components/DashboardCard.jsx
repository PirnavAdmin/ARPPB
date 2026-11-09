function DashboardCard({
  icon,
  label,
  value,
  trend,
  tone = 'positive',
  description,
  onClick,
}) {
  return (
    <div
      className="farmer-stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="farmer-stat-top">
        <div className="farmer-stat-icon">
          {icon || (
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )}
        </div>
        {trend && (
          <span className={`farmer-stat-badge ${tone}`}>
            {trend}
          </span>
        )}
      </div>

      <div>
        <div className="farmer-stat-value">{value}</div>
        <div className="farmer-stat-label">{label}</div>
        {description && <div className="farmer-stat-desc">{description}</div>}
      </div>
    </div>
  );
}

export default DashboardCard;
