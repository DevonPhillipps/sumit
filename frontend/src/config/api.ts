// src/config/api.ts
export const API_BASE_URL = (() => {
    if (typeof window === 'undefined') return 'http://localhost:8080';

    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:8080`;
    }
    return 'http://localhost:8080';
})();