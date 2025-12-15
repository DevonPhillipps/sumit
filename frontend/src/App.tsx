import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function App() {
    const navigate = useNavigate();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const token = localStorage.getItem("token");
    const userRole = (localStorage.getItem("userRole") || "student") as "student" | "tutor" | "admin";
    const isAuthenticated = !!token;

    // If user is logged in, redirect them away from landing page to their dashboard
    useEffect(() => {
        if (isAuthenticated) {
            navigate(`/dashboard/${userRole}`, { replace: true });
        }
    }, [isAuthenticated, userRole, navigate]);

    const handleSignOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        setIsProfileMenuOpen(false);
        navigate("/login");
    };

    const toggleProfileMenu = () => {
        setIsProfileMenuOpen((prev) => !prev);
    };

    const handleLogoClick = () => {
        if (isAuthenticated) {
            navigate(`/dashboard/${userRole}`);
        } else {
            navigate("/");
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden">
            {/* HEADER */}
            <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between relative z-20 bg-slate-950/80 backdrop-blur">
                <div
                    className="font-semibold text-lg tracking-tight cursor-pointer"
                    onClick={handleLogoClick}
                >
                    Sumit
                </div>

                {/* RIGHT SIDE */}
                {!isAuthenticated ? (
                    // Not logged in → show Login / Sign up
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
                    // Logged in → show profile avatar + dropdown
                    <div className="relative">
                        <button
                            onClick={toggleProfileMenu}
                            className="flex items-center gap-2 px-2 py-1 rounded-full border border-slate-700 bg-slate-900/80 hover:border-sky-500 transition"
                        >
                            <div className="h-8 w-8 rounded-full bg-sky-500/90 flex items-center justify-center text-xs font-semibold text-black">
                                <svg
                                    className="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                >
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
                                <span className="text-xs uppercase tracking-wide text-slate-400">
                                    Signed in as
                                </span>
                                <span className="text-xs font-medium text-slate-100">
                                    {userRole}
                                </span>
                            </div>
                            <svg
                                className={`h-4 w-4 text-slate-400 transition-transform ${
                                    isProfileMenuOpen ? "rotate-180" : ""
                                }`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                            >
                                <path
                                    d="M6 9l6 6 6-6"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>

                        {isProfileMenuOpen && (
                            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl shadow-slate-950/70 py-2 z-30">
                                <div className="px-4 pb-2">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">
                                        Account
                                    </p>
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
                )}
            </header>

            {/* MAIN */}
            <main className="relative flex-1 px-4 py-10">
                {/* GLOBAL GLOW ORBS */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
                    {/* Top area */}
                    <div
                        className="absolute -top-32 -left-16 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl"
                        aria-hidden="true"
                    />
                    <div
                        className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-indigo-500/25 blur-3xl"
                        aria-hidden="true"
                    />
                    <div
                        className="absolute top-10 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-fuchsia-500/15 blur-3xl"
                        aria-hidden="true"
                    />

                    {/* Mid page */}
                    <div
                        className="absolute top-1/3 -left-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl"
                        aria-hidden="true"
                    />
                    <div
                        className="absolute top-1/3 right-4 h-72 w-72 rounded-full bg-sky-300/15 blur-3xl"
                        aria-hidden="true"
                    />
                    <div
                        className="absolute top-1/2 left-1/4 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl"
                        aria-hidden="true"
                    />
                    <div
                        className="absolute top-1/2 right-1/4 h-52 w-52 rounded-full bg-sky-500/10 blur-3xl"
                        aria-hidden="true"
                    />

                    {/* Lower page */}
                    <div
                        className="absolute bottom-40 -right-24 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl"
                        aria-hidden="true"
                    />
                    <div
                        className="absolute bottom-24 left-6 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl"
                        aria-hidden="true"
                    />
                    <div
                        className="absolute bottom-10 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-sky-300/10 blur-3xl"
                        aria-hidden="true"
                    />
                </div>

                {/* HERO / FIRST VIEW */}
                <section className="relative w-full max-w-5xl mx-auto z-10">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none" />
                    <div className="relative flex flex-col md:flex-row items-center gap-10">
                        <div className="flex-1">
                            {/* HERO CARD */}
                            <div className="relative z-10 rounded-3xl border border-slate-800/70 bg-slate-900/80 px-6 py-8 md:px-8 md:py-10 shadow-xl shadow-slate-950/70 space-y-6 text-center md:text-left">
                                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                                    Struggling to get those grades up?
                                    <span className="block text-sky-400 mt-2">
                                        Find a tutor in under 5 clicks!
                                    </span>
                                </h1>

                                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                                    <button
                                        className="px-6 py-3 rounded-full bg-sky-500 hover:bg-sky-400 text-black font-semibold text-sm md:text-base shadow-lg shadow-sky-500/30 transition"
                                        onClick={() => {
                                            alert("Tutors page coming soon!");
                                        }}
                                    >
                                        Find a tutor
                                    </button>

                                    <button
                                        onClick={() => navigate("/become-tutor")}
                                        className="px-6 py-3 rounded-full border border-slate-700 text-sm md:text-base text-slate-200 hover:border-sky-500 hover:text-sky-400 transition"
                                    >
                                        Become a tutor
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="px-4 py-4 border-t border-slate-800 text-xs text-slate-400 text-center relative z-10">
                © {new Date().getFullYear()} Sumit. All rights reserved.
            </footer>
        </div>
    );
}

export default App;
