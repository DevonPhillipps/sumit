import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type RoleUpper = "STUDENT" | "TUTOR" | "ADMIN";
type RoleLower = "student" | "tutor" | "admin";

function normalizeRole(raw: unknown): RoleUpper {
    const s = String(raw ?? "").trim();
    const up = s.toUpperCase();
    if (up === "STUDENT" || up === "TUTOR" || up === "ADMIN") return up as RoleUpper;
    return "STUDENT";
}

function roleToPath(role: RoleUpper): RoleLower {
    if (role === "TUTOR") return "tutor";
    if (role === "ADMIN") return "admin";
    return "student";
}

function TutorDashboard() {
    const navigate = useNavigate();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const token = localStorage.getItem("token");

    // localStorage may still have old lowercase values, or new uppercase values
    const storedRoleUpper = useMemo(() => normalizeRole(localStorage.getItem("userRole")), []);
    const storedRoleLabel = storedRoleUpper; // display "TUTOR"/etc. (or map to nicer text if you want)

    const isAuthenticated = !!token;

    useEffect(() => {
        const verifyRole = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login", { replace: true });
                return;
            }

            try {
                const res = await fetch("http://localhost:8080/api/auth/role", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    navigate("/login", { replace: true });
                    return;
                }

                // backend now returns uppercase enum string
                const raw = await res.json();
                const roleUpper = normalizeRole(raw);

                if (roleUpper === "TUTOR") return;

                if (roleUpper === "ADMIN") navigate("/dashboard/admin", { replace: true });
                else if (roleUpper === "STUDENT") navigate("/dashboard/student", { replace: true });
                else navigate("/login", { replace: true });
            } catch (e) {
                console.error("Error verifying role", e);
                navigate("/login", { replace: true });
            }
        };

        verifyRole();
    }, [navigate]);

    const handleSignOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        setIsProfileMenuOpen(false);
        navigate("/login");
    };

    const toggleProfileMenu = () => setIsProfileMenuOpen((prev) => !prev);

    // keep routes lowercase even if role enums are uppercase
    const handleLogoClick = () => navigate(`/dashboard/${roleToPath(storedRoleUpper)}`);

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
                            <div className="hidden sm:flex flex-col items-start">
                                <span className="text-xs uppercase tracking-wide text-slate-400">Signed in as</span>
                                <span className="text-xs font-medium text-slate-100">{storedRoleLabel}</span>
                            </div>
                            <svg
                                className={`h-4 w-4 text-slate-400 transition-transform ${isProfileMenuOpen ? "rotate-180" : ""}`}
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
                                    <p className="text-sm text-slate-200 mt-1">Tutor account</p>
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
                                        navigate("/dashboard/tutor");
                                    }}
                                >
                                    Tutor dashboard
                                </button>

                                {/* ✅ NEW */}
                                <button
                                    className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800/80 transition"
                                    onClick={() => {
                                        setIsProfileMenuOpen(false);
                                        navigate("/dashboard/tutor/my-classes");
                                    }}
                                >
                                    My classes
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
                )}
            </header>

            {/* MAIN CONTENT */}
            <main className="relative flex-1 px-4 py-8 md:px-8 md:py-10">
                <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
                    <div className="absolute -top-24 -left-10 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
                    <div className="absolute top-1/4 right-0 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
                    <div className="absolute bottom-10 left-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto space-y-8">
                    <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Tutor Dashboard</h1>
                            <p className="text-sm text-slate-400 mt-1">See your upcoming classes and manage your schedule.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                className="px-4 py-2 rounded-full border border-slate-700 hover:border-sky-500 bg-slate-900/70 text-slate-100 text-sm font-semibold transition"
                                onClick={() => navigate("/dashboard/tutor/my-classes")}
                            >
                                My classes
                            </button>

                            <button
                                className="px-4 py-2 rounded-full bg-sky-500 hover:bg-sky-400 text-black text-sm font-semibold shadow-lg shadow-sky-500/30 transition"
                                onClick={() => navigate("/tutor/create-class")}
                            >
                                + Create new class
                            </button>
                        </div>
                    </section>

                    {/* the rest of your dashboard stays the same */}
                    <section className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/80 px-5 py-4 shadow-lg shadow-slate-950/70">
                            <p className="text-xs uppercase tracking-wide text-slate-400">This week</p>
                            <p className="text-2xl font-semibold mt-1">5</p>
                            <p className="text-xs text-slate-500 mt-1">scheduled sessions</p>
                        </div>

                        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/80 px-5 py-4 shadow-lg shadow-slate-950/70">
                            <p className="text-xs uppercase tracking-wide text-slate-400">Active students</p>
                            <p className="text-2xl font-semibold mt-1">12</p>
                            <p className="text-xs text-slate-500 mt-1">across all your classes</p>
                        </div>

                        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/80 px-5 py-4 shadow-lg shadow-slate-950/70">
                            <p className="text-xs uppercase tracking-wide text-slate-400">Next session</p>
                            <p className="text-sm font-medium mt-1 text-sky-400">Maths Gr 11 · Today 16:00</p>
                            <p className="text-xs text-slate-500 mt-1">Online · Google Meet</p>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="px-4 py-4 border-t border-slate-800 text-xs text-slate-400 text-center relative z-10">
                © {new Date().getFullYear()} Sumit. Tutor panel.
            </footer>
        </div>
    );
}

export default TutorDashboard;
