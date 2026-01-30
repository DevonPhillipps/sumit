// src/App.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./components/TopBar";
import { checkAuth, type AuthState } from "./utils/auth";

export default function App() {
    const navigate = useNavigate();

    const [auth, setAuth] = useState<AuthState>({
        isLoggedIn: false,
        username: null,
        role: null,
        isLoading: true,
    });

    // Validate at start + when user returns to tab
    useEffect(() => {
        let alive = true;

        const run = async () => {
            setAuth((p) => ({ ...p, isLoading: true }));
            const res = await checkAuth();
            if (!alive) return;
            setAuth(res);
        };

        run();

        const onFocus = () => run();
        const onVisibility = () => {
            if (document.visibilityState === "visible") run();
        };

        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            alive = false;
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);

    const handleFindTutorClick = () => navigate("/find-tutor");

    const handleBecomeTutorClick = () => {
        const token = localStorage.getItem("token");

        if (!token || !auth.isLoggedIn) {
            localStorage.setItem("postAuthRedirect", "/become-tutor");
            navigate("/signup");
            return;
        }

        const roleRaw = localStorage.getItem("userRole") || "STUDENT";
        const role = roleRaw.toUpperCase();

        if (role === "STUDENT") {
            navigate("/become-tutor");
        } else if (role === "TUTOR") {
            navigate("/dashboard/tutor");
        } else {
            navigate("/dashboard/admin");
        }
    };

    return (
        <div className="min-h-screen flex flex-col text-slate-900 overflow-x-hidden">
            {/* TOP BAR */}
            <TopBar />

            {/* MAIN */}
            <main className="relative flex-1 overflow-y-auto">
                {/* SPACE-STYLE BACKGROUND */}
                <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
                    {/* Deep space base */}
                    <div className="absolute inset-0 bg-[#050914]" />

                    {/* Soft nebula light */}
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `
                                radial-gradient(1000px 800px at 18% 22%, rgba(53,92,153,0.55), transparent 65%),
                                radial-gradient(1100px 900px at 82% 28%, rgba(53,92,153,0.38), transparent 70%),
                                radial-gradient(1300px 1000px at 50% 85%, rgba(53,92,153,0.28), transparent 75%)
                            `,
                        }}
                    />

                    {/* Light wash so it feels airy, not dark */}
                    <div className="absolute inset-0 bg-white/12" />

                    {/* Very subtle stars (texture only) */}
                    <div
                        className="absolute inset-0 opacity-[0.14]"
                        style={{
                            backgroundImage: `
                                radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1.8px),
                                radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 2px)
                            `,
                            backgroundSize: "160px 160px, 260px 260px",
                            backgroundPosition: "0 0, 80px 120px",
                        }}
                    />

                    {/* Soft vignette */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,transparent_20%,rgba(0,0,0,0.55)_85%)]" />
                </div>

                {/* HERO */}
                <section className="relative z-10 px-4 py-14 md:px-8 md:py-20">
                    <div className="max-w-5xl mx-auto">
                        <div className="rounded-3xl border border-black bg-white px-6 py-8 md:px-10 md:py-12 shadow-[0_12px_35px_rgba(2,6,23,0.10)] text-center md:text-left">
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                                Struggling to get those grades up?
                                <span className="block mt-3" style={{ color: "#355C99" }}>
                                    Find a tutor in under 5 clicks!
                                </span>
                            </h1>

                            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                                <button
                                    className="px-6 py-3 rounded-full text-white font-extrabold text-sm md:text-base transition
                                               shadow-[0_10px_25px_rgba(53,92,153,0.22)]
                                               hover:opacity-90"
                                    style={{ backgroundColor: "#355C99" }}
                                    onClick={handleFindTutorClick}
                                >
                                    Find a tutor
                                </button>

                                <button
                                    onClick={handleBecomeTutorClick}
                                    className="px-6 py-3 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-sm md:text-base text-slate-900 font-extrabold transition"
                                >
                                    Become a tutor
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="px-4 py-5 border-t border-slate-200 text-sm text-slate-600 text-center font-medium relative z-10 bg-white">
                © {new Date().getFullYear()} Sumit. All rights reserved.
            </footer>
        </div>
    );
}
