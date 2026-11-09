import {
    customerProfile,
    dashboardStats,
    recentOrders,
    recentInvoices,
    paymentSummary,
} from "../data/customerMockData";

const delay = (ms = 300) =>
    new Promise((resolve) => setTimeout(resolve, ms));

export const customerService = {
    async getDashboard() {
        await delay();

        return {
            profile: customerProfile,
            stats: dashboardStats,
            orders: recentOrders,
            invoices: recentInvoices,
            payments: paymentSummary,
        };
    },

    async getOrders() {
        await delay();
        return recentOrders;
    },

    async getProfile() {
        await delay();
        return customerProfile;
    },
    async getInvoices() {
        await delay();
        return recentInvoices;
    },
};