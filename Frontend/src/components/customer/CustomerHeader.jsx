import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Bell,
    UserRound,
    Settings,
    LogOut,
    ChevronDown,
    Package,
    X,
} from "lucide-react";

function CustomerHeader({
    userName = "Ravi Kumar",
    role = "Customer Account",
    onSearch,
    onLogout,
}) {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    // Search
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
        onSearch?.(value);
    };

    // Clear Search
    const handleClearSearch = () => {
        setSearch("");
        onSearch?.("");
    };

    // Open Profile Page
    const handleProfile = () => {
        setShowProfile(false);
        setShowNotifications(false);
        navigate("/customer/profile");
    };

    // Open Settings / Portal Hub
    const handleSettings = () => {
        setShowProfile(false);
        setShowNotifications(false);
        navigate("/dashboard");
    };

    // Logout
    const handleLogout = () => {
        setShowProfile(false);
        setShowNotifications(false);
        if (onLogout) {
            onLogout();
        } else {
            navigate("/login");
        }
    };

    return (
        <header className="customer-header">

            {/* Search */}
            <div className="header-search">
                <Search size={21} />

                <input
                    type="text"
                    placeholder="Search orders, products..."
                    value={search}
                    onChange={handleSearch}
                    aria-label="Search orders and products"
                />

                {search && (
                    <button
                        type="button"
                        className="clear-search"
                        onClick={handleClearSearch}
                        aria-label="Clear search"
                    >
                        <X size={17} />
                    </button>
                )}
            </div>

            <div className="header-actions">

                {/* Notifications */}
                <div className="header-dropdown-wrapper">

                    <button
                        type="button"
                        className="notification-button"
                        onClick={() => {
                            setShowNotifications((previous) => !previous);
                            setShowProfile(false);
                        }}
                        aria-label="Notifications"
                    >
                        <Bell size={22} />
                        <span className="notification-dot"></span>
                    </button>

                    {showNotifications && (
                        <div className="header-dropdown notification-dropdown">

                            <div className="dropdown-heading">
                                <h3>Notifications</h3>
                                <span>Recent</span>
                            </div>

                            <div className="notification-item">
                                <div className="notification-icon">
                                    <Package size={19} />
                                </div>

                                <div>
                                    <strong>Order Update</strong>
                                    <p>Your order status has been updated.</p>
                                    <small>Recently</small>
                                </div>
                            </div>

                            <div className="notification-empty">
                                You're all caught up!
                            </div>

                        </div>
                    )}

                </div>

                {/* Customer Profile Dropdown */}
                <div className="header-dropdown-wrapper">

                    <button
                        type="button"
                        className="profile-button"
                        onClick={() => {
                            setShowProfile((previous) => !previous);
                            setShowNotifications(false);
                        }}
                        aria-expanded={showProfile}
                    >
                        <div className="profile-avatar">
                            {userName?.charAt(0)?.toUpperCase() || "C"}
                        </div>

                        <div className="profile-details">
                            <strong>{userName}</strong>
                            <span>{role}</span>
                        </div>

                        <ChevronDown
                            size={19}
                            className={showProfile ? "rotate-icon" : ""}
                        />
                    </button>

                    {showProfile && (
                        <div className="header-dropdown profile-dropdown">

                            <div className="profile-dropdown-info">
                                <strong>{userName}</strong>
                                <span>{role}</span>
                            </div>

                            {/* My Profile */}
                            <button
                                type="button"
                                onClick={handleProfile}
                            >
                                <UserRound size={18} />
                                My Profile
                            </button>

                            {/* Settings */}
                            <button
                                type="button"
                                onClick={handleSettings}
                            >
                                <Settings size={18} />
                                Settings
                            </button>

                            {/* Logout */}
                            <button
                                type="button"
                                className="logout-option"
                                onClick={handleLogout}
                            >
                                <LogOut size={18} />
                                Logout
                            </button>

                        </div>
                    )}

                </div>

            </div>
        </header>
    );
}

export default CustomerHeader;