import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "https://zodiac-excursion-rendition.ngrok-free.dev";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
    }
});

export default api;