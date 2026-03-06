// src/App.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./components/TopBar";
import { checkAuth, type AuthState } from "./utils/auth";

import venueInteriorWithStudents from "../images/venue-interior-with-students.webp";

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

                {/* CONTENT */}
                <section className="relative z-10 px-4 py-14 md:px-8 md:py-20">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {/* HERO */}
                        <div className="rounded-3xl border border-black bg-white px-6 py-8 md:px-10 md:py-12 shadow-[0_12px_35px_rgba(2,6,23,0.10)]">
                            <div className="text-center md:text-left">
                                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                                    Struggling to get those grades up?
                                    <span className="block mt-3" style={{ color: "#355C99" }}>
                    Find a tutor in under 5 clicks!
                  </span>
                                </h1>

                                <div className="mt-8 flex justify-center md:justify-start">
                                    <button
                                        className="px-6 py-3 rounded-full text-white font-extrabold text-sm md:text-base transition
                               shadow-[0_10px_25px_rgba(53,92,153,0.22)]
                               hover:opacity-90"
                                        style={{ backgroundColor: "#355C99" }}
                                        onClick={handleFindTutorClick}
                                    >
                                        Find a tutor
                                    </button>
                                </div>

                                {/* small trust line */}
                                <p className="mt-6 text-sm text-slate-600 font-semibold">
                                    Safe, local tutoring. Simple booking. Transparent pricing. First lesson FREE.
                                </p>
                            </div>
                        </div>

                        {/* IMAGE + ABOUT/CONTACT GRID */}
                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* LEFT: Images (span 2 on large screens) */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Venue interior with students */}
                                <div className="rounded-3xl border border-black bg-white shadow-[0_12px_35px_rgba(2,6,23,0.10)] overflow-hidden">
                                    <div className="p-5 md:p-6">
                                        <p className="text-sm font-extrabold text-slate-900">Real classes</p>
                                        <p className="text-sm text-slate-600 font-medium mt-1">
                                            Small groups. High attention. Real progress.
                                        </p>
                                    </div>
                                    <div className="relative">
                                        <img
                                            src={venueInteriorWithStudents}
                                            alt="Tutoring class interior"
                                            className="w-full h-[240px] md:h-[320px] object-cover"
                                            loading="lazy"
                                        />
                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: About + Contact */}
                            <div className="space-y-6">
                                {/* About card */}
                                <div className="rounded-3xl border border-black bg-white p-6 shadow-[0_12px_35px_rgba(2,6,23,0.10)]">
                                    <h2 className="text-xl font-extrabold tracking-tight">About</h2>
                                    <p className="mt-3 text-sm text-slate-700 font-medium leading-relaxed">
                                        Sumit helps students improve marks with structured lessons, clear explanations, and consistent
                                        practice. With a experienced tutors who have excelled in these subjects, and notes developed over years
                                        by our tutors, you child will walk away with excellent notes and examples after every lesson.
                                    </p>
                                </div>

                                {/* Contact card */}
                                <div className="rounded-3xl border border-black bg-white p-6 shadow-[0_12px_35px_rgba(2,6,23,0.10)]">
                                    <h2 className="text-xl font-extrabold tracking-tight">Contact us</h2>

                                    <div className="mt-4 space-y-3">
                                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Email</p>
                                            <p className="text-sm text-slate-900 font-extrabold">tutors.sumit@gmail.com</p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">WhatsApp</p>
                                            <p className="text-sm text-slate-900 font-extrabold">084 922 3333</p>
                                        </div>
                                    </div>

                                    <button
                                        className="mt-5 w-full px-6 py-3 rounded-full text-white font-extrabold text-sm transition
                               shadow-[0_10px_25px_rgba(53,92,153,0.22)]
                               hover:opacity-90"
                                        style={{ backgroundColor: "#355C99" }}
                                        onClick={handleFindTutorClick}
                                    >
                                        Browse available classes
                                    </button>

                                    {/* optional tiny auth note */}
                                    {!auth.isLoading && !auth.isLoggedIn && (
                                        <p className="mt-3 text-xs text-slate-500 font-semibold">
                                            You can browse classes without logging in.
                                        </p>
                                    )}
                                </div>
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
