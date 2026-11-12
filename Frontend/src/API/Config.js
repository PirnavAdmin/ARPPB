import axios from "axios";

export const AUTH_TOKEN_STORAGE_KEY = "arppb_auth_token_v1";
export const AUTH_SESSION_STORAGE_KEY = "arppb_auth_session_v1";

export const REMOTE_API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "https://zodiac-excursion-rendition.ngrok-free.dev";

// In the browser on localhost (Vite dev/preview), use relative URLs ("")
// so requests to /api/v1/... go through Vite's same-origin proxy in vite.config.js
// and avoid browser CORS preflight (405) blocks from the remote ngrok/Kestrel server.
const isBrowserLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

export const API_BASE_URL = isBrowserLocalhost ? "" : REMOTE_API_BASE_URL;

export function getStoredAuthToken() {
    try {
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
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
