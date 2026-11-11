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
};

export default Endpoints;