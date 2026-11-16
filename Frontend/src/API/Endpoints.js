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
};

export default Endpoints;