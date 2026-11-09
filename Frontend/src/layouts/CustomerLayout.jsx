import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import CustomerSidebar from "../components/customer/CustomerSidebar";
import CustomerHeader from "../components/customer/CustomerHeader";

import { customerProfile } from "../data/customerMockData";
import { useAuth } from "../hooks/useAuth";

import "../styles/variables.css";
import "../styles/customer.css";

function CustomerLayout() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const closeSidebar = () => setSidebarOpen(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="customer-app">

            <CustomerSidebar
                isOpen={sidebarOpen}
                onNavigate={closeSidebar}
                onLogout={handleLogout}
            />

            {sidebarOpen && (
                <button
                    className="sidebar-overlay"
                    onClick={closeSidebar}
                    aria-label="Close sidebar"
                />
            )}

            <div className="customer-workspace">

                <CustomerHeader
                    userName={user?.fullName || customerProfile.name}
                    role="Customer Account"
                    onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                    onLogout={handleLogout}
                />

                <main className="customer-page-content">
                    <Outlet />
                </main>

            </div>

        </div>
    );
}

export default CustomerLayout;