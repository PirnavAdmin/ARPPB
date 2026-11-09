import { useNavigate } from "react-router-dom";
import { Eye, ArrowRight } from "lucide-react";


import StatusBadge from "../common/StatusBadge";

function RecentOrders({ orders }) {
    const navigate = useNavigate();
    return (
        <section className="dashboard-card">

            <div className="card-heading">
                <div>
                    <h3>Recent Orders</h3>
                    <p>Track your latest agricultural purchases</p>
                </div>

                <a
                    href="/customer/orders"
                    className="view-all"
                >
                    View all <ArrowRight size={15} />
                </a>
            </div>

            <div className="table-wrapper">
                <table className="orders-table">

                    <thead>
                        <tr>
                            <th>ORDER ID</th>
                            <th>PRODUCT</th>
                            <th>QUANTITY</th>
                            <th>DATE</th>
                            <th>AMOUNT</th>
                            <th>STATUS</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>

                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id}>

                                <td className="order-id">
                                    {order.id}
                                </td>

                                <td>
                                    <div className="product-cell">
                                        <strong>{order.product}</strong>
                                        <span>{order.category}</span>
                                    </div>
                                </td>

                                <td>{order.quantity}</td>

                                <td>{order.date}</td>

                                <td className="amount-cell">
                                    ₹{order.amount.toLocaleString("en-IN")}
                                </td>

                                <td>
                                    <StatusBadge status={order.status} />
                                </td>

                                <td>
                                    <button
                                        className="table-action"
                                        type="button"
                                        onClick={() => navigate("/customer/orders")}
                                        aria-label={`View order ${order.id}`}
                                    >
                                        <Eye size={17} />
                                    </button>
                                </td>

                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>

        </section>
    );
}

export default RecentOrders;