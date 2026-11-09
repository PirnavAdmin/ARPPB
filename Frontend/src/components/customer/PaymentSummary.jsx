import { CreditCard, ArrowUpRight } from "lucide-react";

function PaymentSummary({ payments }) {
    const paidPercentage = payments.total > 0
        ? (payments.paid / payments.total) * 100
        : 0;

    return (
        <section className="dashboard-card payment-card">

            <div className="card-heading">

                <div>
                    <h3>Payment Overview</h3>
                    <p>Your payment summary</p>
                </div>

                <div className="small-card-icon">
                    <CreditCard size={20} />
                </div>

            </div>

            <p className="payment-label">
                TOTAL OUTSTANDING
            </p>

            <h2 className="payment-amount">
                ₹{payments.outstanding.toLocaleString("en-IN")}
            </h2>

            <div
                className="payment-progress"
                role="progressbar"
                aria-valuenow={paidPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div style={{ width: `${paidPercentage}%` }} />
            </div>

            <div className="payment-details">
                <span>
                    Paid: ₹{payments.paid.toLocaleString("en-IN")}
                </span>

                <strong>
                    {Math.round(paidPercentage)}% paid
                </strong>
            </div>

            <a
                href="/customer/payments"
                className="primary-action"
            >
                View Payments <ArrowUpRight size={16} />
            </a>

        </section>
    );
}

export default PaymentSummary;