import axios from "axios";

export const AUTH_TOKEN_STORAGE_KEY = "arppb_auth_token_v1";
export const AUTH_SESSION_STORAGE_KEY = "arppb_auth_session_v1";

export const COMMON_API_BASE_URL =
    import.meta.env?.VITE_API_BASE_URL ||
    "https://zodiac-excursion-rendition.ngrok-free.dev";

export const FARMER_CROPS_API_BASE_URL =
    import.meta.env?.VITE_FARMER_CROPS_API_BASE_URL ||
    COMMON_API_BASE_URL;

export const FARMER_SALES_API_BASE_URL = COMMON_API_BASE_URL;

export const REMOTE_API_BASE_URL = COMMON_API_BASE_URL;

// In the browser on localhost (Vite dev/preview), use relative URLs ("")
// so requests to /api/... go through Vite's same-origin proxy in vite.config.js
// and avoid browser CORS preflight (405) blocks from the remote ngrok/Kestrel server.
const isBrowserLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

export const API_BASE_URL = isBrowserLocalhost ? "" : COMMON_API_BASE_URL;

export function getStoredAuthToken() {
    try {
        if (typeof window === "undefined" || !window.localStorage) {
            return null;
        }
        const directToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
        if (directToken) return directToken;

        const rawSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
        if (!rawSession) return null;
        const parsed = JSON.parse(rawSession);
        return parsed?.token || parsed?.accessToken || parsed?.user?.accessToken || null;
    } catch {
        return null;
    }
}

/**
 * Resolves the common Base URL for all four portals' My Profile APIs.
 */
export function getProfileBaseURL() {
    return COMMON_API_BASE_URL;
}

/**
 * Resolves the Base URL for Farmer Crops APIs.
 */
export function getFarmerCropsBaseURL() {
    return FARMER_CROPS_API_BASE_URL;
}

/**
 * Resolves the Base URL for Farmer Sales & OTP APIs.
 */
export function getFarmerSalesBaseURL() {
    return FARMER_SALES_API_BASE_URL;
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
    }
});

api.interceptors.request.use(
    (config) => {
        const token = getStoredAuthToken();
        if (token && config.headers && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (typeof config.url === "string" && config.url.startsWith("/api/vendor-profile")) {
            config.url = config.url.replace(/^\/api\/vendor-profile/, "/api/v1/vendor/profile");
        }

        if (config._retriedViaProxy || isBrowserLocalhost) {
            config.baseURL = "";
        } else if (typeof config.url === "string" && (config.url.startsWith("/api/v1/farmer/crops") || config.url.startsWith("/api/v1/farmer/"))) {
            config.baseURL = COMMON_API_BASE_URL;
        } else {
            config.baseURL = COMMON_API_BASE_URL;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalConfig = error?.config;
        if (
            isBrowserLocalhost &&
            originalConfig &&
            !originalConfig._retriedViaProxy &&
            !error.response &&
            originalConfig.baseURL &&
            originalConfig.baseURL !== ""
        ) {
            originalConfig._retriedViaProxy = true;
            originalConfig.baseURL = "";
            return api.request(originalConfig);
        }
        return Promise.reject(error);
    }
);

export default api;
