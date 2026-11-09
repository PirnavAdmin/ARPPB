import { Sprout } from "lucide-react";

import { useCustomerDashboard } from
    "../../hooks/useCustomerDashboard";

import StatCard from
    "../../components/customer/StatCard";

import RecentOrders from
    "../../components/customer/RecentOrders";

import InvoiceList from
    "../../components/customer/InvoiceList";

import PaymentSummary from
    "../../components/customer/PaymentSummary";

import PageLoader from
    "../../components/common/PageLoader";

import "../../styles/dashboard.css";

function CustomerDashboard() {
    const { data, loading, error } = useCustomerDashboard();

    if (loading) {
        return <PageLoader message="Loading customer dashboard..." />;
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <p>{error}</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="dashboard-container">

            {/* Welcome Section */}

            <section className="welcome-banner">

                <div className="welcome-content">

                    <span className="welcome-tag">
                        CUSTOMER PORTAL
                    </span>

                    <h1>
                        Welcome back, {data.profile.name}!
                    </h1>

                    <p>
                        Manage your agricultural purchases,
                        orders and payments in one place.
                    </p>

                </div>

                <div className="welcome-decoration">
                    <Sprout size={85} strokeWidth={1.2} />
                </div>

            </section>

            {/* Statistics */}

            <section className="dashboard-section">

                <div className="section-heading">
                    <div>
                        <h2>Business Overview</h2>
                        <p>Your purchase activity at a glance</p>
                    </div>
                </div>

                <div className="stats-grid">

                    {data.stats.map((stat) => (
                        <StatCard
                            key={stat.id}
                            stat={stat}
                        />
                    ))}

                </div>

            </section>

            {/* Recent Orders */}

            <RecentOrders orders={data.orders} />

            {/* Bottom Cards */}

            <section className="dashboard-bottom-grid">

                <PaymentSummary payments={data.payments} />

                <InvoiceList invoices={data.invoices} />

            </section>

        </div>
    );
}

export default CustomerDashboard;