// StudentDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type UserRole = "student" | "tutor" | "admin";

type MyClassesDTO = {
    [key: string]: any;
};

const API_BASE = "http://localhost:5173";

const API = {
    myClasses: `${API_BASE}/api/classes/view-my-classes`,
};

async function readErrorText(res: Response) {
    const text = await res.text().catch(() => "");
    return text || `HTTP ${res.status}`;
}

async function safeReadJson<T>(res: Response): Promise<T> {
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `Expected JSON but got ${ct || "unknown content-type"}.\n` +
            (text ? text.slice(0, 300) : "(empty body)")
        );
    }
    return (await res.json()) as T;
}

function StudentDashboard() {
    const navigate = useNavigate();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const [myClasses, setMyClasses] = useState<MyClassesDTO[]>([]);
    const [myClassesLoading, setMyClassesLoading] = useState(false);
    const [myClassesError, setMyClassesError] = useState<string | null>(null);

    const token = localStorage.getItem("token");
    const userRole = (localStorage.getItem("userRole") || "student") as UserRole;

    const isAuthenticated = !!token;
    const isStudent = userRole === "student";

    // Guard: ensure only logged-in students see this dashboard
    useEffect(() => {
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }
        if (userRole !== "student") {
            navigate(`/dashboard/${userRole}`, { replace: true });
        }
    }, [token, userRole, navigate]);

    const authHeaders = useMemo(() => {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    }, [token]);

    // Fetch my classes
    useEffect(() => {
        if (!token || userRole !== "student") return;

        const run = async () => {
            setMyClassesLoading(true);
            setMyClassesError(null);

            try {
                const res = await fetch(API.myClasses, {
                    method: "GET",
                    headers: authHeaders,
                });

                if (!res.ok) {
                    throw new Error(await readErrorText(res));
                }

                const data = await safeReadJson<MyClassesDTO[]>(res);
                setMyClasses(Array.isArray(data) ? data : []);
            } catch (e: any) {
                setMyClassesError(e?.message || "Failed to load your classes");
                setMyClasses([]);
            } finally {
                setMyClassesLoading(false);
            }
        };

        run();
    }, [token, userRole, authHeaders]);

    const hasAnyClasses = myClasses.length > 0;

    // Tiles (keep simple for now)
    const enrolledCount = hasAnyClasses ? myClasses.length : 0;
    const weekCount = hasAnyClasses ? myClasses.length : 0; // later: filter by current week once DTO has dates

    const handleSignOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        setIsProfileMenuOpen(false);
        navigate("/login");
    };

    const toggleProfileMenu = () => setIsProfileMenuOpen((prev) => !prev);
    const handleLogoClick = () => navigate("/dashboard/student");
    const goFindClass = () => navigate("/find-tutor");

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden">
            {/* HEADER */}
            <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between relative z-20 bg-slate-950/80 backdrop-blur">
                <div className="font-semibold text-lg tracking-tight cursor-pointer" onClick={handleLogoClick}>
                    Sumit
                </div>

                {!isAuthenticated ? (
                    <div className="flex gap-3">
                        <button
                            className="text-sm px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 transition"
                            onClick={() => navigate("/login")}
                        >
                            Log in
                        </button>
                        <button
                            className="text-sm px-3 py-1 rounded-full bg-sky-500 hover:bg-sky-400 text-black font-medium transition"
                            onClick={() => navigate("/signup")}
                        >
                            Sign up
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        {/* FIND A CLASS */}
                        {isStudent && (
                            <button
                                onClick={goFindClass}
                                className="hidden sm:inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-sky-500 hover:bg-sky-400 text-black font-semibold transition shadow-lg shadow-sky-500/20"
                                title="Browse tutors and available classes"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M10 18a8 8 0 1 1 5.293-14.293A8 8 0 0 1 10 18z" strokeWidth="1.8" />
                                    <path d="M21 21l-4.3-4.3" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                                Find a class
                            </button>
                        )}

                        {/* PROFILE MENU */}
                        <div className="relative">
                            <button
                                onClick={toggleProfileMenu}
                                className="flex items-center gap-2 px-2 py-1 rounded-full border border-slate-700 bg-slate-900/80 hover:border-sky-500 transition"
                            >
                                <div className="h-8 w-8 rounded-full bg-sky-500/90 flex items-center justify-center text-xs font-semibold text-black">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path
                                            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M4 20c0-2.7614 3.134-5 8-5s8 2.2386 8 5"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>

                                <div className="hidden sm:flex items-center">
                                    <span className="text-xs font-medium text-slate-100">Profile</span>
                                </div>

                                <svg
                                    className={`h-4 w-4 text-slate-400 transition-transform ${
                                        isProfileMenuOpen ? "rotate-180" : ""
                                    }`}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <path d="M6 9l6 6 6-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            {isProfileMenuOpen && (
                                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl shadow-slate-950/70 py-2 z-30">
                                    <div className="px-4 pb-2">
                                        <p className="text-xs uppercase tracking-wide text-slate-500">Account</p>
                                        <p className="text-sm text-slate-200 mt-1">
                                            {userRole === "tutor"
                                                ? "Tutor account"
                                                : userRole === "admin"
                                                    ? "Admin account"
                                                    : "Student account"}
                                        </p>
                                    </div>

                                    <button
                                        className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800/80 transition"
                                        onClick={() => {
                                            setIsProfileMenuOpen(false);
                                            navigate("/profile");
                                        }}
                                    >
                                        Profile
                                    </button>

                                    <button
                                        className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800/80 transition"
                                        onClick={() => {
                                            setIsProfileMenuOpen(false);
                                            navigate("/my-sessions");
                                        }}
                                    >
                                        My sessions
                                    </button>

                                    <button
                                        className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800/80 transition"
                                        onClick={() => {
                                            setIsProfileMenuOpen(false);
                                            navigate("/become-tutor");
                                        }}
                                    >
                                        Become a tutor
                                    </button>

                                    <div className="my-1 border-t border-slate-800" />

                                    <button
                                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
                                        onClick={handleSignOut}
                                    >
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* MAIN */}
            <main className="relative flex-1 px-4 py-8 md:px-8 md:py-10">
                {/* Background glows */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
                    <div className="absolute -top-24 -left-10 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
                    <div className="absolute top-1/4 right-0 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
                    <div className="absolute bottom-10 left-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto space-y-8">
                    {/* MAIN CARD */}
                    <section className="rounded-3xl border border-slate-800/70 bg-slate-900/80 px-6 py-6 md:px-8 md:py-7 shadow-lg shadow-slate-950/70">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                            <div className="min-w-0">
                                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Student Dashboard</h1>

                                {myClassesError && (
                                    <div className="mt-4 rounded-2xl border border-amber-600/50 bg-amber-900/20 px-4 py-3 text-xs text-amber-200 whitespace-pre-wrap">
                                        {myClassesError}
                                    </div>
                                )}

                                {/* EMPTY STATE */}
                                {!myClassesLoading && !hasAnyClasses && (
                                    <div className="mt-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/40 p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
                                                <svg
                                                    className="h-5 w-5 text-sky-300"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        d="M12 3l2.5 5.5L20 9l-4 4 .9 6-4.9-2.8L7.1 19 8 13 4 9l5.5-.5L12 3z"
                                                        strokeWidth="1.6"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </div>

                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-slate-100">No classes yet</p>
                                                <p className="text-xs text-slate-400 mt-1">Once you book a class, it’ll show up here.</p>

                                                <button
                                                    onClick={goFindClass}
                                                    className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-sky-500 hover:bg-sky-400 text-black font-semibold transition shadow-lg shadow-sky-500/20"
                                                >
                                                    Find a class
                                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path d="M5 12h14" strokeWidth="1.8" strokeLinecap="round" />
                                                        <path
                                                            d="M13 6l6 6-6 6"
                                                            strokeWidth="1.8"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* TODAY PANEL */}
                            <div className="w-full md:max-w-sm rounded-3xl border border-slate-800/70 bg-slate-950/30 px-5 py-5">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-semibold text-slate-100">Today</h2>
                                    <span className="text-xs text-slate-400">
                                        {new Date().toLocaleDateString("en-ZA", {
                                            weekday: "short",
                                            day: "numeric",
                                            month: "short",
                                        })}
                                    </span>
                                </div>

                                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-4">
                                    {myClassesLoading ? (
                                        <p className="text-xs text-slate-400">Loading your classes…</p>
                                    ) : hasAnyClasses ? (
                                        <p className="text-xs text-slate-400">Sessions feed later.</p>
                                    ) : (
                                        <p className="text-xs text-slate-400">No sessions booked for today.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SUMMARY TILES (BACK) */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3">
                                <p className="text-xs uppercase tracking-wide text-slate-400">Enrolled classes</p>
                                <p className="text-xl font-semibold mt-1">{enrolledCount}</p>
                                <p className="text-xs text-slate-400">active subjects</p>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3">
                                <p className="text-xs uppercase tracking-wide text-slate-400">This week</p>
                                <p className="text-xl font-semibold mt-1">{weekCount}</p>
                                <p className="text-xs text-slate-400">planned items</p>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 hidden md:block">
                                <p className="text-xs uppercase tracking-wide text-slate-400">Next step</p>
                                <p className="text-sm font-medium mt-1 text-sky-400">Book a class</p>
                                <p className="text-xs text-slate-400">then track everything here</p>
                            </div>
                        </div>
                    </section>

                    {/* FUTURE: MY CLASSES LIST */}
                    {hasAnyClasses && (
                        <section className="rounded-3xl border border-slate-800/70 bg-slate-900/80 px-6 py-6 md:px-8 md:py-7 shadow-lg shadow-slate-950/70">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-semibold text-slate-100">Your classes</h2>
                                <button
                                    className="text-xs text-sky-400 hover:text-sky-300 transition"
                                    onClick={() => navigate("/my-sessions")}
                                >
                                    View sessions
                                </button>
                            </div>

                            {/* for now show raw JSON so you can see the DTO shape */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/30 px-4 py-4">
                                <pre className="text-[11px] text-slate-200 overflow-auto whitespace-pre-wrap">
                                    {JSON.stringify(myClasses, null, 2)}
                                </pre>
                            </div>
                        </section>
                    )}

                    {!isStudent && isAuthenticated && (
                        <div className="rounded-2xl border border-amber-600/70 bg-amber-900/30 px-4 py-3 text-xs text-amber-100">
                            You are logged in as <span className="font-semibold">{userRole}</span>. Redirecting…
                        </div>
                    )}
                </div>
            </main>

            {/* FOOTER */}
            <footer className="px-4 py-4 border-t border-slate-800 text-xs text-slate-400 text-center relative z-10">
                © {new Date().getFullYear()} Sumit. All rights reserved.
            </footer>
        </div>
    );
}

export default StudentDashboard;
