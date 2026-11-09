function EmptyState({
  icon = '🌾',
  title = 'No records found',
  message = 'There are currently no items matching your criteria or inventory records.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="farmer-empty-state">
      <div className="farmer-empty-icon">{icon}</div>
      <h4>{title}</h4>
      <p>{message}</p>
      {actionLabel && onAction && (
        <button type="button" className="farmer-btn farmer-btn-primary farmer-btn-sm" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
