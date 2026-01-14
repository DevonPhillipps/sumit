// BookClassPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

type ClassDTO = {
    maxCapacity: number;
    currentCapacity: number | null;
    streetAddress: string | null;
    mapsUrl: string | null;
    venueName: string | null;
    groupClassId: number;
    tutorName: string | null;
    tutorId: number | null;
    startTime: string; // "HH:mm:ss"
    endTime: string; // "HH:mm:ss"
    dayOfWeek: string; // "MONDAY"
};

type GetBookClassPageDTO = {
    groupClassId: number;
    price: string; // BigDecimal serialized as string/number
    classAbout: string | null;
    // numberFreeLessonsAvailable is NOT here anymore (comes from /api/account)
};

type BookMode = "bundle" | "year";

type BookClassDTO = {
    classId: number;
    weeklyBooking: boolean;
    numberOfSessionsBooked: number;
    numberFreeLessonsApplied: number;
};

const API_BASE = "http://localhost:8080";
const API = {
    bookPage: (classId: number) => `${API_BASE}/api/classes/book-group-class-page?classId=${classId}`,
    freeLessons: `${API_BASE}/api/account/get-number-available-free-lessons`,
    bookClass: `${API_BASE}/api/classes/book-group-class`,
};

function normalizeDay(raw: string) {
    if (!raw) return "";
    const s = raw.toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatTime(t: string) {
    if (!t) return "";
    return t.length >= 5 ? t.slice(0, 5) : t;
}

function normalizeUrl(raw: string | null) {
    const s = (raw || "").trim();
    if (!s) return "";
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    return `https://${s}`;
}

function parseMoneyToCents(price: string): number {
    const s = String(price || "").trim();
    if (!s) return 0;

    const cleaned = s.replace(/[^0-9.]/g, "");
    if (!cleaned) return 0;

    const parts = cleaned.split(".");
    const whole = parts[0] || "0";
    const frac = (parts[1] || "").padEnd(2, "0").slice(0, 2);

    const wholeNum = Number(whole);
    const fracNum = Number(frac);

    if (!Number.isFinite(wholeNum) || !Number.isFinite(fracNum)) return 0;
    return wholeNum * 100 + fracNum;
}

function centsToRand(cents: number): string {
    const sign = cents < 0 ? "-" : "";
    const abs = Math.abs(cents);
    const rands = Math.floor(abs / 100);
    const centsPart = String(abs % 100).padStart(2, "0");
    return `${sign}R${rands}.${centsPart}`;
}

function classCapacityLine(cur: number, max: number) {
    if (!max) return "Capacity unknown";
    const safeCur = Math.max(0, cur);
    const left = Math.max(0, max - safeCur);

    if (left <= 2 && max > 0) return `Only ${left} spot${left === 1 ? "" : "s"} left`;

    const pct = max > 0 ? safeCur / max : 0;
    if (pct <= 0.3) return `Max ${max} students · New class`;

    return `${safeCur}/${max} enrolled · ${left} spot${left === 1 ? "" : "s"} left`;
}

export default function BookClassPage() {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();

    const classId = Number(params.classId);

    const passedClass = (location.state as any)?.cls as ClassDTO | undefined;
    const [cls, setCls] = useState<ClassDTO | null>(passedClass ?? null);

    const [details, setDetails] = useState<GetBookClassPageDTO | null>(null);

    // token in state; keep synced with localStorage
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const userRole = (localStorage.getItem("userRole") || "student") as "student" | "tutor" | "admin";

    // free lessons
    const [freeLessonsAvailable, setFreeLessonsAvailable] = useState<number>(0);

    // user choice: how many to use (0..cap)
    const [freeToUse, setFreeToUse] = useState<number>(0);

    const [loading, setLoading] = useState(false);
    const [topError, setTopError] = useState<string | null>(null);

    const [mode, setMode] = useState<BookMode>("bundle");
    const [bundleCount, setBundleCount] = useState<number>(4);

    const [agree, setAgree] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [aboutOpen, setAboutOpen] = useState(false);

    useEffect(() => {
        if (passedClass) setCls(passedClass);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // IMPORTANT: storage event doesn't fire in same tab; poll token
    useEffect(() => {
        const interval = window.setInterval(() => {
            const t = localStorage.getItem("token");
            setToken((prev) => (prev === t ? prev : t));
        }, 500);
        return () => window.clearInterval(interval);
    }, []);

    const authHeaders = useMemo(() => {
        const h: Record<string, string> = { "Content-Type": "application/json" };
        if (token) h.Authorization = `Bearer ${token}`;
        return h;
    }, [token]);

    // 1) booking page details (public)
    useEffect(() => {
        const run = async () => {
            if (!Number.isFinite(classId) || classId <= 0) {
                setTopError("Invalid class id.");
                return;
            }

            setLoading(true);
            setTopError(null);

            try {
                const res = await fetch(API.bookPage(classId), {
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) {
                    const t = await res.text().catch(() => "");
                    throw new Error(t || `Failed to load booking details (${res.status})`);
                }

                const raw = await res.json();

                const normalized: GetBookClassPageDTO = {
                    groupClassId: Number((raw as any)?.groupClassId ?? classId),
                    price: String((raw as any)?.price ?? ""),
                    classAbout: (raw as any)?.classAbout ?? null,
                };

                setDetails(normalized);
            } catch (e: any) {
                setTopError(e?.message || "Failed to load booking details");
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [classId]);

    // 2) free lessons (auth)
    useEffect(() => {
        const run = async () => {
            if (!token) {
                setFreeLessonsAvailable(0);
                setFreeToUse(0);
                return;
            }

            try {
                const res = await fetch(API.freeLessons, { headers: authHeaders });

                if (!res.ok) {
                    const t = await res.text().catch(() => "");
                    throw new Error(t || `Free lessons request failed (${res.status})`);
                }

                const raw = await res.json(); // ResponseEntity<Short>
                const n = Number(raw ?? 0);
                const safe = Number.isFinite(n) ? Math.max(0, n) : 0;

                setFreeLessonsAvailable(safe);
                // default behavior: if user has 1, preselect it; if >1, default to 1
                setFreeToUse(safe > 0 ? 1 : 0);
            } catch (e) {
                console.error("Failed to fetch free lessons:", e);
                setFreeLessonsAvailable(0);
                setFreeToUse(0);
            }
        };

        run();
    }, [token, authHeaders]);

    const hasFreeLessons = !!token && freeLessonsAvailable > 0;

    const dayLabel = cls ? normalizeDay(cls.dayOfWeek) : "";
    const timeLabel = cls ? `${formatTime(cls.startTime)}–${formatTime(cls.endTime)}` : "";

    const priceCents = useMemo(() => parseMoneyToCents(details?.price || ""), [details?.price]);

    // compute cap for freeToUse depending on booking mode
    const freeCap = useMemo(() => {
        if (!hasFreeLessons) return 0;
        if (mode === "year") return freeLessonsAvailable; // indefinite booking, allow using up to all free lessons
        const lessonsBooked = Math.max(1, Math.min(52, bundleCount || 1));
        return Math.min(freeLessonsAvailable, lessonsBooked);
    }, [hasFreeLessons, mode, freeLessonsAvailable, bundleCount]);

    // clamp freeToUse if user changes mode/bundleCount/freeCap
    useEffect(() => {
        setFreeToUse((prev) => Math.max(0, Math.min(prev, freeCap)));
    }, [freeCap]);

    const pricingSummary = useMemo(() => {
        if (!details) {
            return {
                totalCents: 0,
                freeApplied: 0,
                paidLessons: 0,
                totalLessons: 0,
                perLesson: "",
                yearNote: "",
            };
        }

        const perLesson = `R${details.price} per lesson`;

        if (mode === "year") {
            const freeApplied = Math.max(0, Math.min(freeToUse, freeCap));
            const yearNote =
                freeApplied > 0
                    ? `You’ll use ${freeApplied} free lesson${freeApplied === 1 ? "" : "s"}, then ${perLesson}.`
                    : `${perLesson}.`;
            return {
                totalCents: 0,
                freeApplied,
                paidLessons: 0,
                totalLessons: 0,
                perLesson,
                yearNote,
            };
        }

        const totalLessons = Math.max(1, Math.min(52, bundleCount || 1));
        const freeApplied = Math.max(0, Math.min(freeToUse, Math.min(freeCap, totalLessons)));
        const paidLessons = Math.max(0, totalLessons - freeApplied);
        const totalCents = paidLessons * priceCents;

        return {
            totalCents,
            freeApplied,
            paidLessons,
            totalLessons,
            perLesson,
            yearNote: "",
        };
    }, [details, mode, bundleCount, priceCents, freeToUse, freeCap]);

    // Pretty “first line” with red free count (no duplicate second line anymore)
    const summaryLine = useMemo(() => {
        if (!details) return null;

        if (mode === "year") {
            return <div className="text-sm text-slate-300">{pricingSummary.yearNote}</div>;
        }

        const free = pricingSummary.freeApplied;
        const paid = pricingSummary.paidLessons;

        if (free > 0) {
            return (
                <div className="text-sm text-slate-300">
                    <span className="font-semibold text-rose-200">{free} free</span>{" "}
                    + <span className="font-semibold text-slate-100">{paid} paid</span>{" "}
                    lesson{pricingSummary.totalLessons === 1 ? "" : "s"}
                </div>
            );
        }

        return (
            <div className="text-sm text-slate-300">
                <span className="font-semibold text-slate-100">{paid} paid</span>{" "}
                lesson{pricingSummary.totalLessons === 1 ? "" : "s"}
            </div>
        );
    }, [details, mode, pricingSummary]);

    const canSubmit = useMemo(() => {
        if (!details) return false;
        if (!agree) return false;
        if (submitting) return false;
        return true;
    }, [details, agree, submitting]);

    const handleConfirmBooking = async () => {
        if (!details) return;

        if (!token) {
            navigate(`/signup`, { state: { returnTo: `/book-class/${classId}`, returnState: { cls } } });
            return;
        }

        // basic sanity
        const safeFreeToUse = Math.max(0, Math.min(Math.floor(freeToUse || 0), freeCap));
        const safeBundle = Math.max(1, Math.min(52, Math.floor(bundleCount || 1)));

        const payload: BookClassDTO = {
            classId: details.groupClassId ?? classId,
            weeklyBooking: mode === "year",
            numberOfSessionsBooked: mode === "bundle" ? safeBundle : 0,
            numberFreeLessonsApplied: safeFreeToUse,
        };

        setSubmitting(true);
        setTopError(null);

        try {
            const res = await fetch(API.bookClass, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify(payload),
            });

            if (res.status === 401 || res.status === 403) {
                // token expired / role mismatch / not logged in properly
                localStorage.removeItem("token");
                setToken(null);
                navigate(`/login`, { state: { returnTo: `/book-class/${classId}`, returnState: { cls } } });
                return;
            }

            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(t || `Booking failed (${res.status})`);
            }

            alert("Booking confirmed.");
            navigate(`/dashboard/${userRole}`);
        } catch (e: any) {
            console.error(e);
            const msg = e?.message || "Failed to book. Please try again.";
            setTopError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden">
            {/* HEADER */}
            <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between relative z-20 bg-slate-950/80 backdrop-blur">
                <button className="font-semibold text-lg tracking-tight cursor-pointer" onClick={() => navigate("/")}>
                    Sumit
                </button>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 transition"
                    >
                        Back
                    </button>

                    {!!token && (
                        <button
                            onClick={() => navigate(`/dashboard/${userRole}`)}
                            className="text-sm px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 transition"
                        >
                            Dashboard
                        </button>
                    )}
                </div>
            </header>

            <main className="relative flex-1 px-4 py-8 md:px-8 md:py-10">
                {/* Glows */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
                    <div className="absolute -top-24 -left-10 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
                    <div className="absolute top-1/4 right-0 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
                    <div className="absolute bottom-10 left-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto">
                    {topError && (
                        <div className="mb-6 rounded-2xl border border-rose-800/60 bg-rose-900/20 px-4 py-3 text-sm text-rose-200">
                            {topError}
                        </div>
                    )}

                    {!token && (
                        <div className="mb-6 rounded-3xl border border-slate-800/70 bg-slate-900/80 px-6 py-4 shadow-lg shadow-slate-950/60">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                    <p className="text-base font-semibold text-slate-100">You can view this class without an account</p>
                                    <p className="text-sm text-slate-300 mt-1">You only need to sign up when you’re ready to book.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate("/signup")}
                                        className="text-sm px-4 py-2 rounded-2xl bg-sky-500 hover:bg-sky-400 text-black font-semibold transition"
                                    >
                                        Sign up
                                    </button>
                                    <button
                                        onClick={() => navigate("/login")}
                                        className="text-sm px-4 py-2 rounded-2xl border border-slate-700 hover:border-sky-500 text-slate-200 transition"
                                    >
                                        Log in
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* LEFT */}
                        <section className="lg:col-span-5 rounded-3xl border border-slate-800/70 bg-slate-900/80 px-6 py-6 shadow-lg shadow-slate-950/70">
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Book this class</h1>

                            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/40 p-5">
                                {loading || !details ? (
                                    <div className="text-base text-slate-300">Loading booking details…</div>
                                ) : (
                                    <>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-sky-500/15 border border-sky-500/30 text-sky-200">
                                                {dayLabel || "Day"} · {timeLabel || "Time"}
                                            </span>
                                        </div>

                                        <p className="text-lg font-semibold text-slate-100 mt-4">{cls?.venueName || "Venue"}</p>

                                        <p className="text-base text-slate-200 mt-2">
                                            Tutor: <span className="text-sky-300 font-semibold">{cls?.tutorName || "Unknown"}</span>
                                        </p>

                                        <p className="text-base text-slate-200 mt-2">
                                            <span className="text-slate-300 font-medium">Address:</span>{" "}
                                            <span className="text-slate-200">{cls?.streetAddress || "Not set"}</span>
                                        </p>

                                        <p className="text-base text-slate-200 mt-2">
                                            <span className="text-slate-300 font-medium">Price:</span>{" "}
                                            <span className="text-slate-100 font-semibold">R{details.price} per lesson</span>
                                        </p>

                                        <div className="mt-4 text-base text-slate-200 font-medium">
                                            {cls ? classCapacityLine(cls.currentCapacity ?? 0, cls.maxCapacity ?? 0) : "Capacity unknown"}
                                        </div>

                                        {/* About */}
                                        <button
                                            type="button"
                                            onClick={() => setAboutOpen((v) => !v)}
                                            className="mt-5 w-full text-left rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3 hover:border-sky-500/60 transition"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-base font-semibold text-slate-100">About this class</p>
                                                <svg
                                                    className={`h-5 w-5 text-slate-300 transition-transform ${aboutOpen ? "rotate-180" : ""}`}
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                >
                                                    <path d="M6 9l6 6 6-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>

                                            {aboutOpen && (
                                                <div className="mt-3 space-y-2 text-sm text-slate-300 leading-relaxed">
                                                    <div>{details.classAbout || "No description provided."}</div>
                                                </div>
                                            )}
                                        </button>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {cls?.mapsUrl && (
                                                <a
                                                    href={normalizeUrl(cls.mapsUrl)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-2xl border border-slate-700 hover:border-emerald-500/60 text-slate-200 transition"
                                                >
                                                    Open map
                                                </a>
                                            )}

                                            {cls?.tutorId && (
                                                <button
                                                    className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-2xl border border-slate-700 hover:border-sky-500 text-slate-200 transition"
                                                    onClick={() => alert(`Tutor profile route later: /tutors/${cls.tutorId}`)}
                                                >
                                                    View tutor profile
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>

                        {/* RIGHT */}
                        <section className="lg:col-span-7 rounded-3xl border border-slate-800/70 bg-slate-900/80 px-6 py-6 shadow-lg shadow-slate-950/70">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Lesson bookings</h2>
                                <div className="text-sm text-slate-300">
                                    {loading ? "Loading…" : details ? `R${details.price} per lesson` : ""}
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3">
                                {/* Bundle card */}
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setMode("bundle")}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") setMode("bundle");
                                    }}
                                    className={[
                                        "w-full text-left rounded-3xl border p-5 transition cursor-pointer outline-none",
                                        mode === "bundle"
                                            ? "border-sky-500 bg-sky-500/5"
                                            : "border-slate-800 bg-slate-950/30 hover:border-sky-500/60",
                                    ].join(" ")}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-base font-semibold text-slate-100">Book a set number of lessons</p>
                                            <p className="text-sm text-slate-300 mt-1">All lessons are weekly and consecutive.</p>
                                        </div>
                                        <span className="text-[12px] px-2 py-1 rounded-full border border-slate-700 bg-slate-950/40 text-slate-300">
                                            Most common
                                        </span>
                                    </div>

                                    {mode === "bundle" && (
                                        <div className="mt-4 grid gap-3">
                                            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                                <label className="text-sm uppercase tracking-wide text-slate-400">Number of lessons</label>

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {[1, 2, 4, 8, 12].map((n) => (
                                                        <button
                                                            key={n}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setBundleCount(n);
                                                            }}
                                                            className={[
                                                                "px-3 py-2 rounded-2xl border text-sm transition",
                                                                bundleCount === n
                                                                    ? "border-sky-500 bg-sky-500/10 text-sky-200"
                                                                    : "border-slate-700 bg-slate-900/40 hover:border-sky-500/60 text-slate-200",
                                                            ].join(" ")}
                                                        >
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="mt-4">
                                                    <label className="text-sm text-slate-300">Custom</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={52}
                                                        step={1}
                                                        value={bundleCount}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) =>
                                                            setBundleCount(Math.max(1, Math.min(52, Number(e.target.value) || 1)))
                                                        }
                                                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-base text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/60"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Year card */}
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setMode("year")}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") setMode("year");
                                    }}
                                    className={[
                                        "w-full text-left rounded-3xl border p-5 transition cursor-pointer outline-none",
                                        mode === "year"
                                            ? "border-sky-500 bg-sky-500/5"
                                            : "border-slate-800 bg-slate-950/30 hover:border-sky-500/60",
                                    ].join(" ")}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-base font-semibold text-slate-100">Book every week for the rest of the year</p>
                                            <p className="text-sm text-slate-300 mt-1">
                                                Attend the session every week. Your booking runs until year-end.
                                            </p>
                                        </div>
                                        <span className="text-[12px] px-2 py-1 rounded-full border border-slate-700 bg-slate-950/40 text-slate-300">
                                            Flexible
                                        </span>
                                    </div>

                                    {mode === "year" && details && (
                                        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                            <p className="text-sm text-slate-300 leading-relaxed">
                                                {freeToUse > 0 && freeCap > 0 ? (
                                                    <>
                                                        You’ll use{" "}
                                                        <span className="font-semibold text-rose-200">
                                                            {Math.min(freeToUse, freeCap)} free
                                                        </span>
                                                        , then{" "}
                                                        <span className="text-slate-100 font-semibold">R{details.price}</span> per lesson.
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-slate-100 font-semibold">R{details.price}</span> per lesson.
                                                    </>
                                                )}{" "}
                                                Attend the session every week for the rest of the year.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-950/30 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-base font-semibold text-slate-100">Summary</p>
                                        <div className="mt-1">{summaryLine}</div>

                                        {/* Free lessons selector INSIDE summary */}
                                        {hasFreeLessons && details && (
                                            <div className="mt-4 rounded-3xl border border-rose-700/40 bg-rose-500/10 px-5 py-4">
                                                {freeLessonsAvailable === 1 ? (
                                                    <label className="flex items-start justify-between gap-4 text-sm text-slate-200">
                                                        <div>
                                                            <p className="font-semibold text-rose-200">You have 1 free lesson available</p>
                                                            <p className="text-slate-300 mt-1">Would you like to use it for this booking?</p>
                                                        </div>

                                                        <input
                                                            type="checkbox"
                                                            checked={freeToUse >= 1}
                                                            onChange={(e) => setFreeToUse(e.target.checked ? 1 : 0)}
                                                            className="mt-1 h-4 w-4 accent-rose-400"
                                                        />
                                                    </label>
                                                ) : (
                                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                        <div>
                                                            <p className="font-semibold text-rose-200">
                                                                You have {freeLessonsAvailable} free lessons available
                                                            </p>
                                                            <p className="text-sm text-slate-300 mt-1">
                                                                How many would you like to use for this booking?
                                                            </p>
                                                        </div>

                                                        <div className="w-full md:w-44">
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={freeCap}
                                                                value={freeToUse}
                                                                onChange={(e) => {
                                                                    const n = Number(e.target.value);
                                                                    const safe = Number.isFinite(n) ? n : 0;
                                                                    setFreeToUse(Math.max(0, Math.min(Math.floor(safe), freeCap)));
                                                                }}
                                                                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-base text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/60"
                                                            />
                                                            <p className="text-xs text-slate-400 mt-1">
                                                                Max: {freeCap}
                                                                {mode === "bundle" ? " (based on lessons booked)" : ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* price panel */}
                                    {details && mode === "bundle" ? (
                                        <div className="text-right">
                                            <p className="text-sm text-slate-300">R{details.price} per lesson</p>
                                            <p className="text-2xl font-semibold text-slate-100 mt-1">
                                                {centsToRand(pricingSummary.totalCents)}
                                            </p>
                                            <p className="text-sm text-slate-300 mt-1">Total for this booking</p>
                                        </div>
                                    ) : (
                                        <div className="text-right">
                                            <p className="text-sm text-slate-300">Per lesson</p>
                                            <p className="text-2xl font-semibold text-slate-100 mt-1">
                                                {details ? `R${details.price}` : "—"}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 rounded-2xl border border-amber-600/40 bg-amber-500/10 px-4 py-3">
                                    <p className="text-base text-amber-200 font-semibold">Payment is cash at the lesson.</p>
                                </div>

                                <label className="mt-4 flex items-start gap-3 text-sm text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={agree}
                                        onChange={(e) => setAgree(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 accent-sky-400"
                                    />
                                    <span>I understand this is a weekly class and I’m booking lessons according to the option selected above.</span>
                                </label>
                            </div>

                            {/* CTA */}
                            <div className="mt-5 flex flex-col md:flex-row items-stretch md:items-center gap-3">
                                <button
                                    type="button"
                                    disabled={!canSubmit}
                                    onClick={handleConfirmBooking}
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:bg-sky-600 disabled:cursor-not-allowed text-black font-semibold px-4 py-3 transition"
                                >
                                    {submitting ? "Confirming..." : token ? "Confirm booking" : "Sign up to book"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="md:w-auto inline-flex items-center justify-center rounded-2xl border border-slate-700 hover:border-sky-500 text-slate-200 px-4 py-3 transition"
                                >
                                    Back to classes
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <footer className="px-4 py-4 border-t border-slate-800 text-sm text-slate-400 text-center relative z-10">
                © {new Date().getFullYear()} Sumit. All rights reserved.
            </footer>
        </div>
    );
}
