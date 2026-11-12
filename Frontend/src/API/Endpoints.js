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
};

export default Endpoints;