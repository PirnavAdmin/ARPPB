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

    ROLE_ACCESS: {
        FARMER: "/api/v1/role-access/farmer",
        CUSTOMER: "/api/v1/role-access/customer",
        MIDDLEMAN: "/api/v1/role-access/middleman",
        VENDOR: "/api/v1/role-access/vendor",
        PROFILE: "/api/v1/role-access/profile",
        BUSINESS_ACCESS: "/api/v1/role-access/business-access",
    },

    MIDDLEMAN_PROFILE: {
        PROFILE: "/api/v1/middleman-profile",
        BY_ID: (id) => `/api/v1/middleman-profile/${id}`,
        SEND_MOBILE_OTP: "/api/v1/middleman-profile/mobile/send-otp",
        VERIFY_MOBILE_OTP: "/api/v1/middleman-profile/mobile/verify-otp",
    },

    VENDOR_PROFILE: {
        PROFILE: "/api/vendor-profile",
        BY_ID: (vendorId) => `/api/vendor-profile/${vendorId}`,
        BANK_DETAILS: "/api/vendor-profile/bank-details",
        REQUEST_MOBILE_OTP: "/api/vendor-profile/mobile-change/request-otp",
        VERIFY_MOBILE_OTP: "/api/vendor-profile/mobile-change/verify-otp",
    },

    CUSTOMER_PROFILE: {
        PROFILE: "/api/customer/profile",
        ADDRESSES: "/api/customer/profile/addresses",
        ADDRESS_BY_ID: (id) => `/api/customer/profile/addresses/${id}`,
        SET_DEFAULT_ADDRESS: (id) => `/api/customer/profile/addresses/${id}/default`,
        SEND_MOBILE_OTP: "/api/customer/profile/mobile/send-otp",
        VERIFY_MOBILE_OTP: "/api/customer/profile/mobile/verify-otp",
    },

    FARMER_PROFILE: {
        ALL: "/api/v1/farmer/profile/all",
        PROFILE: "/api/v1/farmer/profile",
        BANK_DETAILS: "/api/v1/farmer/profile/bank-details",
        SEND_MOBILE_OTP: "/api/v1/farmer/profile/change-mobile/send-otp",
        VERIFY_MOBILE_OTP: "/api/v1/farmer/profile/change-mobile/verify-otp",
        CHANGE_PASSWORD: "/api/v1/farmer/profile/change-password",
    },

    FARMER_CROPS: {
        BASE: "/api/v1/farmer/crops",
        OPTIONS: "/api/v1/farmer/crops/options",
        BY_ID: (id) => `/api/v1/farmer/crops/${id}`,
        ADD_STOCK: (id) => `/api/v1/farmer/crops/${id}/add-stock`,
    },

    FARMER_MY_SALES: {
        SUMMARY: "/api/v1/farmer/my-sales/summary",
        SUMMARY_ALT: "/api/v1/farmer/sales/summary",
        BASE: "/api/v1/farmer/sales",
        BASE_ALT: "/api/v1/farmer/my-sales",
        BY_ID: (id) => `/api/v1/farmer/my-sales/${id}`,
        BY_ID_ALT: (id) => `/api/v1/farmer/sales/${id}`,
    },

    FARMER_SELL_PRODUCTS: {
        BASE: "/api/v1/farmer/sales",
        BASE_ALT: "/api/v1/farmer/sell-products",
        OPTIONS: "/api/v1/farmer/sell-products/options",
        OPTIONS_ALT: "/api/v1/farmer/sales/options",
        VERIFY_OTP: (id) => `/api/v1/farmer/sell-products/${id}/verify-otp`,
        VERIFY_OTP_ALT1: (id) => `/api/v1/farmer/sell-products/${id}/verify`,
        VERIFY_OTP_ALT2: (id) => `/api/v1/farmer/sales/${id}/verify-otp`,
        VERIFY_OTP_ALT3: (id) => `/api/v1/farmer/sales/${id}/verify`,
        RESEND_OTP: (id) => `/api/v1/farmer/sell-products/${id}/resend-otp`,
        RESEND_OTP_ALT1: (id) => `/api/v1/farmer/sell-products/${id}/resend`,
        RESEND_OTP_ALT2: (id) => `/api/v1/farmer/sales/${id}/resend-otp`,
        RESEND_OTP_ALT3: (id) => `/api/v1/farmer/sales/${id}/resend`,
    },

    FARMER_SALES: {
        BASE: "/api/v1/farmer/sales",
        BASE_ALT: "/api/v1/farmer/my-sales",
        OPTIONS: "/api/v1/farmer/sales/options",
        OPTIONS_ALT: "/api/v1/farmer/sell-products/options",
        SUMMARY: "/api/v1/farmer/sales/summary",
        SUMMARY_ALT: "/api/v1/farmer/my-sales/summary",
        BY_ID: (id) => `/api/v1/farmer/sales/${id}`,
        BY_ID_ALT: (id) => `/api/v1/farmer/my-sales/${id}`,
        VERIFY_OTP: (id) => `/api/v1/farmer/sales/${id}/verify-otp`,
        RESEND_OTP: (id) => `/api/v1/farmer/sales/${id}/resend-otp`,
    },

    FARMER_OTP_CONFIRMATIONS: {
        SUMMARY: "/api/v1/farmer/otp-confirmations/summary",
        CHANNELS: "/api/v1/farmer/otp-confirmations/channels",
        BASE: "/api/v1/farmer/otp-confirmations",
        BY_ID: (id) => `/api/v1/farmer/otp-confirmations/${id}`,
        VERIFY: (id) => `/api/v1/farmer/otp-confirmations/${id}/verify`,
        VERIFY_ALT: (id) => `/api/v1/farmer/otp-confirmations/${id}/verify-otp`,
        RESEND: (id) => `/api/v1/farmer/otp-confirmations/${id}/resend`,
        RESEND_ALT: (id) => `/api/v1/farmer/otp-confirmations/${id}/resend-otp`,
        REJECT: (id) => `/api/v1/farmer/otp-confirmations/${id}/reject`,
        REJECT_ALT: (id) => `/api/v1/farmer/otp-confirmations/${id}/decline`,
    },

    MIDDLEMAN_FARMERS: {
        BASE: "/api/v1/middleman/farmers",
        BY_ID: (id) => `/api/v1/middleman/farmers/${id}`,
        HISTORY: (id) => `/api/v1/middleman/farmers/${id}/history`,
    },

    MIDDLEMAN_PURCHASES: {
        BASE: "/api/v1/middleman/purchases",
        BY_ID: (id) => `/api/v1/middleman/purchases/${id}`,
    },
};

export default Endpoints;