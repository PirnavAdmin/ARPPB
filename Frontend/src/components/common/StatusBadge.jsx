function StatusBadge({ status }) {
    const className = status
        .toLowerCase()
        .replace(/\s+/g, "-");

    return (
        <span className={`status-badge ${className}`}>
            <span className="status-indicator" />
            {status}
        </span>
    );
}

export default StatusBadge;