// BookClassPage.tsx
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { API_BASE_URL } from "./config/api";
import TopBar from "./components/TopBar";
import { AUTH_CHANGED_EVENT } from "./utils/auth";

/** --------------------
 * Types
 * -------------------*/
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
    price: string;
    classAbout: string | null;
    classDates: string[]; // "YYYY-MM-DD"
};

type BookMode = "bundle" | "year";

type PaymentMethodSelectedEnum = "CASH" | "FREE_LESSON";

type BookClassDTO = {
    classId: number;
    weeklyBooking: boolean;
    numberOfSessionsBooked: number;
    numberFreeLessonsApplied: number;
    paymentMethodSelected: PaymentMethodSelectedEnum;
    firstClassDate: string; // "YYYY-MM-DD"
};


const API = {
    bookPage: (classId: number) => `${API_BASE_URL}/api/classes/book-group-class-page?classId=${classId}`,
    freeLessons: `${API_BASE_URL}/api/account/get-number-available-free-lessons`,
    bookClass: `${API_BASE_URL}/api/classes/book-group-class`,
    currentTime: `${API_BASE_URL}/api/classes/current-time`,
};

function formatTime(t: string) {
    if (!t) return "";
    return t.length >= 5 ? t.slice(0, 5) : t;
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

function isValidIsoDate(s: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
}

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

function toIsoDateUTC(year: number, month0: number, day: number) {
    return `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
}

function monthLabel(year: number, month0: number) {
    const dt = new Date(Date.UTC(year, month0, 1));
    return dt.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function startOfMonthUTC(year: number, month0: number) {
    return new Date(Date.UTC(year, month0, 1));
}

function daysInMonthUTC(year: number, month0: number) {
    return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

function weekdayIndexMon0(dtUTC: Date) {
    // JS: 0=Sun..6=Sat -> Mon=0..Sun=6
    const js = dtUTC.getUTCDay();
    return (js + 6) % 7;
}

function addMonths(year: number, month0: number, delta: number) {
    const dt = new Date(Date.UTC(year, month0 + delta, 1));
    return { year: dt.getUTCFullYear(), month0: dt.getUTCMonth() };
}

function clampInt(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, Math.floor(n)));
}

function isoOffsetFromOffsetDateTime(raw: string): string {
    const m = String(raw || "").match(/([+-]\d{2}:\d{2}|Z)$/);
    return m?.[1] || "+02:00";
}

function compareYM(aY: number, aM0: number, bY: number, bM0: number) {
    const a = aY * 12 + aM0;
    const b = bY * 12 + bM0;
    return a - b;
}

/** --------------------
 * Calendar
 * -------------------*/
type PagedCalendarProps = {
    minYear: number;
    minMonth0: number;
    maxYear: number;
    maxMonth0: number;

    viewYear: number;
    viewMonth0: number;
    setView: (y: number, m0: number) => void;

    classDateSet: Set<string>;
    bookedDateSet: Set<string>;

    // clickable dates (for start/end selection)
    clickableDateSet: Set<string>;

    selectedStart: string | null;
    selectedEnd: string | null;

    onPickDate: (iso: string) => void;
    isInteractive: boolean;
};

function PagedMonthCalendar(props: PagedCalendarProps) {
    const {
        minYear,
        minMonth0,
        maxYear,
        maxMonth0,
        viewYear,
        viewMonth0,
        setView,
        classDateSet,
        bookedDateSet,
        clickableDateSet,
        selectedStart,
        selectedEnd,
        onPickDate,
        isInteractive,
    } = props;

    const canPrev = compareYM(viewYear, viewMonth0, minYear, minMonth0) > 0;
    const canNext = compareYM(viewYear, viewMonth0, maxYear, maxMonth0) < 0;

    const first = startOfMonthUTC(viewYear, viewMonth0);
    const offset = weekdayIndexMon0(first);
    const dim = daysInMonthUTC(viewYear, viewMonth0);

    const cells: Array<{ iso: string | null; day: number | null }> = [];
    for (let i = 0; i < offset; i++) cells.push({ iso: null, day: null });
    for (let day = 1; day <= dim; day++) cells.push({ iso: toIsoDateUTC(viewYear, viewMonth0, day), day });
    while (cells.length % 7 !== 0) cells.push({ iso: null, day: null });

    const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
        <div className="rounded-3xl bg-white">
            {/* header */}
            <div className="px-4 py-2 border-b border-slate-200 flex items-center justify-between">
            <div>
                    <p className="text-lg font-semibold text-slate-900">{monthLabel(viewYear, viewMonth0)}</p>

                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={!canPrev}
                        onClick={() => {
                            if (!canPrev) return;
                            const prev = addMonths(viewYear, viewMonth0, -1);
                            setView(prev.year, prev.month0);
                        }}
                        className={[
                            "h-10 w-10 rounded-2xl border text-slate-700 flex items-center justify-center transition",
                            canPrev
                                ? "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
                                : "border-slate-100 bg-slate-50/60 text-slate-300 cursor-not-allowed",
                        ].join(" ")}
                        aria-label="Previous month"
                    >
                        ←
                    </button>

                    <button
                        type="button"
                        disabled={!canNext}
                        onClick={() => {
                            if (!canNext) return;
                            const next = addMonths(viewYear, viewMonth0, 1);
                            setView(next.year, next.month0);
                        }}
                        className={[
                            "h-10 w-10 rounded-2xl border text-slate-700 flex items-center justify-center transition",
                            canNext
                                ? "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
                                : "border-slate-100 bg-slate-50/60 text-slate-300 cursor-not-allowed",
                        ].join(" ")}
                        aria-label="Next month"
                    >
                        →
                    </button>
                </div>
            </div>

            {/* grid */}
            <div className="p-4">
                <div className="grid grid-cols-7 gap-2">
                    {dow.map((d) => (
                        <div key={d} className="text-[11px] uppercase tracking-wide text-slate-500 text-center font-semibold">
                            {d}
                        </div>
                    ))}

                    {cells.map((c, idx) => {
                        if (!c.iso) return <div key={`e-${idx}`} className="h-11 rounded-2xl" />;

                        const iso = c.iso;

                        const isClassDay = classDateSet.has(iso);
                        const isIncluded = bookedDateSet.has(iso);

                        if (!isClassDay) {
                            return (
                                <div
                                    key={iso}
                                    className="h-11 rounded-2xl border border-slate-200 bg-slate-100 text-slate-400 flex items-center justify-center text-sm font-semibold"
                                    title="No class"
                                >
                                    {c.day}
                                </div>
                            );
                        }

                        const isClickable = isInteractive && clickableDateSet.has(iso);

                        const isStart = !!selectedStart && selectedStart === iso;
                        const isEnd = !!selectedEnd && selectedEnd === iso;

                        const base =
                            "h-11 rounded-2xl border flex items-center justify-center text-sm font-semibold transition select-none";

                        const state = isIncluded
                            ? "border-emerald-800 bg-emerald-700 text-white shadow-[0_6px_16px_rgba(4,120,87,0.28)]"
                            : "border-sky-700 bg-sky-600 text-white shadow-[0_6px_16px_rgba(2,132,199,0.22)]";

                        const ringStart = isStart ? "ring-2 ring-slate-200" : "";
                        const ringEnd = isEnd ? "ring-2 ring-white" : "";

                        const clickable = isClickable
                            ? "cursor-pointer hover:brightness-[0.98]"
                            : "cursor-not-allowed opacity-95";

                        return (
                            <div
                                key={iso}
                                role="button"
                                tabIndex={isClickable ? 0 : -1}
                                onClick={() => {
                                    if (!isClickable) return;
                                    onPickDate(iso);
                                }}
                                onKeyDown={(e) => {
                                    if (!isClickable) return;
                                    if (e.key === "Enter" || e.key === " ") onPickDate(iso);
                                }}
                                className={[base, state, ringStart, ringEnd, clickable].join(" ")}
                                aria-disabled={!isClickable}
                            >
                                {c.day}
                            </div>
                        );
                    })}
                </div>

                {/* legend */}
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600 font-medium">
                    <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded-md border border-sky-700 bg-sky-600" />
                        Available
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded-md border border-emerald-700 bg-emerald-600" />
                        Included
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded-md border border-slate-200 bg-slate-100" />
                        No class
                    </span>
                </div>
            </div>
        </div>
    );
}

/** --------------------
 * Pending booking draft
 * -------------------*/
const PENDING_KEY = "pendingBooking";

function savePendingBooking(draft: any) {
    localStorage.setItem(PENDING_KEY, JSON.stringify(draft));
}

function loadPendingBooking(): any | null {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function clearPendingBooking() {
    localStorage.removeItem(PENDING_KEY);
}

/** --------------------
 * Page
 * -------------------*/
export default function BookClassPage() {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();

    const classId = Number(params.classId);

    const passedClass = (location.state as any)?.cls as ClassDTO | undefined;
    const [cls, setCls] = useState<ClassDTO | null>(passedClass ?? null);

    const [details, setDetails] = useState<GetBookClassPageDTO | null>(null);

    // server "now" for 24h rule
    const [serverNowRaw, setServerNowRaw] = useState<string | null>(null);

    // auth
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const userRole = (localStorage.getItem("userRole") || "student") as "student" | "tutor" | "admin";

    const [restoredPending, setRestoredPending] = useState(false);

    // free lessons
    const [freeLessonsAvailable, setFreeLessonsAvailable] = useState<number>(0);
    const [freeToUse, setFreeToUse] = useState<number>(0);

    const [loading, setLoading] = useState(false);
    const [topError, setTopError] = useState<string | null>(null);

    // ✅ default to Custom + 1
    const [mode, setMode] = useState<BookMode>("bundle");
    const [bundleCount, setBundleCount] = useState<number>(1);

    const [agree, setAgree] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [includedOpen, setIncludedOpen] = useState(false);
    const [howToOpen, setHowToOpen] = useState(false);


    // start date is normally forced to nextDate; only selectable in the 24h special case
    const [firstClassDate, setFirstClassDate] = useState<string | null>(null);

    // calendar view
    const [viewYear, setViewYear] = useState<number>(new Date().getUTCFullYear());
    const [viewMonth0, setViewMonth0] = useState<number>(new Date().getUTCMonth());

    // scroll restore defense (iOS)
    useEffect(() => {
        try {
            if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
        } catch {}
        window.scrollTo(0, 0);
        setTimeout(() => window.scrollTo(0, 0), 0);
    }, [classId]);

    useEffect(() => {
        if (passedClass) setCls(passedClass);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const authHeaders = useMemo(() => {
        const h: Record<string, string> = { "Content-Type": "application/json" };
        if (token) h.Authorization = `Bearer ${token}`;
        return h;
    }, [token]);

    // server current time
    useEffect(() => {
        const run = async () => {
            try {
                const res = await fetch(API.currentTime, { headers: { "Content-Type": "application/json" } });
                if (!res.ok) return;
                const raw = await res.json();
                setServerNowRaw(String(raw));
            } catch {
                setServerNowRaw(null);
            }
        };
        run();
    }, []);

    // restore pending
    useEffect(() => {
        const p = loadPendingBooking();
        if (!p) return;
        if (Number(p?.classId) !== classId) return;

        setRestoredPending(true);

        if (p?.cls) setCls(p.cls);
        if (p?.mode === "bundle" || p?.mode === "year") setMode(p.mode);
        if (Number.isFinite(p?.bundleCount)) setBundleCount(p.bundleCount);
        if (typeof p?.firstClassDate === "string") setFirstClassDate(p.firstClassDate);
        if (Number.isFinite(p?.freeToUse)) setFreeToUse(p.freeToUse);
        if (typeof p?.agree === "boolean") setAgree(p.agree);

        if (Number.isFinite(p?.viewYear) && Number.isFinite(p?.viewMonth0)) {
            setViewYear(p.viewYear);
            setViewMonth0(p.viewMonth0);
        }
    }, [classId]);

    // booking details
    useEffect(() => {
        const run = async () => {
            if (!Number.isFinite(classId) || classId <= 0) {
                setTopError("Invalid class id.");
                return;
            }

            setLoading(true);
            setTopError(null);

            try {
                const res = await fetch(API.bookPage(classId), { headers: { "Content-Type": "application/json" } });

                if (!res.ok) {
                    const t = await res.text().catch(() => "");
                    throw new Error(t || `Failed to load booking details (${res.status})`);
                }

                const raw = await res.json();

                const datesRaw = (raw as any)?.classDates;
                const classDates: string[] = Array.isArray(datesRaw)
                    ? datesRaw.map((d: any) => String(d)).filter((s: string) => isValidIsoDate(s))
                    : [];

                const normalized: GetBookClassPageDTO = {
                    groupClassId: Number((raw as any)?.groupClassId ?? classId),
                    price: String((raw as any)?.price ?? ""),
                    classAbout: (raw as any)?.classAbout ?? null,
                    classDates,
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

    // free lessons
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

                const raw = await res.json();
                const n = Number(raw ?? 0);
                const safe = Number.isFinite(n) ? Math.max(0, n) : 0;

                setFreeLessonsAvailable(safe);

                setFreeToUse((prev) => {
                    if (restoredPending) return clampInt(prev, 0, safe);
                    return safe > 0 ? 1 : 0;
                });
            } catch (e) {
                console.error("Failed to fetch free lessons:", e);
                setFreeLessonsAvailable(0);
                setFreeToUse(0);
            }
        };

        run();
    }, [token, authHeaders, restoredPending]);

    const hasFreeLessons = !!token && freeLessonsAvailable > 0;

    const priceCents = useMemo(() => parseMoneyToCents(details?.price || ""), [details?.price]);

    /** ---- Dates ---- */
    const upcomingDates = useMemo(() => (details?.classDates ?? []).filter(isValidIsoDate), [details?.classDates]);
    const classDateSet = useMemo(() => new Set<string>(upcomingDates), [upcomingDates]);

    // bounds
    const bounds = useMemo(() => {
        const now = new Date();
        let minY = now.getUTCFullYear();
        let minM0 = now.getUTCMonth();
        let maxY = now.getUTCFullYear();
        let maxM0 = now.getUTCMonth();

        if (upcomingDates.length) {
            const first = upcomingDates[0];
            const last = upcomingDates[upcomingDates.length - 1];

            const [fy, fm] = first.split("-").map((x) => Number(x));
            const [ly, lm] = last.split("-").map((x) => Number(x));

            if (fy && fm) {
                minY = fy;
                minM0 = fm - 1;
            }
            if (ly && lm) {
                maxY = ly;
                maxM0 = lm - 1;
            }
        }

        if (minY * 12 + minM0 > maxY * 12 + maxM0) {
            maxY = minY;
            maxM0 = minM0;
        }

        return { minY, minM0, maxY, maxM0 };
    }, [upcomingDates]);

    useEffect(() => {
        setViewYear(bounds.minY);
        setViewMonth0(bounds.minM0);
    }, [bounds.minY, bounds.minM0]);

    const nextDate = upcomingDates[0] || null;
    const followingDate = upcomingDates[1] || null;

    const serverNow = useMemo(() => {
        if (!serverNowRaw) return null;
        const dt = new Date(serverNowRaw);
        return Number.isNaN(dt.getTime()) ? null : dt;
    }, [serverNowRaw]);

    const serverOffset = useMemo(() => (serverNowRaw ? isoOffsetFromOffsetDateTime(serverNowRaw) : "+02:00"), [
        serverNowRaw,
    ]);

    // 24h special case
    const canChooseFollowingAsFirst = useMemo(() => {
        if (!nextDate || !followingDate) return false;
        if (!cls?.startTime) return false;
        if (!serverNow) return false;

        const startHHmm = formatTime(cls.startTime) || "00:00";
        const nextClassIso = `${nextDate}T${startHHmm}:00${serverOffset}`;
        const nextClassDt = new Date(nextClassIso);
        if (Number.isNaN(nextClassDt.getTime())) return false;

        const diffMs = nextClassDt.getTime() - serverNow.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours > 0 && diffHours <= 24;
    }, [nextDate, followingDate, cls?.startTime, serverNow, serverOffset]);

    // start is normally forced to nextDate
    useEffect(() => {
        if (!nextDate) {
            setFirstClassDate(null);
            return;
        }

        setFirstClassDate((prev) => {
            // If user already chose following in the 24h special case, keep it valid
            if (canChooseFollowingAsFirst && prev && (prev === nextDate || prev === followingDate)) return prev;
            return nextDate;
        });
    }, [nextDate, followingDate, canChooseFollowingAsFirst]);

    const startIndex = useMemo(() => {
        if (!firstClassDate) return -1;
        return upcomingDates.indexOf(firstClassDate);
    }, [upcomingDates, firstClassDate]);

    const remainingCount = useMemo(() => {
        if (startIndex < 0) return 0;
        return upcomingDates.length - startIndex;
    }, [upcomingDates.length, startIndex]);

    const bundleMax = useMemo(() => Math.max(1, Math.min(52, remainingCount || 1)), [remainingCount]);

    // clamp bundleCount
    useEffect(() => {
        setBundleCount((prev) => clampInt(prev, 1, bundleMax));
    }, [bundleMax]);

    // derived end date from bundleCount (this is the "single truth" for custom)
    const endClassDate = useMemo(() => {
        if (mode !== "bundle") return null;
        if (startIndex < 0) return null;
        const idx = startIndex + clampInt(bundleCount || 1, 1, bundleMax) - 1;
        return upcomingDates[idx] || null;
    }, [mode, startIndex, upcomingDates, bundleCount, bundleMax]);

    // bookedDateSet
    const bookedDateSet = useMemo(() => {
        const s = new Set<string>();
        if (!details || !upcomingDates.length) return s;

        if (mode === "year") {
            for (const d of upcomingDates) s.add(d);
            return s;
        }

        if (!firstClassDate || startIndex < 0) return s;

        const n = clampInt(bundleCount || 1, 1, bundleMax);
        for (const d of upcomingDates.slice(startIndex, startIndex + n)) s.add(d);
        return s;
    }, [details, upcomingDates, mode, firstClassDate, startIndex, bundleCount, bundleMax]);

    // how many lessons are selected (for display)
    const selectedCount = useMemo(() => {
        if (mode === "year") return upcomingDates.length;
        return clampInt(bundleCount || 1, 1, bundleMax);
    }, [mode, upcomingDates.length, bundleCount, bundleMax]);

    // free cap
    const freeCap = useMemo(() => {
        if (!hasFreeLessons) return 0;
        if (mode === "year") return freeLessonsAvailable;
        return Math.min(freeLessonsAvailable, selectedCount);
    }, [hasFreeLessons, mode, freeLessonsAvailable, selectedCount]);

    useEffect(() => {
        setFreeToUse((prev) => clampInt(prev, 0, freeCap));
    }, [freeCap]);

    // calendar interaction:
    // - Weekly: not interactive
    // - Custom:
    //   - End dates are clickable from start onward
    //   - Start selection only possible when canChooseFollowingAsFirst === true (tap next or following)
    const calendarInteractive = mode === "bundle";

    const startChoiceSet = useMemo(() => {
        const s = new Set<string>();
        if (!calendarInteractive) return s;
        if (!canChooseFollowingAsFirst) return s;
        if (nextDate) s.add(nextDate);
        if (followingDate) s.add(followingDate);
        return s;
    }, [calendarInteractive, canChooseFollowingAsFirst, nextDate, followingDate]);

    const endChoiceSet = useMemo(() => {
        const s = new Set<string>();
        if (!calendarInteractive) return s;
        if (startIndex < 0) return s;
        for (const d of upcomingDates.slice(startIndex)) s.add(d);
        return s;
    }, [calendarInteractive, startIndex, upcomingDates]);

    const clickableDateSet = useMemo(() => {
        const s = new Set<string>();
        if (!calendarInteractive) return s;
        // end always clickable from start onward
        for (const d of endChoiceSet) s.add(d);
        // start choices only in special case
        for (const d of startChoiceSet) s.add(d);
        return s;
    }, [calendarInteractive, endChoiceSet, startChoiceSet]);

    const handlePickCalendarDate = (iso: string) => {
        if (!calendarInteractive) return;
        if (!classDateSet.has(iso)) return;

        // Start selection only allowed in 24h special case
        if (startChoiceSet.has(iso)) {
            setFirstClassDate(iso);
            return;
        }

        // Otherwise treat as end selection:
        if (!firstClassDate) return;

        const a = upcomingDates.indexOf(firstClassDate);
        const b = upcomingDates.indexOf(iso);
        if (a < 0 || b < 0) return;
        if (b < a) return;

        const clickedCount = b - a + 1;

        // ✅ TOGGLE: if they click the CURRENT end date, shrink by 1 (min 1)
        // Example: start=day1, end=day3 (count=3). Tap day3 -> count becomes 2.
        if (endClassDate === iso) {
            setBundleCount((prev) => clampInt((prev || 1) - 1, 1, bundleMax));
            return;
        }

        // Normal behavior: set count based on clicked end date
        setBundleCount(clampInt(clickedCount, 1, bundleMax));
    };


    useEffect(() => {
        const refreshToken: EventListener = () => setToken(localStorage.getItem("token"));
        window.addEventListener(AUTH_CHANGED_EVENT, refreshToken);

        const onStorage = (e: StorageEvent) => {
            if (e.key === "token") refreshToken(new Event(AUTH_CHANGED_EVENT));
        };
        window.addEventListener("storage", onStorage);

        return () => {
            window.removeEventListener(AUTH_CHANGED_EVENT, refreshToken);
            window.removeEventListener("storage", onStorage);
        };
    }, []);

    useLayoutEffect(() => {
        try {
            if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
        } catch {}
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        requestAnimationFrame(() => {
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        });
    }, [location.key, classId]);

    useEffect(() => {
        const onPageShow = (e: PageTransitionEvent) => {
            if (e.persisted) {
                window.scrollTo({ top: 0, left: 0, behavior: "auto" });
                requestAnimationFrame(() => {
                    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
                });
            }
        };
        window.addEventListener("pageshow", onPageShow);
        return () => window.removeEventListener("pageshow", onPageShow);
    }, []);

    // pricing
    const pricingSummary = useMemo(() => {
        if (!details) return { totalCents: 0, freeApplied: 0, paidLessons: 0, totalLessons: 0, yearNote: "" };

        if (mode === "year") {
            const freeApplied = clampInt(freeToUse, 0, freeCap);
            const yearNote =
                freeApplied > 0 ? `You’ll use ${freeApplied} free lesson${freeApplied === 1 ? "" : "s"} first.` : "";
            return { totalCents: 0, freeApplied, paidLessons: 0, totalLessons: 0, yearNote };
        }

        const totalLessons = selectedCount;
        const freeApplied = clampInt(freeToUse, 0, Math.min(freeCap, totalLessons));
        const paidLessons = Math.max(0, totalLessons - freeApplied);
        const totalCents = paidLessons * priceCents;

        return { totalCents, freeApplied, paidLessons, totalLessons, yearNote: "" };
    }, [details, mode, freeToUse, freeCap, selectedCount, priceCents]);

    const summaryLine = useMemo(() => {
        if (!details) return null;

        if (mode === "year") {
            return pricingSummary.yearNote ? (
                <div className="text-sm text-slate-600 font-medium">{pricingSummary.yearNote}</div>
            ) : (
                <div className="text-sm text-slate-600 font-medium">
                    <span className="font-semibold text-slate-900">{selectedCount}</span> classes selected
                </div>
            );
        }

        const free = pricingSummary.freeApplied;
        const paid = pricingSummary.paidLessons;

        if (free > 0) {
            return (
                <div className="text-sm text-slate-600 font-medium">
                    <span className="font-semibold text-rose-700">{free} free, </span>
                    <span className="font-semibold text-slate-900">{paid} paid</span> lesson
                    {pricingSummary.totalLessons === 1 ? "" : "s"}
                </div>
            );
        }
        return (
            <div className="text-sm text-slate-600 font-medium">
                <span className="font-semibold text-slate-900">{paid} paid</span> lesson
                {pricingSummary.totalLessons === 1 ? "" : "s"}
            </div>
        );
    }, [details, mode, pricingSummary, selectedCount]);

    const canSubmit = useMemo(() => {
        if (!details) return false;
        if (!agree) return false;
        if (submitting) return false;
        if (!token) return true;

        if (mode === "bundle") {
            if (!firstClassDate) return false;
            // Start date is valid if it's nextDate OR (in 24h case) followingDate
            if (!nextDate) return false;

            if (!canChooseFollowingAsFirst) {
                if (firstClassDate !== nextDate) return false;
            } else {
                if (firstClassDate !== nextDate && firstClassDate !== followingDate) return false;
            }
        }

        return true;
    }, [details, agree, submitting, token, mode, firstClassDate, nextDate, followingDate, canChooseFollowingAsFirst]);

    const handleConfirmBooking = async () => {
        if (!details) return;

        if (!token) {
            savePendingBooking({
                classId,
                cls,
                mode,
                bundleCount,
                freeToUse,
                agree,
                firstClassDate,
                viewYear,
                viewMonth0,
            });

            navigate("/signup", { state: { returnTo: `/book-class/${classId}` } });
            return;
        }

        if (mode === "bundle") {
            if (!firstClassDate) {
                setTopError("No valid start date found.");
                return;
            }
        }

        const safeFreeToUse = clampInt(freeToUse || 0, 0, freeCap);
        const safeBundle = clampInt(bundleCount || 1, 1, bundleMax);

        const payload: BookClassDTO = {
            classId: details.groupClassId ?? classId,
            weeklyBooking: mode === "year",
            numberOfSessionsBooked: mode === "bundle" ? safeBundle : 0,
            numberFreeLessonsApplied: safeFreeToUse,
            paymentMethodSelected: "CASH", // cash at lesson (your UI text)
            firstClassDate: firstClassDate || nextDate || upcomingDates[0] || "",
        };


        if (!isValidIsoDate(payload.firstClassDate)) {
            setTopError("No valid upcoming class date found.");
            return;
        }

        setSubmitting(true);
        setTopError(null);

        try {
            const res = await fetch(API.bookClass, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify(payload),
            });

            if (res.status === 401 || res.status === 403) {
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
            clearPendingBooking();
            navigate(`/dashboard/${userRole}`);
        } catch (e: any) {
            console.error(e);
            setTopError(e?.message || "Failed to book. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 overflow-x-hidden">
            <TopBar />

            <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
                <div className="max-w-5xl mx-auto">
                    {topError && (
                        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-semibold">
                            {topError}
                        </div>
                    )}

                    <div className="mt-5">
                        <div className="max-w-3xl mx-auto">
                            <div className="space-y-4">
                                {/* ✅ ONE merged card */}
                                <div className="rounded-3xl border border-black bg-white p-5 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-extrabold">Booking</h2>
                                        <div className="text-sm text-slate-600 font-semibold">
                                            {loading ? "Loading…" : details ? `R${details.price} per lesson` : ""}
                                        </div>
                                    </div>

                                    {/* How booking works (fills the space under "Booking") */}
                                    <div className="mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setHowToOpen((v) => !v)}
                                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
                                            aria-expanded={howToOpen}
                                        >
                                            How To Book
                                            <svg
                                                className={`h-4 w-4 text-slate-500 transition-transform ${howToOpen ? "rotate-180" : ""}`}
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                            >
                                                <path d="M6 9l6 6 6-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>

                                        {howToOpen && (
                                            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed font-medium">
                                                <ol className="list-decimal pl-5 space-y-1">
                                                    <li>
                                                        To book a class <span className="font-semibold">indefinitely</span>, select{" "}
                                                        <span className="font-semibold">Weekly</span>. This automatically books the class
                                                        every week. Cancel at any time.
                                                    </li>

                                                    <li>
                                                        To book a <span className="font-semibold">set number of lessons</span>, select{" "}
                                                        <span className="font-semibold">Custom</span> and choose the number of lessons,
                                                        or tap directly on the calendar to select an end date.
                                                    </li>

                                                    <li>
                                                        If you are new, you will receive your{" "}
                                                        <span className="font-semibold">free lesson</span> after signing up.
                                                    </li>

                                                </ol>
                                            </div>
                                        )}
                                    </div>


                                    {/* Calendar FIRST */}
                                    <div className="mt-0">
                                        {loading || !details ? (
                                            <div className="text-slate-600 font-semibold">Loading calendar…</div>
                                        ) : (
                                            <PagedMonthCalendar
                                                minYear={bounds.minY}
                                                minMonth0={bounds.minM0}
                                                maxYear={bounds.maxY}
                                                maxMonth0={bounds.maxM0}
                                                viewYear={viewYear}
                                                viewMonth0={viewMonth0}
                                                setView={(y, m0) => {
                                                    setViewYear(y);
                                                    setViewMonth0(m0);
                                                }}
                                                classDateSet={classDateSet}
                                                bookedDateSet={bookedDateSet}
                                                clickableDateSet={clickableDateSet}
                                                selectedStart={mode === "bundle" ? firstClassDate : null}
                                                selectedEnd={mode === "bundle" ? endClassDate : null}
                                                onPickDate={handlePickCalendarDate}
                                                isInteractive={calendarInteractive}
                                            />
                                        )}
                                    </div>

                                    {/* Toggle UNDER calendar */}
                                    <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex flex-col gap-3">
                                            {/* segmented toggle (LEFT) */}
                                            <div className="inline-flex w-fit rounded-2xl border border-slate-200 bg-white p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setMode("year")}
                                                    className={[
                                                        "px-3 py-2 rounded-2xl text-sm font-semibold transition",
                                                        mode === "year" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50",
                                                    ].join(" ")}
                                                >
                                                    Weekly
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setMode("bundle")}
                                                    className={[
                                                        "px-3 py-2 rounded-2xl text-sm font-semibold transition",
                                                        mode === "bundle" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50",
                                                    ].join(" ")}
                                                >
                                                    Custom
                                                </button>
                                            </div>

                                            {/* current mode title */}
                                            {mode === "year" && (
                                                <p className="text-base font-bold text-slate-900">
                                                    auto-recurring, cancel at anytime.
                                                </p>
                                            )}
                                        </div>


                                        {/* Custom count box (always synced with calendar) */}
                                        {mode === "bundle" && (
                                            <div className="mt-4">
                                                <div>
                                                    <label className="text-sm font-semibold text-slate-800 mb-2 block">
                                                        Number of lessons
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={bundleMax}
                                                        step={1}
                                                        value={bundleCount}
                                                        onChange={(e) =>
                                                            setBundleCount(clampInt(Number(e.target.value) || 1, 1, bundleMax))
                                                        }
                                                        className="w-32 rounded-2xl border-2 border-black bg-white px-4 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 font-semibold"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Included */}
                                <div className="rounded-3xl border border-black bg-white p-5 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                                    <button
                                        type="button"
                                        onClick={() => setIncludedOpen((v) => !v)}
                                        className="w-full text-left rounded-3xl bg-slate-50 hover:bg-slate-100 transition p-4"
                                        aria-expanded={includedOpen}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-base font-extrabold text-slate-900">
                                                    Included with this class
                                                </p>
                                            </div>

                                            <svg
                                                className={`h-5 w-5 text-slate-500 transition-transform ${
                                                    includedOpen ? "rotate-180" : ""
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
                                        </div>

                                        {includedOpen && (
                                            <div className="mt-3 text-sm text-slate-700 leading-relaxed font-medium">
                                                {details?.classAbout ||
                                                    "The lecturer provides resources like notes, worked examples, and past paper questions for students."}
                                            </div>
                                        )}
                                    </button>
                                </div>

                                {/* Summary */}
                                <div className="mt-4 rounded-3xl border border-black bg-white p-5 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                        <p className="text-base font-extrabold text-slate-900">Summary</p>
                                        <div className="mt-1">{summaryLine}</div>

                                        {details && mode === "bundle" ? (
                                            <div className="mt-3 flex items-end justify-between">
                                                <div className="text-sm text-slate-600 font-medium">
                                                    Total for this booking
                                                </div>
                                                <div className="text-2xl font-extrabold text-slate-900">
                                                    {centsToRand(pricingSummary.totalCents)}
                                                </div>
                                            </div>
                                        ) : null}

                                        {/* Free lessons */}
                                        {hasFreeLessons && details && (
                                            <div className="mt-4 rounded-3xl border-2 border-rose-500 bg-rose-50 px-5 py-4">
                                                {freeLessonsAvailable === 1 ? (
                                                    <label className="flex items-start justify-between gap-4 text-sm text-slate-800">
                                                        <div>
                                                            <p className="font-semibold text-rose-800">
                                                                You have 1 free lesson available
                                                            </p>
                                                            <p className="text-slate-700 mt-1 font-medium">
                                                                Use it for this booking?
                                                            </p>
                                                        </div>

                                                        <input
                                                            type="checkbox"
                                                            checked={freeToUse >= 1}
                                                            onChange={(e) => setFreeToUse(e.target.checked ? 1 : 0)}
                                                            className="mt-1 h-4 w-4 accent-rose-600"
                                                        />
                                                    </label>
                                                ) : (
                                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                        <div>
                                                            <p className="font-semibold text-rose-800">
                                                                You have {freeLessonsAvailable} free lessons available
                                                            </p>
                                                            <p className="text-sm text-slate-700 mt-1 font-medium">
                                                                How many do you want to use?
                                                            </p>
                                                        </div>

                                                        <div className="w-full md:w-44">
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={freeCap}
                                                                value={freeToUse}
                                                                onChange={(e) =>
                                                                    setFreeToUse(clampInt(Number(e.target.value) || 0, 0, freeCap))
                                                                }
                                                                className="w-full rounded-2xl border-2 border-rose-500 bg-white px-4 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 font-semibold"
                                                            />
                                                            <p className="text-xs text-slate-700 mt-1 font-medium">
                                                                Max: {freeCap}
                                                                {mode === "bundle" ? " (based on classes selected)" : ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Payment note */}
                                        <div className="mt-4 rounded-2xl border-2 border-teal-500 bg-teal-100 px-4 py-3">
                                            <p className="text-sm font-semibold text-slate-900">Payment is cash at lesson, after each lesson</p>
                                        </div>

                                        <label className="mt-4 flex items-start gap-3 text-sm text-slate-700 font-medium">
                                            <input
                                                type="checkbox"
                                                checked={agree}
                                                onChange={(e) => setAgree(e.target.checked)}
                                                className="mt-0.5 h-4 w-4 accent-slate-900"
                                            />
                                            <span>I confirm that I have read and accepted the Terms & Conditions.</span>
                                        </label>

                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                disabled={!canSubmit}
                                                onClick={handleConfirmBooking}
                                                className="w-full inline-flex items-center justify-center rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold px-4 py-3 transition"
                                            >
                                                {submitting ? "Confirming..." : token ? "Confirm booking" : "Sign up to book"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="px-4 py-5 border-t border-slate-200 text-sm text-slate-600 text-center font-medium">
                © {new Date().getFullYear()} Sumit. All rights reserved.
            </footer>
        </div>
    );
}
