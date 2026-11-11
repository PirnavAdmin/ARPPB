const Endpoints = {
    AUTH: {
        LOGIN: "/api/v1/Auth/login",
        FORGOT_PASSWORD: "/api/v1/Auth/forgot-password",
        VERIFY_OTP: "/api/v1/Auth/verify-otp",
        RESET_PASSWORD: "/api/v1/Auth/reset-password",
    },

    REGISTRATION: {
        SEND_MOBILE_OTP: "/api/v1/Registration/send-mobile-otp",
        VERIFY_MOBILE_OTP: "/api/v1/Registration/verify-mobile-otp",
        REGISTER: "/api/v1/Registration",
    },

    FARMER: {
        DASHBOARD: "/api/v1/Farmer/dashboard",
        PROFILE: "/api/v1/Farmer/profile",
        CROPS: "/api/v1/Farmer/crops",
        STOCK: "/api/v1/Farmer/stock",
        MARKET_PRICES: "/api/v1/Farmer/market-prices",
        SALES: "/api/v1/Farmer/sales",
        PURCHASES: "/api/v1/Farmer/purchases",
        OTP_REQUESTS: "/api/v1/Farmer/otp-requests",
        NOTIFICATIONS: "/api/v1/Farmer/notifications",
    },
};

export default Endpoints;
