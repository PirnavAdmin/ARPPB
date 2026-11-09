
import { useState } from "react";
import {
    FileText,
    CheckCircle,
    Clock,
} from "lucide-react";

import { useCustomerInvoices } from "../../hooks/useCustomerInvoices";
import PageLoader from "../../components/common/PageLoader";
import StatusBadge from "../../components/common/StatusBadge";

function CustomerInvoices() {
    const { invoices, loading, error } = useCustomerInvoices();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    if (loading) {
        return <PageLoader message="Loading invoices..." />;
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <p>{error}</p>
            </div>
        );
    }

    // Invoice Search and Status Filter
    const filteredInvoices = invoices.filter((invoice) => {
        const matchesSearch = invoice.id
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesStatus =
            statusFilter === "All" ||
            invoice.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Invoice Summary Calculations
    const totalInvoices = invoices.length;

    const paidAmount = invoices
        .filter((invoice) => invoice.status === "Paid")
        .reduce((total, invoice) => total + invoice.amount, 0);

    const pendingAmount = invoices
        .filter((invoice) => invoice.status !== "Paid")
        .reduce((total, invoice) => total + invoice.amount, 0);

    return (
        <div className="dashboard-container">

            {/* Welcome Section */}
            <section className="welcome-banner">
                <div className="welcome-content">
                    <span className="welcome-tag">
                        CUSTOMER PORTAL
                    </span>

                    <h1>My Invoices</h1>

                    <p>
                        View and manage your purchase invoices
                        and billing records.
                    </p>
                </div>
            </section>

            {/* Invoice Summary Cards */}
            <section className="dashboard-section">

                <div className="section-heading">
                    <div>
                        <h2>Invoice Overview</h2>
                        <p>Your billing summary at a glance</p>
                    </div>
                </div>

                <div className="stats-grid">

                    <article className="stat-card">
                        <div className="stat-card-top">
                            <div className="stat-icon">
                                <FileText size={21} />
                            </div>
                        </div>

                        <p className="stat-title">Total Invoices</p>
                        <h2 className="stat-value">
                            {totalInvoices}
                        </h2>
                        <p className="stat-description">
                            Total invoices generated
                        </p>
                    </article>

                    <article className="stat-card">
                        <div className="stat-card-top">
                            <div className="stat-icon">
                                <CheckCircle size={21} />
                            </div>
                        </div>

                        <p className="stat-title">Paid Amount</p>
                        <h2 className="stat-value">
                            ₹{paidAmount.toLocaleString("en-IN")}
                        </h2>
                        <p className="stat-description">
                            Successfully paid invoices
                        </p>
                    </article>

                    <article className="stat-card">
                        <div className="stat-card-top">
                            <div className="stat-icon">
                                <Clock size={21} />
                            </div>
                        </div>

                        <p className="stat-title">Pending Amount</p>
                        <h2 className="stat-value">
                            ₹{pendingAmount.toLocaleString("en-IN")}
                        </h2>
                        <p className="stat-description">
                            Unpaid and pending invoices
                        </p>
                    </article>

                </div>
            </section>

            {/* Invoice History */}
            <section className="dashboard-card">

                <div className="card-heading">
                    <div>
                        <h3>Invoice History</h3>
                        <p>Your recent billing information</p>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="invoice-toolbar">

                    <input
                        className="invoice-search"
                        type="text"
                        placeholder="Search invoice ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <select
                        className="invoice-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Pending">Pending</option>
                    </select>

                </div>

                {/* Invoice Table */}
                <div className="table-wrapper">

                    <table className="orders-table">

                        <thead>
                            <tr>
                                <th>INVOICE ID</th>
                                <th>DATE</th>
                                <th>AMOUNT</th>
                                <th>STATUS</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredInvoices.map((invoice) => (
                                <tr key={invoice.id}>

                                    <td className="order-id">
                                        {invoice.id}
                                    </td>

                                    <td>{invoice.date}</td>

                                    <td className="amount-cell">
                                        ₹{invoice.amount.toLocaleString("en-IN")}
                                    </td>

                                    <td>
                                        <StatusBadge
                                            status={invoice.status}
                                        />
                                    </td>

                                </tr>
                            ))}
                        </tbody>

                    </table>

                </div>

                {/* Empty State */}
                {filteredInvoices.length === 0 && (
                    <p className="empty-message">
                        No invoices found.
                    </p>
                )}

            </section>

        </div>
    );
}

export default CustomerInvoices;
