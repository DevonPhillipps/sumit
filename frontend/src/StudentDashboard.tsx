import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./components/TopBar";
import { API_BASE_URL } from "./config/api";

type UserRoleLower = "student" | "tutor" | "admin";

type TimeslotsDTO = {
    id?: number;
    startTime?: string; // "14:00:00"
    endTime?: string; // "15:00:00"
};

type RecurrenceStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED" | "REMOVED";

type RecurrenceClassDTO = {
    recurrenceClassId: number;
    classDate: string; // "YYYY-MM-DD"
    recurrenceStatus: RecurrenceStatus;
};

type MyClassesDTO = {
    classId: number;
    recurrenceClasses: RecurrenceClassDTO[];
    venueName: string | null;
    subject: string | null;
    grade: number | null;
    timeslot: TimeslotsDTO | null;
    dayOfWeek: string | null; // backend DayOfWeek -> "MONDAY"
};

const API = {
    dashboard: `${API_BASE_URL}/api/classes/student-get-upcoming-classes`,
    cancelClass: (classId: number) => `${API_BASE_URL}/api/classes/${classId}/students/me/cancel`,
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

function normalizeRoleLower(raw: string | null): UserRoleLower {
    const v = (raw || "").trim();
    if (!v) return "student";
    const up = v.toUpperCase();

    if (up === "STUDENT") return "student";
    if (up === "TUTOR") return "tutor";
    if (up === "ADMIN") return "admin";

    const low = v.toLowerCase();
    if (low === "student" || low === "tutor" || low === "admin") return low as UserRoleLower;
    return "student";
}

function formatTime(t?: string | null) {
    if (!t) return "—";
    return t.length >= 5 ? t.slice(0, 5) : t;
}

function prettyDow(dow?: string | null) {
    if (!dow) return "—";
    const up = dow.toUpperCase();
    const map: Record<string, string> = {
        MONDAY: "Mon",
        TUESDAY: "Tue",
        WEDNESDAY: "Wed",
        THURSDAY: "Thu",
        FRIDAY: "Fri",
        SATURDAY: "Sat",
        SUNDAY: "Sun",
    };
    return map[up] || dow;
}

function parseDateISO(dateISO?: string | null) {
    if (!dateISO) return null;
    const d = new Date(dateISO + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
}

function toISODateLocal(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number) {
    return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function getCalendarGrid(monthDate: Date) {
    // Monday-first calendar (variable number of rows)
    const first = startOfMonth(monthDate);

    const firstDowSun0 = first.getDay(); // 0=Sun..6=Sat
    const firstDowMon0 = (firstDowSun0 + 6) % 7; // 0=Mon..6=Sun

    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();

    // total cells needed = leading blanks + days in month
    const totalCells = firstDowMon0 + daysInMonth;

    // weeks needed (4/5/6)
    const weeks = Math.ceil(totalCells / 7);
    const cellCount = weeks * 7;

    const days: Date[] = [];
    for (let i = 0; i < cellCount; i++) {
        const d = new Date(first);
        d.setDate(1 - firstDowMon0 + i);
        days.push(d);
    }

    return { days };
}

type ScheduleRow = {
    classId: number;
    classDate: string; // YYYY-MM-DD
    recurrenceStatus: RecurrenceStatus;
    subject: string | null;
    grade: number | null;
    venueName: string | null;
    startTime: string | null;
    endTime: string | null;
};

type ModalState =
    | { open: false }
    | { open: true; kind: "class"; item: MyClassesDTO }
    | { open: true; kind: "day"; dateISO: string; rows: ScheduleRow[] };

export default function StudentDashboard() {
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const userRoleLower = normalizeRoleLower(localStorage.getItem("userRole"));

    const isAuthenticated = !!token;
    const isStudent = userRoleLower === "student";

    const [data, setData] = useState<MyClassesDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [modal, setModal] = useState<ModalState>({ open: false });
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionOk, setActionOk] = useState<string | null>(null);

    const [calendarMonth, setCalendarMonth] = useState<Date>(() => startOfMonth(new Date()));

    useEffect(() => {
        const existing = localStorage.getItem("userRole");
        const normalized = normalizeRoleLower(existing);
        if (existing !== normalized) localStorage.setItem("userRole", normalized);
    }, []);

    useEffect(() => {
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }
        if (userRoleLower !== "student") {
            navigate(`/dashboard/${userRoleLower}`, { replace: true });
        }
    }, [token, userRoleLower, navigate]);

    const authHeaders = useMemo(() => {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    }, [token]);

    const goFindClass = () => navigate("/find-tutor");

    const scheduleRows = useMemo<ScheduleRow[]>(() => {
        const rows: ScheduleRow[] = [];

        for (const c of data || []) {
            const startTime = c.timeslot?.startTime ?? null;
            const endTime = c.timeslot?.endTime ?? null;

            for (const r of c.recurrenceClasses || []) {
                rows.push({
                    classId: c.classId,
                    classDate: r.classDate,
                    recurrenceStatus: r.recurrenceStatus,
                    subject: c.subject ?? null,
                    grade: c.grade ?? null,
                    venueName: c.venueName ?? null,
                    startTime,
                    endTime,
                });
            }
        }

        rows.sort((a, b) => {
            const da = parseDateISO(a.classDate)?.getTime() ?? 0;
            const db = parseDateISO(b.classDate)?.getTime() ?? 0;
            if (da !== db) return da - db;
            return formatTime(a.startTime).localeCompare(formatTime(b.startTime));
        });

        return rows;
    }, [data]);

    const myClasses = useMemo(() => {
        const arr = Array.isArray(data) ? data : [];
        return [...arr].sort((a, b) => {
            const s = String(a.subject || "").localeCompare(String(b.subject || ""), undefined, { sensitivity: "base" });
            if (s !== 0) return s;
            const g = (a.grade ?? 0) - (b.grade ?? 0);
            if (g !== 0) return g;
            return String(a.venueName || "").localeCompare(String(b.venueName || ""), undefined, { sensitivity: "base" });
        });
    }, [data]);

    const hasAnything = myClasses.length > 0 || scheduleRows.length > 0;

    const scheduleByDay = useMemo(() => {
        const map = new Map<string, ScheduleRow[]>();
        for (const r of scheduleRows) {
            const arr = map.get(r.classDate) || [];
            arr.push(r);
            map.set(r.classDate, arr);
        }
        for (const [k, v] of map.entries()) {
            v.sort((a, b) => formatTime(a.startTime).localeCompare(formatTime(b.startTime)));
            map.set(k, v);
        }
        return map;
    }, [scheduleRows]);

    const calendarDays = useMemo(() => getCalendarGrid(calendarMonth).days, [calendarMonth]);

    const calendarTitle = useMemo(() => {
        return calendarMonth.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
    }, [calendarMonth]);

    const refreshDashboard = async () => {
        if (!token || userRoleLower !== "student") return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(API.dashboard, { method: "GET", headers: authHeaders });

            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem("token");
                navigate("/login", { replace: true });
                return;
            }

            if (!res.ok) throw new Error(await readErrorText(res));

            const payload = await safeReadJson<MyClassesDTO[]>(res);
            const arr = Array.isArray(payload) ? payload : [];
            setData(arr);

            const allDates: string[] = [];
            for (const c of arr) for (const r of c.recurrenceClasses || []) allDates.push(r.classDate);
            allDates.sort((a, b) => (parseDateISO(a)?.getTime() ?? 0) - (parseDateISO(b)?.getTime() ?? 0));
            const earliest = allDates[0];
            if (earliest) {
                const d = parseDateISO(earliest);
                if (d) {
                    const curMonthHasAny = calendarDays.some((cd) => {
                        const iso = toISODateLocal(cd);
                        return cd.getMonth() === calendarMonth.getMonth() && (scheduleByDay.get(iso)?.length ?? 0) > 0;
                    });
                    if (!curMonthHasAny) setCalendarMonth(startOfMonth(d));
                }
            }
        } catch (e: any) {
            setError(e?.message || "Failed to load your dashboard");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, userRoleLower, authHeaders, navigate]);

    async function cancelClassFully(classId: number) {
        setActionLoading(true);
        setActionError(null);
        setActionOk(null);

        try {
            const res = await fetch(API.cancelClass(classId), {
                method: "PATCH",
                headers: authHeaders,
            });

            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem("token");
                navigate("/login", { replace: true });
                return;
            }

            if (!res.ok) throw new Error(await readErrorText(res));

            setActionOk("Class cancelled.");
            setModal({ open: false });

            await refreshDashboard();
        } catch (e: any) {
            setActionError(e?.message || "Failed to cancel class");
        } finally {
            setActionLoading(false);
        }
    }

    function openDayPopup(dateISO: string) {
        setActionError(null);
        setActionOk(null);

        const rows = scheduleByDay.get(dateISO) || [];
        if (!rows.length) return;

        setModal({ open: true, kind: "day", dateISO, rows });
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 overflow-x-hidden">
            <TopBar customActions={null} />

            {/* ORB BACKGROUND (same as FindTutor) */}
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

            {/* CONTENT LAYER */}
            <main className="relative z-10 flex-1 px-4 py-6 md:px-8 md:py-10">
                <div className="max-w-5xl mx-auto space-y-4">

                    {(error || actionError) && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-semibold whitespace-pre-wrap">
                            {actionError || error}
                        </div>
                    )}

                    {actionOk && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 font-extrabold">
                            {actionOk}
                        </div>
                    )}

                    {loading && <div className="text-sm text-slate-600 font-semibold">Loading your dashboard…</div>}

                    {!loading && !hasAnything && (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                            <p className="text-sm font-semibold text-slate-900">No classes yet</p>
                            <p className="text-sm text-slate-600 mt-1">Once you book a class, it’ll show up here.</p>

                            <button
                                onClick={goFindClass}
                                className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold transition"
                            >
                                Find a class
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M5 12h14" strokeWidth="1.8" strokeLinecap="round" />
                                    <path d="M13 6l6 6-6 6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Schedule (Calendar) */}
                        <div className="rounded-3xl border border-black bg-white p-5 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                            <div className="flex items-center justify-between">
                                <p className="text-base font-extrabold text-slate-900">Schedule</p>
                                <p className="text-xs text-slate-500 font-semibold">
                                    {scheduleRows.length ? `${scheduleRows.length} upcoming` : "No upcoming"}
                                </p>
                            </div>

                            <div className="mt-4 rounded-2xl border border-slate-300 bg-slate-50 p-3">
                                {/* Header */}
                                <div className="flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => setCalendarMonth((m) => addMonths(m, -1))}
                                        className="rounded-2xl px-3 py-2 text-sm font-extrabold border border-slate-200 hover:bg-white transition"
                                        aria-label="Previous month"
                                    >
                                        ←
                                    </button>

                                    <div className="text-sm font-extrabold text-slate-900">{calendarTitle}</div>

                                    <button
                                        onClick={() => setCalendarMonth((m) => addMonths(m, +1))}
                                        className="rounded-2xl px-3 py-2 text-sm font-extrabold border border-slate-200 hover:bg-white transition"
                                        aria-label="Next month"
                                    >
                                        →
                                    </button>
                                </div>

                                {/* DOW */}
                                <div className="mt-3 grid grid-cols-7 gap-2 text-[11px] font-extrabold text-slate-500">
                                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                                        <div key={d} className="text-center">
                                            {d}
                                        </div>
                                    ))}
                                </div>

                                {/* Grid */}
                                <div className="mt-2 grid grid-cols-7 gap-2">
                                    {calendarDays.map((d, idx) => {
                                        const iso = toISODateLocal(d);
                                        const inMonth = d.getMonth() === calendarMonth.getMonth();
                                        const rows = scheduleByDay.get(iso) || [];
                                        const hasEvents = rows.length > 0;

                                        const base =
                                            "rounded-2xl border h-12 px-2 py-2 text-sm font-extrabold transition relative flex items-center justify-center";

                                        const normalStyle = "bg-white border-slate-200 text-slate-900 hover:bg-slate-50";

                                        const eventStyle =
                                            "bg-sky-600 border-sky-700 text-white hover:bg-sky-700 shadow-[0_8px_18px_rgba(2,6,23,0.12)]";

                                        if (!inMonth) {
                                            return (
                                                <div
                                                    key={`${iso}-${idx}`}
                                                    className="rounded-2xl border h-12 px-2 py-2 border-transparent bg-transparent"
                                                />
                                            );
                                        }

                                        return (
                                            <button
                                                key={`${iso}-${idx}`}
                                                onClick={() => hasEvents && openDayPopup(iso)}
                                                disabled={!hasEvents}
                                                className={[
                                                    base,
                                                    hasEvents ? eventStyle : normalStyle,
                                                    !hasEvents ? "cursor-default" : "",
                                                ].join(" ")}
                                                title={hasEvents ? "View lessons" : ""}
                                            >
                                                <span className="leading-none">{d.getDate()}</span>

                                                {hasEvents && rows.length > 1 ? (
                                                    <span className="absolute top-2 right-2 inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
      </span>
                                                ) : null}
                                            </button>
                                        );

                                    })}
                                </div>
                            </div>
                        </div>

                        {/* My classes */}
                        <div className="rounded-3xl border border-black bg-white p-5 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                            <div className="flex items-center justify-between">
                                <p className="text-base font-extrabold text-slate-900">My classes</p>
                                <p className="text-xs text-slate-500 font-semibold">
                                    {myClasses.length ? `${myClasses.length} enrolled` : "None yet"}
                                </p>
                            </div>

                            <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50">
                                <div className="max-h-[360px] overflow-auto p-2">
                                    {!myClasses.length && !loading ? (
                                        <div className="p-3 text-sm text-slate-600 font-semibold">
                                            You’re not enrolled in any classes yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {myClasses.map((c) => (
                                                <button
                                                    key={c.classId}
                                                    onClick={() => {
                                                        setActionError(null);
                                                        setActionOk(null);
                                                        setModal({ open: true, kind: "class", item: c });
                                                    }}
                                                    className="w-full text-left rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition px-4 py-3 shadow-[0_6px_18px_rgba(2,6,23,0.08)]"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-extrabold text-slate-900 truncate">
                                                                {c.subject} • Grade {c.grade ?? "—"}
                                                            </div>

                                                            <div className="text-xs text-slate-700 font-semibold mt-1">
                                                                {prettyDow(c.dayOfWeek)} • {formatTime(c.timeslot?.startTime)}–
                                                                {formatTime(c.timeslot?.endTime)}
                                                            </div>

                                                            <div className="text-xs text-slate-600 font-semibold mt-1">
                                                                {c.venueName || "—"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!myClasses.length && !loading && (
                                <button
                                    onClick={goFindClass}
                                    className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold transition"
                                >
                                    Find a class
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M5 12h14" strokeWidth="1.8" strokeLinecap="round" />
                                        <path d="M13 6l6 6-6 6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {!isStudent && isAuthenticated && (
                        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-semibold">
                            You are logged in as {userRoleLower}. Redirecting…
                        </div>
                    )}
                </div>
            </main>

            <footer className="relative z-10 px-4 py-5 border-t border-slate-200 text-sm text-slate-600 text-center font-medium">
                © {new Date().getFullYear()} Sumit. All rights reserved.
            </footer>

            {/* Day popup (calendar click) */}
            {modal.open && modal.kind === "day" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <button
                        type="button"
                        aria-label="Close modal"
                        className="absolute inset-0 bg-black/50"
                        onClick={() => !actionLoading && setModal({ open: false })}
                    />

                    {/* Modal */}
                    <div className="relative w-full max-w-2xl rounded-3xl border border-black bg-white shadow-[0_30px_80px_rgba(2,6,23,0.35)]">
                        <div className="p-6 md:p-8">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="text-2xl md:text-3xl font-extrabold text-slate-900">
                                    {new Date(modal.dateISO + "T00:00:00").toLocaleDateString("en-ZA", {
                                        weekday: "long",
                                        day: "2-digit",
                                        month: "short",
                                    })}
                                </div>

                                <button
                                    onClick={() => !actionLoading && setModal({ open: false })}
                                    className="shrink-0 rounded-2xl px-4 py-2.5 text-sm md:text-base font-extrabold border border-slate-200 hover:bg-slate-50 transition"
                                >
                                    Close
                                </button>
                            </div>

                            {/* Lessons list */}
                            <div className="mt-6 space-y-3 max-h-[60vh] overflow-auto pr-1">
                                {modal.rows.map((r, i) => (
                                    <div
                                        key={`${r.classId}-${r.classDate}-${i}`}
                                        className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6"
                                    >
                                        <div className="text-lg md:text-xl font-extrabold text-slate-900">
                                            {r.subject} • Grade {r.grade ?? "—"}
                                        </div>

                                        <div className="mt-2 text-sm md:text-base text-slate-700 font-semibold">
                                            {formatTime(r.startTime)}–{formatTime(r.endTime)}
                                        </div>

                                        <div className="mt-1 text-sm md:text-base text-slate-600 font-semibold">
                                            {r.venueName || "—"}
                                        </div>

                                        {r.recurrenceStatus === "CANCELLED" && (
                                            <div className="mt-3 inline-block text-xs md:text-sm font-extrabold px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                                CANCELLED
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* My classes popup */}
            {modal.open && modal.kind === "class" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <button
                        type="button"
                        aria-label="Close modal"
                        className="absolute inset-0 bg-black/50"
                        onClick={() => !actionLoading && setModal({ open: false })}
                    />

                    {/* Modal */}
                    <div className="relative w-full max-w-2xl rounded-3xl border border-black bg-white shadow-[0_30px_80px_rgba(2,6,23,0.35)]">
                        <div className="p-6 md:p-8">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="text-2xl md:text-3xl font-extrabold text-slate-900 truncate">
                                        {modal.item.subject} • Grade {modal.item.grade ?? "—"}
                                    </div>
                                    <div className="text-base md:text-lg text-slate-600 font-semibold mt-2 truncate">
                                        {modal.item.venueName || "—"}
                                    </div>
                                </div>

                                <button
                                    onClick={() => !actionLoading && setModal({ open: false })}
                                    className="shrink-0 rounded-2xl px-4 py-2.5 text-sm md:text-base font-extrabold border border-slate-200 hover:bg-slate-50 transition"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5 md:px-6 md:py-6 space-y-3">
                                <div className="flex items-center justify-between gap-3 text-base md:text-lg">
                                    <span className="text-slate-600 font-semibold">Weekly</span>
                                    <span className="text-slate-900 font-extrabold">
              {prettyDow(modal.item.dayOfWeek)} • {formatTime(modal.item.timeslot?.startTime)}–
                                        {formatTime(modal.item.timeslot?.endTime)}
            </span>
                                </div>

                                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm md:text-base text-amber-900 font-extrabold">
                                    Leaving this class will fully cancel all your lessons.
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    disabled={actionLoading}
                                    onClick={() => cancelClassFully(modal.item.classId)}
                                    className="w-full inline-flex items-center justify-center px-5 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-base md:text-lg font-extrabold transition"
                                >
                                    {actionLoading ? "Cancelling…" : "Leave this class"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
