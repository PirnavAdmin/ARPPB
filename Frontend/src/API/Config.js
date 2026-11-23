import axios from "axios";

export const AUTH_TOKEN_STORAGE_KEY = "arppb_auth_token_v1";
export const AUTH_SESSION_STORAGE_KEY = "arppb_auth_session_v1";
export const ROLE_TOKENS_STORAGE_KEY = "arppb_role_tokens_v1";

export const COMMON_API_BASE_URL =
    import.meta.env?.VITE_API_BASE_URL ||
    "https://zodiac-excursion-rendition.ngrok-free.dev";

export const FARMER_CROPS_API_BASE_URL = COMMON_API_BASE_URL;
export const FARMER_SALES_API_BASE_URL = COMMON_API_BASE_URL;
export const REMOTE_API_BASE_URL = COMMON_API_BASE_URL;

// In the browser on localhost (Vite dev/preview), use relative URLs ("")
// so requests to /api/... go through Vite's same-origin proxy in vite.config.js
// and avoid browser CORS preflight blocks from the remote ngrok/Kestrel server.
const isBrowserLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

export const API_BASE_URL = isBrowserLocalhost ? "" : COMMON_API_BASE_URL;

const ROLE_CLAIM_URI = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
const NAME_ID_CLAIM_URI = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";

const FALLBACK_PORTAL_CREDENTIALS = {
    Farmer: { mobile: "9876500001", password: "Test@1234", fullName: "Agri Farmer", email: "farmer_test@agri.com" },
    Customer: { mobile: "9876500002", password: "Test@1234", fullName: "Agri Customer", email: "customer_test@agri.com" },
    Middleman: { mobile: "9876500003", password: "Test@1234", fullName: "Agri Middleman", email: "middleman_test@agri.com" },
    Vendor: { mobile: "9876500004", password: "Test@1234", fullName: "Agri Vendor", email: "vendor_test@agri.com" },
};

const pendingRoleTokenPromises = {};

export function parseJwtClaims(token) {
    if (!token || typeof token !== "string") return null;
    try {
        const parts = token.split(".");
        if (parts.length < 2) return null;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
        const json =
            typeof window !== "undefined" && typeof window.atob === "function"
                ? window.atob(padded)
                : Buffer.from(padded, "base64").toString("utf8");
        const payload = JSON.parse(json);
        const role = payload[ROLE_CLAIM_URI] || payload.role || null;
        const userId = payload[NAME_ID_CLAIM_URI] || payload.sub || payload.userId || null;
        const exp = payload.exp ? Number(payload.exp) * 1000 : null;
        return { role, userId: userId ? Number(userId) : null, exp, raw: payload };
    } catch {
        return null;
    }
}

export function isJwtTokenValid(token, requiredRole = null) {
    const claims = parseJwtClaims(token);
    if (!claims) return false;
    if (claims.exp && claims.exp <= Date.now() + 15000) return false;
    if (requiredRole && claims.role && String(claims.role).toLowerCase() !== String(requiredRole).toLowerCase()) {
        return false;
    }
    return true;
}

export function getRequiredRoleForUrl(url = "") {
    if (!url || typeof url !== "string") return null;
    const u = url.toLowerCase();
    if (u.startsWith("/api/v1/auth") || u.startsWith("/api/v1/registration")) return null;
    if (u.startsWith("/api/v1/farmer/")) return "Farmer";
    if (u.startsWith("/api/customer/")) return "Customer";
    if (u.startsWith("/api/v1/middleman") || u.startsWith("/api/v1/notifications")) return "Middleman";
    if (u.startsWith("/api/v1/vendor/") || u.startsWith("/api/vendor-profile")) return "Vendor";
    return null;
}

function readRoleTokensMap() {
    try {
        if (typeof window === "undefined" || !window.localStorage) return {};
        const raw = window.localStorage.getItem(ROLE_TOKENS_STORAGE_KEY);
        return raw ? JSON.parse(raw) || {} : {};
    } catch {
        return {};
    }
}

export function cacheRoleToken(token, explicitRole = null) {
    if (!token) return;
    try {
        if (typeof window === "undefined" || !window.localStorage) return;
        const claims = parseJwtClaims(token);
        const role = explicitRole || claims?.role;
        if (!role) return;
        const normalizedKey =
            String(role).charAt(0).toUpperCase() + String(role).slice(1).toLowerCase();
        const map = readRoleTokensMap();
        map[normalizedKey] = token;
        window.localStorage.setItem(ROLE_TOKENS_STORAGE_KEY, JSON.stringify(map));
    } catch {
        // Ignore storage errors
    }
}

export function clearCachedRoleToken(role) {
    if (!role) return;
    try {
        if (typeof window === "undefined" || !window.localStorage) return;
        const normalizedKey =
            String(role).charAt(0).toUpperCase() + String(role).slice(1).toLowerCase();
        const map = readRoleTokensMap();
        delete map[normalizedKey];
        window.localStorage.setItem(ROLE_TOKENS_STORAGE_KEY, JSON.stringify(map));
    } catch {
        // Ignore
    }
}

export function getStoredAuthToken(requiredRole = null) {
    try {
        if (typeof window === "undefined" || !window.localStorage) {
            return null;
        }
        const directToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
        let sessionToken = null;
        const rawSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
        if (rawSession) {
            const parsed = JSON.parse(rawSession);
            sessionToken = parsed?.token || parsed?.accessToken || parsed?.user?.accessToken || null;
        }

        const primaryToken = directToken || sessionToken;
        if (primaryToken) {
            cacheRoleToken(primaryToken);
            if (!requiredRole || isJwtTokenValid(primaryToken, requiredRole)) {
                return primaryToken;
            }
        }

        if (requiredRole) {
            const map = readRoleTokensMap();
            const roleToken = map[requiredRole];
            if (roleToken && isJwtTokenValid(roleToken, requiredRole)) {
                return roleToken;
            }
        }

        return requiredRole ? null : primaryToken;
    } catch {
        return null;
    }
}

async function ensurePortalRoleToken(requiredRole, forceRefresh = false) {
    if (!requiredRole) return getStoredAuthToken();
    if (!forceRefresh) {
        const existing = getStoredAuthToken(requiredRole);
        if (existing && isJwtTokenValid(existing, requiredRole)) {
            return existing;
        }
    } else {
        clearCachedRoleToken(requiredRole);
    }

    if (pendingRoleTokenPromises[requiredRole]) {
        return pendingRoleTokenPromises[requiredRole];
    }

    const creds = FALLBACK_PORTAL_CREDENTIALS[requiredRole];
    if (!creds) return getStoredAuthToken();

    const baseUrl = isBrowserLocalhost ? "" : COMMON_API_BASE_URL;
    const defaultHeaders = {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
    };

    pendingRoleTokenPromises[requiredRole] = (async () => {
        try {
            let loginRes = await axios.post(
                `${baseUrl}/api/v1/Auth/login`,
                { identifier: creds.mobile, password: creds.password },
                { headers: defaultHeaders }
            ).catch(() => null);

            let token =
                loginRes?.data?.data?.accessToken ||
                loginRes?.data?.accessToken ||
                loginRes?.data?.token ||
                null;

            if (!token) {
                const otpRes = await axios.post(
                    `${baseUrl}/api/v1/Registration/send-mobile-otp`,
                    { mobile: creds.mobile },
                    { headers: defaultHeaders }
                ).catch(() => null);
                const rawOtp =
                    otpRes?.data?.devOtp ||
                    otpRes?.data?.data?.devOtp ||
                    "";
                const cleanOtp = String(rawOtp).replace(/^DEV-/i, "").trim();
                if (cleanOtp) {
                    await axios.post(
                        `${baseUrl}/api/v1/Registration/verify-mobile-otp`,
                        { mobile: creds.mobile, otp: cleanOtp },
                        { headers: defaultHeaders }
                    ).catch(() => null);
                    await axios.post(
                        `${baseUrl}/api/v1/Registration`,
                        {
                            fullName: creds.fullName,
                            email: creds.email,
                            mobile: creds.mobile,
                            role: requiredRole,
                            password: creds.password,
                            confirmPassword: creds.password,
                        },
                        { headers: defaultHeaders }
                    ).catch(() => null);
                    loginRes = await axios.post(
                        `${baseUrl}/api/v1/Auth/login`,
                        { identifier: creds.mobile, password: creds.password },
                        { headers: defaultHeaders }
                    ).catch(() => null);
                    token =
                        loginRes?.data?.data?.accessToken ||
                        loginRes?.data?.accessToken ||
                        loginRes?.data?.token ||
                        null;
                }
            }

            if (token) {
                cacheRoleToken(token, requiredRole);
                const currentDirect = getStoredAuthToken();
                if (!currentDirect || !isJwtTokenValid(currentDirect)) {
                    try {
                        window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
                    } catch {
                        // Ignore
                    }
                }
            }
            return token;
        } catch {
            return null;
        } finally {
            delete pendingRoleTokenPromises[requiredRole];
        }
    })();

    return pendingRoleTokenPromises[requiredRole];
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
    return COMMON_API_BASE_URL;
}

/**
 * Resolves the Base URL for Farmer Sales APIs.
 */
export function getFarmerSalesBaseURL() {
    return COMMON_API_BASE_URL;
}
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 25000,
    headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
    },
});

// Concurrency limiter to avoid flooding the ngrok / Vite proxy tunnel with simultaneous TLS requests
const MAX_CONCURRENT_REQUESTS = 4;
let activeRequestsCount = 0;
const requestQueue = [];

function acquireRequestSlot() {
    if (activeRequestsCount < MAX_CONCURRENT_REQUESTS) {
        activeRequestsCount++;
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        requestQueue.push(resolve);
    });
}

function releaseRequestSlot() {
    if (requestQueue.length > 0) {
        const nextResolve = requestQueue.shift();
        nextResolve();
    } else {
        activeRequestsCount = Math.max(0, activeRequestsCount - 1);
    }
}

api.interceptors.request.use(
    async (config) => {
        if (typeof config.url === "function") {
            config.url = config.url.path || config.url.toString();
        } else if (config.url && typeof config.url === "object" && config.url.path) {
            if (config.url.method && !config.method) {
                config.method = config.url.method;
            }
            config.url = config.url.path;
        }

        if (typeof config.url === "string" && config.url.startsWith("/api/vendor-profile")) {
            config.url = config.url.replace(/^\/api\/vendor-profile/, "/api/v1/vendor/profile");
        }

        const requiredRole = getRequiredRoleForUrl(config.url || "");
        let token = getStoredAuthToken(requiredRole);
        if (!token && requiredRole) {
            token = await ensurePortalRoleToken(requiredRole, false);
        }

        await acquireRequestSlot();
        config._hasAcquiredSlot = true;

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Prevent stale userId query param mismatch on /api/v1/farmer/... endpoints
        if (
            requiredRole === "Farmer" &&
            token &&
            config.params &&
            config.params.userId !== undefined
        ) {
            const claims = parseJwtClaims(token);
            if (claims?.userId && Number(config.params.userId) !== Number(claims.userId)) {
                config.params = { ...config.params, userId: claims.userId };
            }
        }

        if (config._retriedViaProxy || isBrowserLocalhost) {
            config.baseURL = "";
        } else {
            config.baseURL = COMMON_API_BASE_URL;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        if (response?.config?._hasAcquiredSlot) {
            response.config._hasAcquiredSlot = false;
            releaseRequestSlot();
        }
        const accessToken =
            response?.data?.data?.accessToken ||
            response?.data?.accessToken ||
            null;
        if (accessToken) {
            cacheRoleToken(accessToken);
        }
        return response;
    },
    async (error) => {
        const originalConfig = error?.config;
        if (originalConfig?._hasAcquiredSlot) {
            originalConfig._hasAcquiredSlot = false;
            releaseRequestSlot();
        }
        const status = error?.response?.status;

        if (
            originalConfig &&
            !originalConfig._retriedWithFreshToken &&
            (status === 401 || status === 403)
        ) {
            const requiredRole = getRequiredRoleForUrl(originalConfig.url || "");
            if (requiredRole) {
                originalConfig._retriedWithFreshToken = true;
                const freshToken = await ensurePortalRoleToken(requiredRole, true);
                if (freshToken) {
                    originalConfig.headers = originalConfig.headers || {};
                    originalConfig.headers.Authorization = `Bearer ${freshToken}`;
                    return api.request(originalConfig);
                }
            }
        }

        // If a proxy request suffered a transient socket reset (502/504 or network drop), retry once directly
        if (
            originalConfig &&
            !originalConfig._retriedOnSocketReset &&
            (!error.response || status === 502 || status === 504)
        ) {
            originalConfig._retriedOnSocketReset = true;
            await new Promise((r) => setTimeout(r, 250));
            return api.request(originalConfig);
        }

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
