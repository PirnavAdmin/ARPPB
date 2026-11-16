import axios from "axios";

export const AUTH_TOKEN_STORAGE_KEY = "arppb_auth_token_v1";
export const AUTH_SESSION_STORAGE_KEY = "arppb_auth_session_v1";

export const VENDOR_PROFILE_BASE_URL =
    import.meta.env?.VITE_VENDOR_PROFILE_API_BASE_URL ||
    "https://banknote-cardinal-stifle.ngrok-free.dev";

export const MIDDLEMAN_PROFILE_BASE_URL =
    import.meta.env?.VITE_MIDDLEMAN_PROFILE_API_BASE_URL ||
    "https://zodiac-excursion-rendition.ngrok-free.dev";

export const FARMER_PROFILE_BASE_URL =
    import.meta.env?.VITE_FARMER_PROFILE_API_BASE_URL ||
    "https://pogo-musty-monument.ngrok-free.dev";

export const CUSTOMER_PROFILE_BASE_URL =
    import.meta.env?.VITE_CUSTOMER_PROFILE_API_BASE_URL ||
    "https://flatterer-exalted-anthem.ngrok-free.dev";

export const PROFILE_BASE_URLS = {
    vendor: VENDOR_PROFILE_BASE_URL,
    middleman: MIDDLEMAN_PROFILE_BASE_URL,
    farmer: FARMER_PROFILE_BASE_URL,
    customer: CUSTOMER_PROFILE_BASE_URL,
};

export const REMOTE_API_BASE_URL =
    import.meta.env?.VITE_API_BASE_URL ||
    CUSTOMER_PROFILE_BASE_URL;

// In the browser on localhost (Vite dev/preview), use relative URLs ("")
// so requests to /api/v1/... go through Vite's same-origin proxy in vite.config.js
// and avoid browser CORS preflight (405) blocks from the remote ngrok/Kestrel server.
const isBrowserLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

export const API_BASE_URL = isBrowserLocalhost ? "" : REMOTE_API_BASE_URL;

function normalizePortalRole(rawRole) {
    if (rawRole && typeof rawRole === "object") {
        rawRole = rawRole.role;
    }
    if (rawRole === null || rawRole === undefined || rawRole === "") {
        return null;
    }
    if (typeof rawRole === "number") {
        if (rawRole === 1) return "farmer";
        if (rawRole === 2) return "customer";
        if (rawRole === 3) return "middleman";
        if (rawRole === 4) return "vendor";
        return null;
    }
    const cleaned = String(rawRole)
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");
    if (cleaned === "farmer" || cleaned === "1") return "farmer";
    if (cleaned === "customer" || cleaned === "2") return "customer";
    if (cleaned === "middleman" || cleaned === "supplier" || cleaned === "3") {
        return "middleman";
    }
    if (cleaned === "vendor" || cleaned === "4") return "vendor";
    return null;
}

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

export function getStoredUserRole() {
    try {
        if (typeof window === "undefined" || !window.localStorage) {
            return null;
        }
        const rawSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
        if (!rawSession) return null;
        const parsed = JSON.parse(rawSession);
        return normalizePortalRole(parsed?.user?.role || parsed?.role);
    } catch {
        return null;
    }
}

/**
 * Resolves the portal-specific My Profile API base URL using the provided role
 * or the currently authenticated user's role from session storage.
 */
export function getProfileBaseURL(role) {
    const resolvedRole = normalizePortalRole(role) || getStoredUserRole();
    if (resolvedRole && PROFILE_BASE_URLS[resolvedRole]) {
        return PROFILE_BASE_URLS[resolvedRole];
    }
    return REMOTE_API_BASE_URL;
}

function resolveProfileRoleFromUrl(url) {
    const requestUrl = String(url || "").toLowerCase();
    if (requestUrl.includes("/middleman-profile")) return "middleman";
    if (requestUrl.includes("/vendor-profile")) return "vendor";
    if (requestUrl.includes("/customer/profile")) return "customer";
    if (requestUrl.includes("/farmer/profile")) return "farmer";
    return null;
}

function isMyProfileApiRequest(config) {
    if (config?.useProfileBaseURL || config?.profileRole) {
        return true;
    }
    const requestUrl = String(config?.url || "").toLowerCase();
    if (
        requestUrl.includes("/role-access/profile") ||
        requestUrl.includes("/middleman-profile") ||
        requestUrl.includes("/vendor-profile") ||
        requestUrl.includes("/customer/profile") ||
        requestUrl.includes("/farmer/profile")
    ) {
        return true;
    }
    if (typeof window !== "undefined") {
        const pathname = String(window.location.pathname || "").toLowerCase();
        const hash = String(window.location.hash || "").toLowerCase();
        if (
            pathname.includes("/vendor/profile") ||
            pathname.includes("/middleman/profile") ||
            pathname.includes("/customer/profile") ||
            (pathname.includes("/farmer") && hash.includes("profile"))
        ) {
            return true;
        }
    }
    return false;
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

        if (config._retriedViaProxy) {
            config.baseURL = "";
            return config;
        }

        if (isMyProfileApiRequest(config)) {
            const activeRole =
                normalizePortalRole(config.profileRole) ||
                resolveProfileRoleFromUrl(config.url) ||
                getStoredUserRole();
            if (activeRole) {
                config.baseURL = getProfileBaseURL(activeRole);
            }
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
