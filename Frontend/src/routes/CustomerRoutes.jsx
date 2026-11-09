import { Routes, Route, Navigate } from "react-router-dom";

import CustomerLayout from "../layouts/CustomerLayout";

import CustomerDashboard from "../pages/customer/CustomerDashboard";
import CustomerOrders from "../pages/customer/CustomerOrders";
import CustomerProducts from "../pages/customer/CustomerProducts";
import CustomerInvoices from "../pages/customer/CustomerInvoices";
import CustomerPayments from "../pages/customer/CustomerPayments";
import CustomerProfile from "../pages/customer/CustomerProfile";

function CustomerRoutes() {
    return (
        <Routes>

            <Route element={<CustomerLayout />}>

                <Route
                    index
                    element={<Navigate to="dashboard" replace />}
                />

                <Route
                    path="dashboard"
                    element={<CustomerDashboard />}
                />

                <Route
                    path="orders"
                    element={<CustomerOrders />}
                />

                <Route
                    path="products"
                    element={<CustomerProducts />}
                />

                <Route
                    path="invoices"
                    element={<CustomerInvoices />}
                />

                <Route
                    path="payments"
                    element={<CustomerPayments />}
                />

                <Route
                    path="profile"
                    element={<CustomerProfile />}
                />

            </Route>

        </Routes>
    );
}

export default CustomerRoutes;