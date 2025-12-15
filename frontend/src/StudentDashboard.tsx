import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Session = {
    id: number;
    subject: string;
    tutorName: string;
    date: string;      // e.g. "Today · 16:00–17:00"
    location: string;  // e.g. "Online · Stellenbosch"
    status: "upcoming" | "completed";
};

const mockTodaySessions: Session[] = [
    {
        id: 1,
        subject: "Mathematics Grade 11",
        tutorName: "Alex M.",
        date: "Today · 16:00–17:00",
        location: "Online · Google Meet",
        status: "upcoming",
    },
];

const mockUpcomingSessions: Session[] = [
    {
        id: 2,
        subject: "Physical Science Grade 12",
        tutorName: "Noluthando S.",
        date: "Tomorrow · 15:00–16:30",
        location: "Stellenbosch Library",
        status: "upcoming",
    },
    {
        id: 3,
        subject: "Accounting Grade 10",
        tutorName: "Michael K.",
        date: "Thu · 18:00–19:00",
        location: "Online · Zoom",
        status: "upcoming",
    },
];

const enrolledClasses = [
    { id: 1, subject: "Mathematics", grade: 11, sessionsPerWeek: 2 },
    { id: 2, subject: "Physical Science", grade: 12, sessionsPerWeek: 1 },
    { id: 3, subject: "Accounting", grade: 10, sessionsPerWeek: 1 },
];

function StudentDashboard() {
    const navigate = useNavigate();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const token = localStorage.getItem("token");
    const userRole = (localStorage.getItem("userRole") || "student") as "student" | "tutor" | "admin";
    const isAuthenticated = !!token;
    const isStudent = userRole === "student";

    // Guard: ensure only logged-in students see this dashboard
    useEffect(() => {
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        if (userRole !== "student") {
            // If logged in but not a student, redirect to correct dashboard
            navigate(`/dashboard/${userRole}`, { replace: true });
        }
    }, [token, userRole, navigate]);

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
        navigate("/dashboard/student");
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

            {/* MAIN CONTENT */}
            <main className="relative flex-1 px-4 py-8 md:px-8 md:py-10">
                {/* Background glows */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
                    <div className="absolute -top-24 -left-10 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
                    <div className="absolute top-1/4 right-0 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
                    <div className="absolute bottom-10 left-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto space-y-8">
                    {/* GREETING + SUMMARY */}
                    <section className="grid gap-6 md:grid-cols-[2fr,1.2fr]">
                        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/80 px-6 py-6 md:px-8 md:py-7 shadow-lg shadow-slate-950/70">
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
                                Hey there 👋
                            </h1>
                            <p className="text-slate-300 text-sm md:text-base mb-4">
                                Here’s a quick overview of your upcoming classes and study week.
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3">
                                    <p className="text-xs uppercase tracking-wide text-slate-400">
                                        This week
                                    </p>
                                    <p className="text-xl font-semibold mt-1">
                                        {mockUpcomingSessions.length + mockTodaySessions.length}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        booked sessions
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3">
                                    <p className="text-xs uppercase tracking-wide text-slate-400">
                                        Enrolled classes
                                    </p>
                                    <p className="text-xl font-semibold mt-1">
                                        {enrolledClasses.length}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        active subjects
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 hidden md:block">
                                    <p className="text-xs uppercase tracking-wide text-slate-400">
                                        Focus today
                                    </p>
                                    <p className="text-sm font-medium mt-1 text-sky-400">
                                        Maths & Physics
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        2 sessions scheduled
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Today’s schedule card */}
                        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/80 px-6 py-6 md:px-7 md:py-7 shadow-lg shadow-slate-950/70">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-semibold text-slate-100">
                                    Today&apos;s schedule
                                </h2>
                                <span className="text-xs text-slate-400">
                                    {new Date().toLocaleDateString("en-ZA", {
                                        weekday: "short",
                                        day: "numeric",
                                        month: "short",
                                    })}
                                </span>
                            </div>

                            {mockTodaySessions.length === 0 ? (
                                <p className="text-xs text-slate-400">
                                    No sessions booked for today. Great time to revise previous classes.
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {mockTodaySessions.map((session) => (
                                        <li
                                            key={session.id}
                                            className="rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm"
                                        >
                                            <p className="font-medium text-slate-100">
                                                {session.subject}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {session.date} · {session.location}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Tutor: <span className="text-sky-400">{session.tutorName}</span>
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>

                    {/* ENROLLED CLASSES + UPCOMING SESSIONS */}
                    <section className="grid gap-6 lg:grid-cols-[1.4fr,1.6fr]">
                        {/* Enrolled classes */}
                        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/80 px-6 py-6 md:px-7 md:py-7 shadow-lg shadow-slate-950/70">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-semibold text-slate-100">
                                    Your classes
                                </h2>
                                <button
                                    className="text-xs text-sky-400 hover:text-sky-300 transition"
                                    onClick={() => alert("Class management coming soon")}
                                >
                                    Manage
                                </button>
                            </div>

                            <div className="grid gap-3">
                                {enrolledClasses.map((cls) => (
                                    <div
                                        key={cls.id}
                                        className="rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-slate-100">
                                                {cls.subject}
                                            </p>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                                Grade {cls.grade}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {cls.sessionsPerWeek} session
                                            {cls.sessionsPerWeek > 1 ? "s" : ""} per week
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Upcoming sessions list */}
                        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/80 px-6 py-6 md:px-7 md:py-7 shadow-lg shadow-slate-950/70">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-semibold text-slate-100">
                                    Upcoming sessions
                                </h2>
                                <button
                                    className="text-xs text-sky-400 hover:text-sky-300 transition"
                                    onClick={() => navigate("/my-sessions")}
                                >
                                    View all
                                </button>
                            </div>

                            {mockUpcomingSessions.length === 0 ? (
                                <p className="text-xs text-slate-400">
                                    No upcoming sessions. Book a new class to see it here.
                                </p>
                            ) : (
                                <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                    {mockUpcomingSessions.map((session) => (
                                        <li
                                            key={session.id}
                                            className="rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-medium text-slate-100 truncate">
                                                    {session.subject}
                                                </p>
                                                <span className="text-xs text-sky-400">
                                                    {session.date}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Tutor: <span className="text-sky-400">{session.tutorName}</span>
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {session.location}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>

                    {/* Non-student notice (just in case – should rarely show due to redirect) */}
                    {!isStudent && isAuthenticated && (
                        <div className="rounded-2xl border border-amber-600/70 bg-amber-900/30 px-4 py-3 text-xs text-amber-100">
                            You are logged in as <span className="font-semibold">{userRole}</span>.
                            This page is styled for students – you&apos;ll be redirected to your own dashboard.
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
