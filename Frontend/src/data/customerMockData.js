export const customerProfile = {
    id: "CUS-1001",
    name: "Ravi Kumar",
    email: "ravi@example.com",
    phone: "+91 9876543210",
    company: "Ravi Agro Traders",
    address: "Guntur, Andhra Pradesh",
    memberSince: "January 2025",
};

export const dashboardStats = [
    {
        id: 1,
        title: "Total Purchases",
        value: "₹4,85,000",
        description: "Total purchase value",
        icon: "shopping-bag",
        trend: "+12.5%",
    },
    {
        id: 2,
        title: "Total Orders",
        value: "48",
        description: "Orders placed",
        icon: "package",
        trend: "+8.2%",
    },
    {
        id: 3,
        title: "Pending Orders",
        value: "06",
        description: "Awaiting completion",
        icon: "clock",
        trend: null,
    },
    {
        id: 4,
        title: "Outstanding",
        value: "₹32,500",
        description: "Payment due",
        icon: "wallet",
        trend: null,
    },
];

export const recentOrders = [
    {
        id: "ARP-2026-001",
        product: "Raw Rice",
        category: "Grains",
        quantity: "500 kg",
        date: "05 Nov 2026",
        amount: 45000,
        status: "Completed",
    },
    {
        id: "ARP-2026-002",
        product: "Cotton",
        category: "Cash Crops",
        quantity: "250 kg",
        date: "04 Nov 2026",
        amount: 62500,
        status: "Processing",
    },
    {
        id: "ARP-2026-003",
        product: "Red Chilli",
        category: "Spices",
        quantity: "100 kg",
        date: "03 Nov 2026",
        amount: 28000,
        status: "Pending",
    },
    {
        id: "ARP-2026-004",
        product: "Maize",
        category: "Grains",
        quantity: "400 kg",
        date: "02 Nov 2026",
        amount: 32000,
        status: "Completed",
    },
];

export const recentInvoices = [
    {
        id: "INV-1001",
        date: "05 Nov 2026",
        amount: 45000,
        status: "Paid",
    },
    {
        id: "INV-1002",
        date: "04 Nov 2026",
        amount: 62500,
        status: "Unpaid",
    },
    {
        id: "INV-1003",
        date: "03 Nov 2026",
        amount: 28000,
        status: "Pending",
    },
];

export const paymentSummary = {
    total: 100000,
    paid: 67500,
    outstanding: 32500,
};