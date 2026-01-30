import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./components/TopBar";
import { API_BASE_URL } from "./config/api";

type UserRoleLower = "student" | "tutor" | "admin";

type TimeslotsDTO = {
    id?: number;
    startTime?: string; // "14:00:00"
    endTime?: string; // "15:00:00"
    turnaroundMinutes?: number;
};

type GroupClassRecurrenceStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED" | "REMOVED";

type PaymentMethodSelectedEnum = "CASH" | "EFT" | "FREE_LESSON";

type StudentDTO = {
    studentUserId: number;
    studentFirstName: string;
    studentLastName: string;
    studentEmail: string;
    paymentMethodSelected: PaymentMethodSelectedEnum | null;
};

type TutorRecurrenceClassesDTO = {
    recurrenceClassId: number;
    classDate: string; // "YYYY-MM-DD"
    recurrenceStatus: GroupClassRecurrenceStatus;
    students: StudentDTO[];
};

type TutorClassesDTO = {
    classId: number;
    recurrenceClasses: TutorRecurrenceClassesDTO[];
    venueName: string | null;
    subject: string | null;
    grade: number | null;
    timeslot: TimeslotsDTO | null;
    dayOfWeek: string | null; // "MONDAY"
};

const API = {
    // ✅ set this to your backend mapping
    dashboard: `${API_BASE_URL}/api/classes/tutor-get-all-classes`,
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

function formatDateLabel(dateISO?: string | null) {
    if (!dateISO) return "—";
    const d = parseDateISO(dateISO);
    if (!d) return dateISO;
    return d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
}

function formatScheduleLine(dateISO?: string | null, start?: string | null, end?: string | null) {
    const date = formatDateLabel(dateISO);
    const time = `${formatTime(start)}–${formatTime(end)}`;
    return `${time} • ${date}`;
}

type ScheduleRow = {
    classId: number;
    recurrenceClassId: number;
    classDate: string;
    recurrenceStatus: GroupClassRecurrenceStatus;

    subject: string | null;
    grade: number | null;
    venueName: string | null;
    dayOfWeek: string | null;

    startTime: string | null;
    endTime: string | null;

    studentsCount: number;
};

type ModalState =
    | { open: false }
    | {
    open: true;
    kind: "recurrence";
    classItem: TutorClassesDTO;
    recurrenceItem: TutorRecurrenceClassesDTO;
};

function paymentLabel(p: PaymentMethodSelectedEnum | null | undefined) {
    if (!p) return "—";
    if (p === "FREE_LESSON") return "Free lesson";
    return p;
}

export default function TutorDashboard() {
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const userRoleLower = normalizeRoleLower(localStorage.getItem("userRole"));

    const isAuthenticated = !!token;
    const isTutor = userRoleLower === "tutor";

    const [data, setData] = useState<TutorClassesDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [modal, setModal] = useState<ModalState>({ open: false });

    // Needs attention popup
    const [attentionOpen, setAttentionOpen] = useState(false);

    // keep localStorage normalized
    useEffect(() => {
        const existing = localStorage.getItem("userRole");
        const normalized = normalizeRoleLower(existing);
        if (existing !== normalized) localStorage.setItem("userRole", normalized);
    }, []);

    // auth + redirect
    useEffect(() => {
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }
        if (userRoleLower !== "tutor") {
            navigate(`/dashboard/${userRoleLower}`, { replace: true });
        }
    }, [token, userRoleLower, navigate]);

    const authHeaders = useMemo(() => {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    }, [token]);

    const goCreateClass = () => navigate("/tutor/create-class");
    const goMyClasses = () => navigate("/dashboard/tutor/my-classes");

    const refreshDashboard = async () => {
        if (!token || userRoleLower !== "tutor") return;

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

            const payload = await safeReadJson<TutorClassesDTO[]>(res);
            setData(Array.isArray(payload) ? payload : []);
        } catch (e: any) {
            setError(e?.message || "Failed to load your tutor dashboard");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, userRoleLower, authHeaders, navigate]);

    const scheduleRows = useMemo<ScheduleRow[]>(() => {
        const rows: ScheduleRow[] = [];

        for (const c of data || []) {
            const startTime = c.timeslot?.startTime ?? null;
            const endTime = c.timeslot?.endTime ?? null;

            for (const r of c.recurrenceClasses || []) {
                rows.push({
                    classId: c.classId,
                    recurrenceClassId: r.recurrenceClassId,
                    classDate: r.classDate,
                    recurrenceStatus: r.recurrenceStatus,

                    subject: c.subject ?? null,
                    grade: c.grade ?? null,
                    venueName: c.venueName ?? null,
                    dayOfWeek: c.dayOfWeek ?? null,

                    startTime,
                    endTime,

                    studentsCount: Array.isArray(r.students) ? r.students.length : 0,
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

    const upcomingScheduledRows = useMemo(() => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return scheduleRows.filter((r) => {
            if (r.recurrenceStatus !== "SCHEDULED") return false;
            const d = parseDateISO(r.classDate);
            if (!d) return false;
            return d.getTime() >= todayStart.getTime();
        });
    }, [scheduleRows]);

    const pastScheduledRows = useMemo(() => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return scheduleRows.filter((r) => {
            if (r.recurrenceStatus !== "SCHEDULED") return false;
            const d = parseDateISO(r.classDate);
            if (!d) return false;
            return d.getTime() < todayStart.getTime();
        });
    }, [scheduleRows]);

    // Hide past scheduled (needs attention) from the schedule list
    const scheduleRowsToDisplay = useMemo(() => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        return scheduleRows.filter((r) => {
            if (r.recurrenceStatus !== "SCHEDULED") return true;
            const d = parseDateISO(r.classDate);
            if (!d) return true;
            return d.getTime() >= todayStart.getTime();
        });
    }, [scheduleRows]);

    // Auto-open needs attention popup
    useEffect(() => {
        if (pastScheduledRows.length > 0) setAttentionOpen(true);
    }, [pastScheduledRows.length]);

    const uniqueStudentsCount = useMemo(() => {
        const set = new Set<number>();
        for (const c of data || []) {
            for (const r of c.recurrenceClasses || []) {
                for (const s of r.students || []) set.add(s.studentUserId);
            }
        }
        return set.size;
    }, [data]);

    const nextSession = useMemo(() => {
        const next = upcomingScheduledRows[0] || null;
        if (!next) return null;
        return next;
    }, [upcomingScheduledRows]);

    const hasAnything = (data?.length ?? 0) > 0 || (scheduleRows?.length ?? 0) > 0;

    function findClassById(classId: number) {
        return (data || []).find((c) => c.classId === classId) || null;
    }

    function findRecurrenceById(c: TutorClassesDTO, recurrenceId: number) {
        return (c.recurrenceClasses || []).find((r) => r.recurrenceClassId === recurrenceId) || null;
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 overflow-x-hidden">
            <TopBar customActions={null} />

            <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
                <div className="max-w-5xl mx-auto space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Tutor Dashboard</h1>

                        {isAuthenticated && isTutor ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={goMyClasses}
                                    className="inline-flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white transition font-extrabold"
                                >
                                    Manage my classes
                                </button>

                                <button
                                    onClick={goCreateClass}
                                    className="inline-flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white transition font-extrabold"
                                >
                                    + Create class
                                </button>
                            </div>
                        ) : null}
                    </div>

                    {error && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-semibold whitespace-pre-wrap">
                            {error}
                        </div>
                    )}

                    {loading && <div className="text-sm text-slate-600 font-semibold">Loading your tutor dashboard…</div>}

                    {!loading && !hasAnything && (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                            <p className="text-sm font-semibold text-slate-900">No classes yet</p>
                            <p className="text-sm text-slate-600 mt-1">
                                Once you create a class and students enroll, it’ll show up here.
                            </p>

                            <button
                                onClick={goCreateClass}
                                className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold transition"
                            >
                                Create your first class
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M12 5v14" strokeWidth="1.8" strokeLinecap="round" />
                                    <path d="M5 12h14" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Summary cards (no fillers; derived from API data) */}
                    <section className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-3xl border border-black bg-white p-5 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Upcoming sessions</p>
                            <p className="text-2xl font-extrabold mt-1">{upcomingScheduledRows.length}</p>
                            <p className="text-xs text-slate-500 font-semibold mt-1">scheduled (today onward)</p>
                        </div>

                        <div className="rounded-3xl border border-black bg-white p-5 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Active students</p>
                            <p className="text-2xl font-extrabold mt-1">{uniqueStudentsCount}</p>
                            <p className="text-xs text-slate-500 font-semibold mt-1">unique across recurrences</p>
                        </div>

                        <div className="rounded-3xl border border-black bg-white p-5 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Needs attention</p>
                            <p className="text-2xl font-extrabold mt-1">{pastScheduledRows.length}</p>
                            <p className="text-xs text-slate-500 font-semibold mt-1">past sessions still SCHEDULED</p>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Schedule */}
                        <div className="rounded-3xl border border-black bg-white p-5 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                            <div className="flex items-center justify-between">
                                <p className="text-base font-extrabold text-slate-900">Schedule</p>
                                <button
                                    onClick={refreshDashboard}
                                    className="text-xs font-extrabold px-3 py-2 rounded-2xl border border-slate-200 hover:bg-slate-50 transition"
                                >
                                    Refresh
                                </button>
                            </div>

                            <div className="mt-4 rounded-2xl border border-slate-300 bg-slate-200">
                                <div className="max-h-[420px] overflow-auto p-2">
                                    {!scheduleRowsToDisplay.length && !loading ? (
                                        <div className="p-3 text-sm text-slate-600 font-semibold">Nothing scheduled yet.</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {scheduleRowsToDisplay.map((r) => (
                                                <button
                                                    key={`${r.recurrenceClassId}`}
                                                    onClick={() => {
                                                        const c = findClassById(r.classId);
                                                        if (!c) return;
                                                        const rr = findRecurrenceById(c, r.recurrenceClassId);
                                                        if (!rr) return;
                                                        setModal({ open: true, kind: "recurrence", classItem: c, recurrenceItem: rr });
                                                    }}
                                                    className="w-full text-left rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition px-4 py-3 shadow-[0_6px_18px_rgba(2,6,23,0.08)]"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-extrabold text-slate-900 truncate">
                                                                {r.subject || "—"} • Grade {r.grade ?? "—"}
                                                            </div>

                                                            <div className="text-xs text-slate-700 font-semibold mt-1">
                                                                {formatScheduleLine(r.classDate, r.startTime, r.endTime)}
                                                            </div>

                                                            <div className="text-xs text-slate-600 font-semibold mt-1">
                                                                {r.venueName || "—"} • {prettyDow(r.dayOfWeek)}
                                                            </div>

                                                            <div className="text-xs text-slate-600 font-semibold mt-1">
                                                                Students:{" "}
                                                                <span className="font-extrabold text-slate-900">{r.studentsCount}</span>
                                                            </div>
                                                        </div>

                                                        <div className="shrink-0 flex flex-col items-end gap-2">
                                                            {r.recurrenceStatus !== "SCHEDULED" && (
                                                                <span className="text-[11px] font-extrabold px-2 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                                  {r.recurrenceStatus}
                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Next session */}
                        <div className="rounded-3xl border border-black bg-white p-4 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                            <div className="flex items-center justify-between">
                                <p className="text-base font-extrabold text-slate-900">Next session</p>
                            </div>

                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                {!nextSession ? (
                                    <div className="text-sm text-slate-600 font-semibold">No upcoming scheduled sessions.</div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="text-sm font-extrabold text-slate-900">
                                            {nextSession.subject || "—"} • Grade {nextSession.grade ?? "—"}
                                        </div>
                                        <div className="text-xs text-slate-700 font-semibold">
                                            {formatScheduleLine(nextSession.classDate, nextSession.startTime, nextSession.endTime)}
                                        </div>
                                        <div className="text-xs text-slate-600 font-semibold">
                                            {nextSession.venueName || "—"} • {prettyDow(nextSession.dayOfWeek)}
                                        </div>
                                        <div className="text-xs text-slate-600 font-semibold">
                                            Students: <span className="font-extrabold text-slate-900">{nextSession.studentsCount}</span>
                                        </div>

                                        <button
                                            onClick={() => {
                                                const c = findClassById(nextSession.classId);
                                                if (!c) return;
                                                const rr = findRecurrenceById(c, nextSession.recurrenceClassId);
                                                if (!rr) return;
                                                setModal({ open: true, kind: "recurrence", classItem: c, recurrenceItem: rr });
                                            }}
                                            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold transition"
                                        >
                                            Open session
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Needs attention box (only show if there is at least 1) */}
                    {pastScheduledRows.length > 0 && (
                        <div className="rounded-3xl border border-black bg-white p-5 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-base font-extrabold text-slate-900">Classes that need attention</p>
                                    <p className="text-xs text-slate-600 font-semibold mt-1">
                                        Past sessions still marked as <span className="font-extrabold">SCHEDULED</span>.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setAttentionOpen(true)}
                                    className="shrink-0 inline-flex items-center justify-center px-3 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold transition text-xs"
                                >
                                    Open list
                                </button>
                            </div>

                            <div className="mt-4 max-h-[320px] overflow-auto space-y-2">
                                {pastScheduledRows.map((r) => (
                                    <div
                                        key={`need-${r.recurrenceClassId}`}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_6px_18px_rgba(2,6,23,0.06)]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-sm font-extrabold text-slate-900 truncate">
                                                    {r.subject || "—"} • Grade {r.grade ?? "—"}
                                                </div>
                                                <div className="text-xs text-slate-700 font-semibold mt-1">
                                                    {formatScheduleLine(r.classDate, r.startTime, r.endTime)}
                                                </div>
                                                <div className="text-xs text-slate-600 font-semibold mt-1">
                                                    {r.venueName || "—"} • {prettyDow(r.dayOfWeek)}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => navigate(`/dashboard/tutor/class/${r.recurrenceClassId}/validate`)}
                                                className="shrink-0 inline-flex items-center justify-center px-3 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold transition text-xs"
                                            >
                                                Validate
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!isTutor && isAuthenticated && (
                        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-semibold">
                            You are logged in as {userRoleLower}. Redirecting…
                        </div>
                    )}
                </div>
            </main>

            <footer className="px-4 py-5 border-t border-slate-200 text-sm text-slate-600 text-center font-medium">
                © {new Date().getFullYear()} Sumit. Tutor panel.
            </footer>

            {/* Needs attention popup (auto-opens on load if there are items) */}
            {attentionOpen && pastScheduledRows.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="relative w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-3xl border border-black shadow-[0_30px_80px_rgba(2,6,23,0.35)]">
                        <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-lg font-extrabold text-slate-900">Needs attention</div>
                                </div>

                                {/* X button top-right */}
                                <button
                                    onClick={() => setAttentionOpen(false)}
                                    className="shrink-0 rounded-2xl px-3 py-2 text-sm font-extrabold border border-slate-200 hover:bg-slate-50 transition"
                                    aria-label="Close"
                                    title="Close"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="mt-4 max-h-[380px] overflow-auto space-y-2">
                                {pastScheduledRows.map((r) => (
                                    <div
                                        key={`attn-${r.recurrenceClassId}`}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_6px_18px_rgba(2,6,23,0.06)]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-sm font-extrabold text-slate-900 truncate">
                                                    {r.subject || "—"} • Grade {r.grade ?? "—"}
                                                </div>
                                                <div className="text-xs text-slate-700 font-semibold mt-1">
                                                    {formatScheduleLine(r.classDate, r.startTime, r.endTime)}
                                                </div>
                                                <div className="text-xs text-slate-600 font-semibold mt-1">
                                                    {r.venueName || "—"} • {prettyDow(r.dayOfWeek)}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => navigate(`/dashboard/tutor/class/${r.recurrenceClassId}/validate`)}
                                                className="shrink-0 inline-flex items-center justify-center px-3 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold transition text-xs"
                                            >
                                                Validate
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ Recurrence session modal: students + payment method chosen */}
            {modal.open && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setModal({ open: false })} />
                    <div className="relative w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-3xl border border-black shadow-[0_30px_80px_rgba(2,6,23,0.35)]">
                        <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-lg font-extrabold text-slate-900 truncate">
                                        {modal.classItem.subject || "—"} • Grade {modal.classItem.grade ?? "—"}
                                    </div>
                                    <div className="text-sm text-slate-600 font-semibold mt-1">
                                        {modal.classItem.venueName || "—"} • {prettyDow(modal.classItem.dayOfWeek)}
                                    </div>
                                    <div className="text-sm text-slate-700 font-extrabold mt-2">
                                        {formatScheduleLine(
                                            modal.recurrenceItem.classDate,
                                            modal.classItem.timeslot?.startTime ?? null,
                                            modal.classItem.timeslot?.endTime ?? null
                                        )}
                                    </div>

                                    {modal.recurrenceItem.recurrenceStatus !== "SCHEDULED" && (
                                        <div className="mt-2 inline-flex items-center text-[11px] font-extrabold px-2 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                                            {modal.recurrenceItem.recurrenceStatus}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setModal({ open: false })}
                                    className="shrink-0 rounded-2xl px-3 py-2 text-sm font-extrabold border border-slate-200 hover:bg-slate-50 transition"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-extrabold text-slate-900">
                                        Students ({modal.recurrenceItem.students?.length ?? 0})
                                    </p>
                                </div>

                                <div className="mt-3 max-h-[360px] overflow-auto space-y-2">
                                    {!modal.recurrenceItem.students?.length ? (
                                        <div className="text-sm text-slate-600 font-semibold">No students enrolled for this session.</div>
                                    ) : (
                                        modal.recurrenceItem.students.map((s) => (
                                            <div
                                                key={s.studentUserId}
                                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_6px_18px_rgba(2,6,23,0.06)]"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-extrabold text-slate-900 truncate">
                                                            {s.studentFirstName} {s.studentLastName}
                                                        </div>
                                                        <div className="text-xs text-slate-600 font-semibold mt-1 truncate">
                                                            {s.studentEmail}
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0 text-right">
                                                        <div className="text-[11px] font-extrabold px-2 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                                                            {paymentLabel(s.paymentMethodSelected)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="mt-5 flex justify-center">
                                <button
                                    onClick={() => {
                                        setModal({ open: false });
                                    }}
                                    className="
      inline-flex items-center justify-center
      px-7 py-3
      rounded-2xl
      border-2 border-rose-700
      bg-rose-700
      text-white
      font-extrabold
      transition
    "
                                >
                                    Cancel class
                                </button>
                            </div>




                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
