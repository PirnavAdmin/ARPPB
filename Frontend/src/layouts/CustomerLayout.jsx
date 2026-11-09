import { useState } from "react";
import { Outlet } from "react-router-dom";

import CustomerSidebar from "../components/customer/CustomerSidebar";
import CustomerHeader from "../components/customer/CustomerHeader";

import { customerProfile } from "../data/customerMockData";

import "../styles/variables.css";
import "../styles/customer.css";

function CustomerLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="customer-app">

            <CustomerSidebar
                isOpen={sidebarOpen}
                onNavigate={closeSidebar}
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
                    userName={customerProfile.name}
                    role="Customer Account"
                    onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                />

                <main className="customer-page-content">
                    <Outlet />
                </main>

            </div>

        </div>
    );
}

export default CustomerLayout;