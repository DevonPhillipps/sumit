// src/api/client.ts
const getApiBaseUrl = (): string => {
    // Development mode
    if (import.meta.env.DEV) {
        const hostname = window.location.hostname;

        // If accessing from network (not localhost)
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            // Use the same hostname but different port for backend
            return `http://${hostname}:8080`;
        }
        // Local development
        return 'http://localhost:8080';
    }

    // Production mode - use your production API URL
    return 'https://your-production-api.com';
};

export const API_BASE_URL = getApiBaseUrl();