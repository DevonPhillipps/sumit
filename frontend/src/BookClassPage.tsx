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

type BookMode = "package" | "year";
type PackageDeal = "single" | "month1" | "month3";

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

function normalizeDay(raw: string) {
    if (!raw) return "";
    const s = raw.toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
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

function ymKey(y: number, m0: number) {
    return `${y}-${pad2(m0 + 1)}`;
}

function isoTodayInZA(dt: Date) {
    return dt.toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" }); // YYYY-MM-DD
}

function isoMonthKeyFromIsoDate(iso: string) {
    return iso.slice(0, 7);
}

function addMonthsToIsoUTC(iso: string, months: number): string {
    if (!isValidIsoDate(iso)) return iso;
    const [y, m, d] = iso.split("-").map((x) => Number(x));
    const dt = new Date(Date.UTC(y, (m || 1) - 1 + months, d || 1));
    const yy = dt.getUTCFullYear();
    const mm = dt.getUTCMonth();
    const dd = dt.getUTCDate();
    return `${yy}-${pad2(mm + 1)}-${pad2(dd)}`;
}

function prettyDayMonth(iso: string | null) {
    if (!iso || !isValidIsoDate(iso)) return "—";
    const [y, m, d] = iso.split("-").map((x) => Number(x));
    const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
    return dt.toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "long" }); // "23 February"
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

    minVisibleIso: string | null;
    monthsWithClasses: Set<string>; // keys: "YYYY-MM"
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
        minVisibleIso,
        monthsWithClasses,
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

    const jumpMonth = (delta: 1 | -1) => {
        if (delta === -1 && !canPrev) return;
        if (delta === 1 && !canNext) return;

        let y = viewYear;
        let m0 = viewMonth0;

        for (let i = 0; i < 36; i++) {
            const next = addMonths(y, m0, delta);
            y = next.year;
            m0 = next.month0;

            if (compareYM(y, m0, minYear, minMonth0) < 0) break;
            if (compareYM(y, m0, maxYear, maxMonth0) > 0) break;

            const key = ymKey(y, m0);
            if (monthsWithClasses.has(key)) {
                setView(y, m0);
                return;
            }
        }

        const step = addMonths(viewYear, viewMonth0, delta);
        if (compareYM(step.year, step.month0, minYear, minMonth0) < 0) return;
        if (compareYM(step.year, step.month0, maxYear, maxMonth0) > 0) return;
        setView(step.year, step.month0);
    };

    return (
        <div className="rounded-3xl border border-black bg-white shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
            {/* header */}
            <div className="px-4 py-3 border-b border-black/10 flex items-center justify-between">
                <div>
                    <p className="text-lg font-extrabold text-black">{monthLabel(viewYear, viewMonth0)}</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={!canPrev}
                        onClick={() => jumpMonth(-1)}
                        className={[
                            "h-10 w-10 rounded-2xl border-2 text-black flex items-center justify-center transition font-extrabold",
                            canPrev ? "border-black bg-white hover:bg-black/5" : "border-black/10 bg-white/60 opacity-40 cursor-not-allowed",
                        ].join(" ")}
                        aria-label="Previous month"
                        title={canPrev ? "Previous month" : "No earlier months"}
                    >
                        ←
                    </button>

                    <button
                        type="button"
                        disabled={!canNext}
                        onClick={() => jumpMonth(1)}
                        className={[
                            "h-10 w-10 rounded-2xl border-2 text-black flex items-center justify-center transition font-extrabold",
                            canNext ? "border-black bg-white hover:bg-black/5" : "border-black/10 bg-white/60 opacity-40 cursor-not-allowed",
                        ].join(" ")}
                        aria-label="Next month"
                        title={canNext ? "Next month" : "No later months"}
                    >
                        →
                    </button>
                </div>
            </div>

            {/* legend */}
            <div className="px-4 py-3 border-b border-black/10 flex flex-wrap gap-4 text-xs font-extrabold text-black">
                <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-md bg-sky-600" />
                    Available
                </span>

                            <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-md bg-emerald-700" />
                    Included
                </span>

                            <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-md bg-black/5 border border-black/10" />
                    No class
                </span>
            </div>

            {/* note */}
            <div className="px-4 pb-3 -mt-1 text-[12px] font-extrabold text-black">
                This calendar is display-only — you can’t press on it.
            </div>

            {/* grid */}
            <div className="p-4">
                <div className="grid grid-cols-7 gap-2">
                    {dow.map((d) => (
                        <div key={d} className="text-[11px] uppercase tracking-wide text-black text-center font-extrabold opacity-70">
                            {d}
                        </div>
                    ))}

                    {cells.map((c, idx) => {
                        // empty filler cells (no outline)
                        if (!c.iso) return <div key={`e-${idx}`} className="h-11 rounded-2xl" />;

                        const iso = c.iso;

                        // hidden before min visible (no outline)
                        if (minVisibleIso && iso < minVisibleIso) {
                            return <div key={iso} className="h-11 rounded-2xl" />;
                        }

                        const isClassDay = classDateSet.has(iso);
                        const isIncluded = bookedDateSet.has(iso);

                        // non-class day = grey filled
                        if (!isClassDay) {
                            return (
                                <div
                                    key={iso}
                                    className="h-11 rounded-2xl bg-black/5 text-black/40 flex items-center justify-center text-sm font-extrabold"
                                    title="No class"
                                >
                                    {c.day}
                                </div>
                            );
                        }

                        const base = "h-11 rounded-2xl flex items-center justify-center text-sm font-extrabold select-none";

                        // Available = BLUE FILLED
                        const available =
                            "bg-sky-600 text-white shadow-[0_10px_22px_rgba(2,132,199,0.22)]";
                        // Included = GREEN FILLED
                        const included =
                            "bg-emerald-700 text-white shadow-[0_10px_22px_rgba(4,120,87,0.22)]";

                        return (
                            <div
                                key={iso}
                                className={[base, isIncluded ? included : available, "cursor-default"].join(" ")}
                                title={isIncluded ? "Included in your booking" : "Available class day"}
                            >
                                {c.day}
                            </div>
                        );
                    })}
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

    const [serverNowRaw, setServerNowRaw] = useState<string | null>(null);

    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const userRole = (localStorage.getItem("userRole") || "student") as "student" | "tutor" | "admin";

    const [restoredPending, setRestoredPending] = useState(false);

    const [freeLessonsAvailable, setFreeLessonsAvailable] = useState<number>(0);
    const [freeToUse, setFreeToUse] = useState<number>(0);

    const [loading, setLoading] = useState(false);
    const [topError, setTopError] = useState<string | null>(null);
    const [successOpen, setSuccessOpen] = useState(false);

    const [mode, setMode] = useState< BookMode >("package");
    const [deal, setDeal] = useState< PackageDeal >("month1");

    const [agree, setAgree] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [includedOpen, setIncludedOpen] = useState(false);
    const [classDetailsOpen, setClassDetailsOpen] = useState(false);

    const [firstClassDate, setFirstClassDate] = useState<string | null>(null);

    const [viewYear, setViewYear] = useState<number>(new Date().getUTCFullYear());
    const [viewMonth0, setViewMonth0] = useState<number>(new Date().getUTCMonth());

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
        if (p?.mode === "package" || p?.mode === "year") setMode(p.mode);
        if (p?.deal === "single" || p?.deal === "month1" || p?.deal === "month3") setDeal(p.deal);
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

    const priceCents = useMemo(() => parseMoneyToCents(details?.price || ""), [details?.price]);

    /** ---- Dates ---- */
    const upcomingDates = useMemo(() => (details?.classDates ?? []).filter(isValidIsoDate), [details?.classDates]);
    const classDateSet = useMemo(() => new Set<string>(upcomingDates), [upcomingDates]);

    // serverNow parsed
    const serverNow = useMemo(() => {
        if (!serverNowRaw) return null;
        const dt = new Date(serverNowRaw);
        return Number.isNaN(dt.getTime()) ? null : dt;
    }, [serverNowRaw]);

    const serverOffset = useMemo(() => (serverNowRaw ? isoOffsetFromOffsetDateTime(serverNowRaw) : "+02:00"), [serverNowRaw]);

    const todayIsoZA = useMemo(() => {
        const dt = serverNow ?? new Date();
        const iso = isoTodayInZA(dt);
        return isValidIsoDate(iso) ? iso : null;
    }, [serverNow]);

    // bounds (min/max months based on class dates)
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

    // start calendar view from TODAY (ZA) but clamp to bounds
    useEffect(() => {
        const base = todayIsoZA;
        if (base && isValidIsoDate(base)) {
            const [yy, mm] = base.split("-").map((x) => Number(x));
            let y = yy;
            let m0 = (mm || 1) - 1;

            if (compareYM(y, m0, bounds.minY, bounds.minM0) < 0) {
                y = bounds.minY;
                m0 = bounds.minM0;
            }
            if (compareYM(y, m0, bounds.maxY, bounds.maxM0) > 0) {
                y = bounds.maxY;
                m0 = bounds.maxM0;
            }

            setViewYear(y);
            setViewMonth0(m0);
            return;
        }

        // fallback
        setViewYear(bounds.minY);
        setViewMonth0(bounds.minM0);
    }, [todayIsoZA, bounds.minY, bounds.minM0, bounds.maxY, bounds.maxM0]);

    const nextDate = upcomingDates[0] || null;
    const followingDate = upcomingDates[1] || null;

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

    // Auto-pick first class date (no clicking)
    useEffect(() => {
        if (!nextDate) {
            setFirstClassDate(null);
            return;
        }

        const autoFirst = canChooseFollowingAsFirst ? (followingDate || nextDate) : nextDate;

        setFirstClassDate((prev) => {
            if (prev && classDateSet.has(prev)) return prev;
            return autoFirst;
        });
    }, [nextDate, followingDate, canChooseFollowingAsFirst, classDateSet]);

    // build booked set from mode/deal
    const bookedDateSet = useMemo(() => {
        const s = new Set<string>();
        if (!upcomingDates.length) return s;

        if (mode === "year") {
            for (const d of upcomingDates) s.add(d);
            return s;
        }

        const first = firstClassDate || nextDate || upcomingDates[0] || null;
        if (!first) return s;

        if (deal === "single") {
            if (classDateSet.has(first)) s.add(first);
            return s;
        }

        const months = deal === "month1" ? 1 : 3;
        const endExclusive = addMonthsToIsoUTC(first, months);

        for (const d of upcomingDates) {
            if (d < first) continue;
            if (d >= endExclusive) break;
            s.add(d);
        }

        if (!s.size && classDateSet.has(first)) s.add(first);
        return s;
    }, [mode, deal, upcomingDates, firstClassDate, nextDate, classDateSet]);

    const selectedDatesSorted = useMemo(() => Array.from(bookedDateSet).sort(), [bookedDateSet]);

    const selectedCount = useMemo(() => {
        if (mode === "year") return upcomingDates.length;
        return selectedDatesSorted.length;
    }, [mode, upcomingDates.length, selectedDatesSorted.length]);

    const endClassDate = useMemo(() => {
        if (mode === "year") return upcomingDates[upcomingDates.length - 1] || null;
        return selectedDatesSorted.length ? selectedDatesSorted[selectedDatesSorted.length - 1] : null;
    }, [mode, upcomingDates, selectedDatesSorted]);

    // "first" shown in summary for both modes
    const summaryFirst = useMemo(() => {
        if (mode === "year") return nextDate;
        return firstClassDate || nextDate || null;
    }, [mode, firstClassDate, nextDate]);

    // min visible iso (hide past calendar days)
    const minVisibleIso = useMemo(() => {
        const a = todayIsoZA;
        const b = nextDate;
        if (a && b) return a > b ? a : b;
        return a || b || null;
    }, [todayIsoZA, nextDate]);

    const monthsWithClasses = useMemo(() => {
        const s = new Set<string>();
        for (const d of upcomingDates) s.add(isoMonthKeyFromIsoDate(d));
        if (!s.size) s.add(ymKey(new Date().getUTCFullYear(), new Date().getUTCMonth()));
        return s;
    }, [upcomingDates]);

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

    const freeCap = useMemo(() => {
        if (!hasFreeLessons) return 0;
        if (mode === "year") return freeLessonsAvailable;
        return Math.min(freeLessonsAvailable, selectedCount);
    }, [hasFreeLessons, mode, freeLessonsAvailable, selectedCount]);

    useEffect(() => {
        setFreeToUse((prev) => clampInt(prev, 0, freeCap));
    }, [freeCap]);

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
                freeApplied > 0 ? `You’ll use ${freeApplied} free session${freeApplied === 1 ? "" : "s"} first.` : "";
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
            return (
                <div className="text-sm text-black font-semibold">
                    <span className="font-extrabold text-black">{selectedCount}</span> sessions selected
                </div>
            );
        }

        const free = pricingSummary.freeApplied;
        const paid = pricingSummary.paidLessons;

        if (free > 0) {
            return (
                <div className="text-sm text-black font-semibold">
                    <span className="font-extrabold text-rose-700">{free} free, </span>
                    <span className="font-extrabold text-black">{paid} paid</span> session{pricingSummary.totalLessons === 1 ? "" : "s"}
                </div>
            );
        }

        return (
            <div className="text-sm text-black font-semibold">
                <span className="font-extrabold text-black">{paid} paid</span> session{pricingSummary.totalLessons === 1 ? "" : "s"}
            </div>
        );
    }, [details, mode, pricingSummary, selectedCount]);

    const canSubmit = useMemo(() => {
        if (!details) return false;
        if (!agree) return false;
        if (submitting) return false;
        if (!token) return true;

        if (!summaryFirst) return false;
        if (!selectedCount) return false;

        return true;
    }, [details, agree, submitting, token, summaryFirst, selectedCount]);

    const handleConfirmBooking = async () => {
        if (!details) return;

        if (!token) {
            savePendingBooking({
                classId,
                cls,
                mode,
                deal,
                freeToUse,
                agree,
                firstClassDate,
                viewYear,
                viewMonth0,
            });

            navigate("/signup", { state: { returnTo: `/book-class/${classId}` } });
            return;
        }

        const safeFreeToUse = clampInt(freeToUse || 0, 0, freeCap);

        const payload: BookClassDTO = {
            classId: details.groupClassId ?? classId,
            weeklyBooking: mode === "year",
            numberOfSessionsBooked: mode === "package" ? selectedCount : 0,
            numberFreeLessonsApplied: safeFreeToUse,
            paymentMethodSelected: "CASH",
            firstClassDate: summaryFirst || nextDate || upcomingDates[0] || "",
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

            setSuccessOpen(true);
            clearPendingBooking();

            setTimeout(() => {
                navigate(`/dashboard/${userRole}`);
            }, 3000);
        } catch (e: any) {
            console.error(e);
            setTopError(e?.message || "Failed to book. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // Class detail helpers
    const capacityLine = useMemo(() => {
        if (!cls) return null;
        const cur = cls.currentCapacity ?? 0;
        const max = cls.maxCapacity ?? 0;
        if (!max) return "Capacity unknown";
        const left = Math.max(0, max - cur);
        return `${cur}/${max} enrolled · ${left} spot${left === 1 ? "" : "s"} left`;
    }, [cls]);

    // two-line date summary (for BOTH modes)
    const dateSummaryBlock = useMemo(() => {
        const firstPretty = prettyDayMonth(summaryFirst);
        const lastPretty = prettyDayMonth(endClassDate);

        return (
            <div className="rounded-3xl border border-black/10 bg-white p-4">
                <p className="text-sm font-extrabold text-black">
                    First class: {firstPretty}
                </p>
                <p className="text-sm font-extrabold text-black">
                    Last class: {lastPretty}
                </p>
                <p className="text-sm font-extrabold text-black">
                    Total sessions: {selectedCount || 0}
                </p>
            </div>
        );

    }, [summaryFirst, endClassDate, selectedCount]);

    return (
        <div className="min-h-screen flex flex-col bg-slate-100 text-black overflow-x-hidden">
            <TopBar />

            <main className="relative flex-1 overflow-y-auto bg-white">
                {/* LIGHT THEME GLOW ORBS (fixed background) */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
                    <div className="absolute -top-44 -left-40 h-[36rem] w-[36rem] rounded-full bg-sky-400/35 blur-3xl" aria-hidden="true" />
                    <div className="absolute -top-40 right-[-6rem] h-[34rem] w-[34rem] rounded-full bg-indigo-400/30 blur-3xl" aria-hidden="true" />
                    <div className="absolute top-6 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-fuchsia-400/20 blur-3xl" aria-hidden="true" />

                    <div className="absolute top-[22%] -left-40 h-[34rem] w-[34rem] rounded-full bg-emerald-400/25 blur-3xl" aria-hidden="true" />
                    <div className="absolute top-[26%] right-[-4rem] h-[40rem] w-[40rem] rounded-full bg-sky-300/22 blur-3xl" aria-hidden="true" />

                    <div className="absolute top-[48%] left-[10%] h-[30rem] w-[30rem] rounded-full bg-violet-400/22 blur-3xl" aria-hidden="true" />
                    <div className="absolute top-[52%] right-[12%] h-[26rem] w-[26rem] rounded-full bg-sky-400/18 blur-3xl" aria-hidden="true" />

                    <div className="absolute bottom-48 right-[-10rem] h-[40rem] w-[40rem] rounded-full bg-indigo-300/22 blur-3xl" aria-hidden="true" />
                    <div className="absolute bottom-24 left-[-6rem] h-[34rem] w-[34rem] rounded-full bg-emerald-400/18 blur-3xl" aria-hidden="true" />
                    <div className="absolute bottom-[-10rem] left-1/2 h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-sky-300/18 blur-3xl" aria-hidden="true" />
                </div>

                {/* CONTENT */}
                <div className="relative z-10 px-4 py-6 md:px-8 md:py-10">
                    <div className="max-w-5xl mx-auto space-y-6">
                        {topError && (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-extrabold">
                                {topError}
                            </div>
                        )}

                        {/* BOOKING */}
                        <section className="rounded-3xl border border-black bg-white p-5 md:p-7 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                            {/* header */}
                            <div className="flex items-start justify-between gap-3">

                                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-black">
                                    Book a class
                                </h1>

                                <div className="text-right">
                                    <div className="text-lg md:text-xl font-extrabold text-black">
                                        {loading ? "" : details ? `R${details.price}` : ""}
                                    </div>
                                    <div className="text-xs md:text-sm font-extrabold text-black opacity-70">
                                        {loading ? "" : details ? "per session" : ""}
                                    </div>
                                </div>
                            </div>

                            {/* Mode selector */}
                            <div className="mt-6 rounded-3xl border border-black/10 bg-white p-5">
                                <p className="text-sm font-extrabold text-black mb-3">Booking type</p>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setMode("year")}
                                        className={[
                                            "rounded-3xl border-2 p-4 text-left transition font-extrabold",
                                            mode === "year" ? "border-black bg-black text-white" : "border-black bg-white hover:bg-black/5 text-black",
                                        ].join(" ")}
                                    >
                                        <p className="text-base font-extrabold">Weekly</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setMode("package")}
                                        className={[
                                            "rounded-3xl border-2 p-4 text-left transition font-extrabold",
                                            mode === "package" ? "border-black bg-black text-white" : "border-black bg-white hover:bg-black/5 text-black",
                                        ].join(" ")}
                                    >
                                        <p className="text-base font-extrabold">Package</p>
                                    </button>
                                </div>

                                {mode === "year" ? (
                                    <div className="mt-4 text-sm font-extrabold text-black">
                                        Weekly booking. Cancel anytime.
                                    </div>
                                ) : (
                                    null
                                )}

                                {/* Package deals */}
                                {mode === "package" && (
                                    <div className="mt-4 rounded-3xl border border-black/10 bg-white p-4">
                                        <p className="text-sm font-extrabold text-black">Choose a package</p>

                                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setDeal("single")}
                                                className={[
                                                    "rounded-3xl border-2 p-4 text-left transition font-extrabold",
                                                    deal === "single" ? "border-black bg-black text-white" : "border-black bg-white hover:bg-black/5 text-black",
                                                ].join(" ")}
                                            >
                                                <p className="text-base font-extrabold">Single session</p>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setDeal("month1")}
                                                className={[
                                                    "rounded-3xl border-2 p-4 text-left transition font-extrabold",
                                                    deal === "month1" ? "border-black bg-black text-white" : "border-black bg-white hover:bg-black/5 text-black",
                                                ].join(" ")}
                                            >
                                                <p className="text-base font-extrabold">1 month</p>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setDeal("month3")}
                                                className={[
                                                    "rounded-3xl border-2 p-4 text-left transition font-extrabold",
                                                    deal === "month3" ? "border-black bg-black text-white" : "border-black bg-white hover:bg-black/5 text-black",
                                                ].join(" ")}
                                            >
                                                <p className="text-base font-extrabold">3 months</p>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Date summary (BOTH MODES) */}
                            <div className="mt-5">
                                {dateSummaryBlock}
                            </div>

                            {/* Calendar (display only) */}
                            <div className="mt-4">
                                {loading || !details ? (
                                    <div className="rounded-2xl border border-black/10 bg-white px-4 py-4 text-sm text-black font-extrabold">
                                        Loading calendar…
                                    </div>
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
                                        minVisibleIso={minVisibleIso}
                                        monthsWithClasses={monthsWithClasses}
                                    />
                                )}
                            </div>
                        </section>

                        {/* CLASS DETAILS */}
                        <section className="rounded-3xl border border-black bg-white p-5 md:p-7 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                            <button
                                type="button"
                                onClick={() => setClassDetailsOpen((v) => !v)}
                                className="w-full text-left flex items-center justify-between gap-3"
                                aria-expanded={classDetailsOpen}
                            >
                                <h2 className="text-base md:text-lg font-extrabold text-black">Class Details</h2>

                                <svg
                                    className={`h-5 w-5 text-black transition-transform ${classDetailsOpen ? "rotate-180" : ""}`}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <path d="M6 9l6 6 6-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            {classDetailsOpen && (
                                <>
                                    {!cls ? (
                                        <div className="mt-4 rounded-2xl border border-black/10 bg-white px-4 py-4 text-sm text-black font-extrabold">
                                            No class details were passed from FindTutor.
                                        </div>
                                    ) : (
                                        <div className="mt-4">
                                            <p className="text-xs uppercase tracking-wide text-black font-extrabold opacity-70">Venue</p>
                                            <p className="text-lg font-extrabold text-black mt-1">{cls.venueName || "Venue not set"}</p>

                                            <p className="text-sm text-black font-semibold mt-3">
                                                <span className="font-extrabold">Tutor:</span>{" "}
                                                <span className="font-extrabold">{cls.tutorName || "Unknown"}</span>
                                            </p>

                                            <p className="text-sm text-black font-semibold mt-1">
                                                <span className="font-extrabold">Time:</span>{" "}
                                                {normalizeDay(cls.dayOfWeek)} · {formatTime(cls.startTime)}–{formatTime(cls.endTime)}
                                            </p>

                                            <div className="mt-4 h-px bg-black/10" />

                                            <p className="text-xs uppercase tracking-wide text-black font-extrabold mt-4 opacity-70">Address</p>
                                            <p className="text-sm text-black font-extrabold mt-1">{cls.streetAddress || "Not set"}</p>

                                            <p className="text-sm text-black font-semibold mt-3">
                                                <span className="font-extrabold">Capacity:</span>{" "}
                                                <span className="font-extrabold">{capacityLine || "—"}</span>
                                            </p>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {cls.mapsUrl ? (
                                                    <a
                                                        href={cls.mapsUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-2 text-[12px] md:text-[13px] px-4 py-3 rounded-2xl border-2 border-black bg-white hover:bg-black/5 text-black transition font-extrabold"
                                                    >
                                                        Open map
                                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <path d="M12 21s7-4.35 7-11a7 7 0 0 0-14 0c0 6.65 7 11 7 11z" strokeWidth="1.6" />
                                                            <path d="M12 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" strokeWidth="1.6" />
                                                        </svg>
                                                    </a>
                                                ) : null}

                                                {cls.tutorId ? (
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-2 text-[12px] md:text-[13px] px-4 py-3 rounded-2xl border-2 border-black bg-white hover:bg-black/5 text-black transition font-extrabold"
                                                        onClick={() => alert(`Tutor profile route later: /tutors/${cls.tutorId}`)}
                                                    >
                                                        View tutor profile →
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>

                        {/* INCLUDED */}
                        <section className="rounded-3xl border border-black bg-white p-5 md:p-7 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                            <button
                                type="button"
                                onClick={() => setIncludedOpen((v) => !v)}
                                className="w-full text-left hover:opacity-95 transition"
                                aria-expanded={includedOpen}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-base font-extrabold text-black">Included with this class</p>

                                    <svg
                                        className={`h-5 w-5 text-black transition-transform ${includedOpen ? "rotate-180" : ""}`}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path d="M6 9l6 6 6-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>

                                {includedOpen && (
                                    <div className="mt-3 text-sm text-black leading-relaxed font-semibold">
                                        {details?.classAbout ||
                                            "The lecturer provides resources like notes, worked examples, and past paper questions for students."}
                                    </div>
                                )}
                            </button>
                        </section>

                        {/* SUMMARY */}
                        <section className="rounded-3xl border border-black bg-white p-5 md:p-7 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                            <p className="text-base font-extrabold text-black">Summary</p>
                            <div className="mt-2">{summaryLine}</div>

                            {details && mode === "package" ? (
                                <div className="mt-4 flex items-end justify-between">
                                    <div className="text-sm text-black font-extrabold">Total for this booking</div>
                                    <div className="text-2xl font-extrabold text-black">{centsToRand(pricingSummary.totalCents)}</div>
                                </div>
                            ) : null}

                            {/* Free lessons */}
                            {hasFreeLessons && details && (
                                <div className="mt-5 rounded-3xl border-2 border-rose-600 bg-rose-50 px-5 py-4">
                                    {freeLessonsAvailable === 1 ? (
                                        <label className="flex items-start justify-between gap-4 text-sm text-black font-semibold">
                                            <div>
                                                <p className="font-extrabold text-rose-800">You have 1 free session available</p>
                                                <p className="text-black mt-1 font-semibold">Use it for this booking?</p>
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
                                                <p className="font-extrabold text-rose-800">
                                                    You have {freeLessonsAvailable} free sessions available
                                                </p>
                                                <p className="text-sm text-black mt-1 font-semibold">How many do you want to use?</p>
                                            </div>

                                            <div className="w-full md:w-44">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={freeCap}
                                                    value={freeToUse}
                                                    onChange={(e) => setFreeToUse(clampInt(Number(e.target.value) || 0, 0, freeCap))}
                                                    className="w-full rounded-2xl border-2 border-rose-600 bg-white px-4 py-3 text-base text-black focus:outline-none focus:ring-2 focus:ring-rose-200 font-extrabold"
                                                />
                                                <p className="text-xs text-black mt-1 font-semibold">
                                                    Max: {freeCap}
                                                    {mode === "package" ? " (based on sessions included)" : ""}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Payment note */}
                            <div className="mt-5 rounded-2xl border-2 border-teal-600 bg-teal-100 px-4 py-3">
                                <p className="text-sm font-extrabold text-black">Payment is cash at lesson, after each lesson</p>
                            </div>

                            <label className="mt-5 flex items-start gap-3 text-sm text-black font-semibold">
                                <input
                                    type="checkbox"
                                    checked={agree}
                                    onChange={(e) => setAgree(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 accent-black"
                                />
                                <span className="font-semibold">I confirm that I have read and accepted the Terms & Conditions.</span>
                            </label>

                            <div className="mt-5">
                                <button
                                    type="button"
                                    disabled={!canSubmit}
                                    onClick={handleConfirmBooking}
                                    className="w-full inline-flex items-center justify-center rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-black/20 disabled:cursor-not-allowed text-white font-extrabold px-4 py-3 transition"
                                >
                                    {submitting ? "Confirming..." : token ? "Confirm booking" : "Sign up to book"}
                                </button>
                            </div>
                        </section>

                        {successOpen && (
                            <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999]">
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg">
                                    <p className="text-sm font-extrabold text-emerald-800">Booked successfully. Redirecting…</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <footer className="px-4 py-5 border-t border-black/10 text-sm text-black text-center font-semibold">
                © {new Date().getFullYear()} Sumit. All rights reserved.
            </footer>
        </div>
    );
}
