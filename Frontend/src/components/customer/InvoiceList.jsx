import { FileText, ArrowRight } from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import { Link } from "react-router-dom";

function InvoiceList({ invoices }) {
    return (
        <section className="dashboard-card">

            <div className="card-heading">
                <div>
                    <h3>Recent Invoices</h3>
                    <p>Your latest billing information</p>
                </div>
            </div>

            <div className="invoice-list">

                {invoices.map((invoice) => (
                    <div className="invoice-row" key={invoice.id}>

                        <div className="invoice-icon">
                            <FileText size={19} />
                        </div>

                        <div className="invoice-info">
                            <strong>{invoice.id}</strong>
                            <span>{invoice.date}</span>
                        </div>

                        <div className="invoice-right">
                            <strong>
                                ₹{invoice.amount.toLocaleString("en-IN")}
                            </strong>

                            <StatusBadge status={invoice.status} />
                        </div>

                    </div>
                ))}

            </div>

            <a href="/customer/invoices" className="invoice-link">
                View all invoices <ArrowRight size={15} />
            </a>

        </section>
    );
}

export default InvoiceList;