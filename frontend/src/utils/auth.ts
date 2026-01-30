// src/utils/auth.ts
import { API_BASE_URL } from "../config/api";

export interface AuthState {
    isLoggedIn: boolean;
    username: string | null;
    role: string | null;
    isLoading: boolean;
}

export const AUTH_CHANGED_EVENT = "auth:changed";

export function notifyAuthChanged() {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

type RoleLower = "student" | "tutor" | "admin";

function normalizeRoleLower(role: string | null): RoleLower {
    const up = (role || "").trim().toUpperCase();
    if (up === "TUTOR") return "tutor";
    if (up === "ADMIN") return "admin";
    return "student";
}

function getStored() {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("userName");

    // ✅ always read role normalized too (also repairs old bad values)
    const rawRole = localStorage.getItem("userRole");
    const role = rawRole ? normalizeRoleLower(rawRole) : null;
    if (rawRole && role && rawRole !== role) localStorage.setItem("userRole", role);

    return { token, role, username };
}

async function validateToken(token: string): Promise<"valid" | "invalid" | "error"> {
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/validate`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) return "valid";
        if (res.status === 401 || res.status === 403) return "invalid";
        return "error";
    } catch {
        return "error";
    }
}

export async function checkAuth(): Promise<AuthState> {
    const { token, role, username } = getStored();

    if (!token) return { isLoggedIn: false, username: null, role: null, isLoading: false };

    const verdict = await validateToken(token);

    if (verdict === "valid") return { isLoggedIn: true, username, role, isLoading: false };

    if (verdict === "invalid") {
        clearAuthData();
        return { isLoggedIn: false, username: null, role: null, isLoading: false };
    }

    return { isLoggedIn: false, username, role, isLoading: false };
}

export function clearAuthData() {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    notifyAuthChanged();
}

export function setAuthData(token: string, role: string, username?: string) {
    localStorage.setItem("token", token);

    // ✅ enforce lowercase role always
    const roleLower = normalizeRoleLower(role);
    localStorage.setItem("userRole", roleLower);

    if (username) localStorage.setItem("userName", username);
    notifyAuthChanged();
}
