import { useNavigate } from "react-router-dom";

function App() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden">
            {/* HEADER */}
            <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                <div className="font-semibold text-lg tracking-tight">Sumit</div>

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