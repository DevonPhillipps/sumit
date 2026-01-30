// TopBar.tsx
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AUTH_CHANGED_EVENT, checkAuth, clearAuthData } from "../utils/auth";

interface TopBarProps {
    showBackButton?: boolean;
    backButtonText?: string;
    customActions?: ReactNode;
}

type RoleLower = "student" | "tutor" | "admin";

function getDashboardPath(role: RoleLower | null | undefined): string {
    if (role === "tutor") return "/dashboard/tutor";
    if (role === "admin") return "/dashboard/admin";
    return "/dashboard/student";
}

export default function TopBar({
                                   showBackButton = false,
                                   backButtonText = "Back",
                                   customActions,
                               }: TopBarProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [role, setRole] = useState<RoleLower | null>(null);

    // profile dropdown
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    /** Where we want to come back to after login/signup */
    const returnTo = useMemo(() => {
        return location.pathname + location.search;
    }, [location.pathname, location.search]);

    useEffect(() => {
        let cancelled = false;

        const refresh = async () => {
            setIsLoading(true);

            const state = await checkAuth();
            if (cancelled) return;

            setIsLoggedIn(state.isLoggedIn);

            // ✅ expects checkAuth() to return role as "student" | "tutor" | "admin" (or null)
            // If your checkAuth returns uppercase, it should already normalize it (like your previous normalizeRoleLower logic).
            setRole((state as any).role ?? null);

            setIsLoading(false);

            // if auth flips to logged out, close menu
            if (!state.isLoggedIn) setMenuOpen(false);
        };

        // Initial check on mount / reload
        refresh();

        // Same-tab auth updates
        const onAuthChanged = () => refresh();

        // Other-tab auth updates
        const onStorage = (e: StorageEvent) => {
            if (e.key === "token" || e.key === "userRole" || e.key === "userName") {
                refresh();
            }
        };

        window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
        window.addEventListener("storage", onStorage);

        return () => {
            cancelled = true;
            window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
            window.removeEventListener("storage", onStorage);
        };
    }, []);

    // close menu on outside click
    useEffect(() => {
        if (!menuOpen) return;

        const onDown = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node | null;
            if (!target) return;
            if (menuRef.current && !menuRef.current.contains(target)) {
                setMenuOpen(false);
            }
        };

        window.addEventListener("mousedown", onDown);
        window.addEventListener("touchstart", onDown);

        return () => {
            window.removeEventListener("mousedown", onDown);
            window.removeEventListener("touchstart", onDown);
        };
    }, [menuOpen]);

    const signOut = () => {
        clearAuthData(); // removes token/role/name + triggers auth:changed
        setMenuOpen(false);
        navigate("/", { replace: true });
    };

    const onLogoClick = () => {
        if (isLoading) return;

        if (!isLoggedIn) {
            navigate("/");
            return;
        }

        navigate(getDashboardPath(role));
    };

    return (
        <header className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-50">
            {/* Logo / Home */}
            <button
                className="font-extrabold text-lg tracking-tight hover:opacity-80 transition-opacity"
                onClick={onLogoClick}
            >
                Sumit
            </button>

            {/* Right-side Actions */}
            <div className="flex items-center gap-2">
                {showBackButton && (
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition font-semibold"
                    >
                        {backButtonText}
                    </button>
                )}

                {customActions}

                {/* Auth-dependent actions */}
                {isLoading ? null : !isLoggedIn ? (
                    /* LOGGED OUT */
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate("/signup", { state: { returnTo } })}
                            className="text-sm px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition font-semibold"
                        >
                            Sign Up
                        </button>
                        <button
                            onClick={() => navigate("/login", { state: { returnTo } })}
                            className="text-sm px-3 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white transition font-semibold"
                        >
                            Login
                        </button>
                    </div>
                ) : (
                    /* LOGGED IN */
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen((v) => !v)}
                            aria-label="Profile"
                            className="flex items-center justify-center h-10 w-10 rounded-full border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 transition"
                        >
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#355C99"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="12" cy="8" r="4" />
                                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                            </svg>
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden z-50">
                                <button
                                    onClick={signOut}
                                    className="w-full text-left px-4 py-3 text-sm font-extrabold text-rose-600 hover:bg-rose-50 transition"
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
