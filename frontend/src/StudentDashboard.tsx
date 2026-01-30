import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./components/TopBar";
import { API_BASE_URL } from "./config/api";

type UserRoleLower = "student" | "tutor" | "admin";

type TimeslotsDTO = {
    id?: number;
    startTime?: string; // "14:00:00"
    endTime?: string;   // "15:00:00"
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
    // ✅ uses your backend controller: @PatchMapping("/{classId}/students/me/cancel")
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
    classDate: string;
    recurrenceStatus: RecurrenceStatus;
    subject: string | null;
    grade: number | null;
    venueName: string | null;
    startTime: string | null;
    endTime: string | null;
};

type ModalState =
    | { open: false }
    | { open: true; kind: "class"; item: MyClassesDTO };

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

    // ✅ Fetch/refresh function (used on load and after cancel)
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
            setData(Array.isArray(payload) ? payload : []);
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

    const hasAnything = myClasses.length > 0 || scheduleRows.length > 0;

    // ✅ Cancel the class fully (backend cancels all upcoming recurrences)
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

            // ✅ refresh from backend so schedule + classes are correct
            await refreshDashboard();
        } catch (e: any) {
            setActionError(e?.message || "Failed to cancel class");
        } finally {
            setActionLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 overflow-x-hidden">
            <TopBar customActions={null} />

            <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
                <div className="max-w-5xl mx-auto space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Student Dashboard</h1>

                        {isAuthenticated && isStudent ? (
                            <button
                                onClick={goFindClass}
                                className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white transition font-semibold"
                            >
                                Find a class
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M10 18a8 8 0 1 1 5.293-14.293A8 8 0 0 1 10 18z" strokeWidth="1.8" />
                                    <path d="M21 21l-4.3-4.3" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                            </button>
                        ) : null}
                    </div>

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
                        {/* Schedule */}
                        <div className="rounded-3xl border border-black bg-white p-5 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                            <div className="flex items-center justify-between">
                                <p className="text-base font-extrabold text-slate-900">Schedule</p>
                                <p className="text-xs text-slate-500 font-semibold">
                                    {scheduleRows.length ? `${scheduleRows.length} upcoming` : "No upcoming"}
                                </p>
                            </div>

                            <div className="mt-4 rounded-2xl border border-slate-300 bg-slate-200">
                                <div className="max-h-[360px] overflow-auto p-2">
                                    {!scheduleRows.length && !loading ? (
                                        <div className="p-3 text-sm text-slate-600 font-semibold">Nothing scheduled yet.</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {scheduleRows.map((r, idx) => (
                                                <div
                                                    key={`${r.classId}-${r.classDate}-${idx}`}
                                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_6px_18px_rgba(2,6,23,0.08)]"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-extrabold text-slate-900 truncate">
                                                                {r.subject} • Grade {r.grade ?? "—"}
                                                            </div>

                                                            <div className="text-xs text-slate-700 font-semibold mt-1">
                                                                {formatScheduleLine(r.classDate, r.startTime, r.endTime)}
                                                            </div>

                                                            <div className="text-xs text-slate-600 font-semibold mt-1">
                                                                {r.venueName || "—"}
                                                            </div>
                                                        </div>

                                                        <div className="shrink-0 flex items-center gap-2">
                                                            {r.recurrenceStatus === "CANCELLED" && (
                                                                <span className="text-[11px] font-extrabold px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                  CANCELLED
                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
                                                                {prettyDow(c.dayOfWeek)} • {formatTime(c.timeslot?.startTime)}–{formatTime(c.timeslot?.endTime)}
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

            <footer className="px-4 py-5 border-t border-slate-200 text-sm text-slate-600 text-center font-medium">
                © {new Date().getFullYear()} Sumit. All rights reserved.
            </footer>

            {/* ✅ My classes modal only */}
            {modal.open && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => !actionLoading && setModal({ open: false })}
                    />
                    <div className="relative w-full md:max-w-xl bg-white rounded-t-3xl md:rounded-3xl border border-black shadow-[0_30px_80px_rgba(2,6,23,0.35)]">
                        <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-lg font-extrabold text-slate-900">
                                        {modal.item.subject} • Grade {modal.item.grade ?? "—"}
                                    </div>
                                    <div className="text-sm text-slate-600 font-semibold mt-1">{modal.item.venueName || "—"}</div>
                                </div>

                                <button
                                    onClick={() => !actionLoading && setModal({ open: false })}
                                    className="shrink-0 rounded-2xl px-3 py-2 text-sm font-extrabold border border-slate-200 hover:bg-slate-50 transition"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 font-semibold">Weekly</span>
                                    <span className="text-slate-900 font-extrabold">
                    {prettyDow(modal.item.dayOfWeek)} • {formatTime(modal.item.timeslot?.startTime)}–{formatTime(modal.item.timeslot?.endTime)}
                  </span>
                                </div>

                                {/* ✅ small permanent warning box (what you asked) */}
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 font-extrabold">
                                    Cancelling this class will cancel it permanently.
                                </div>

                                <div className="text-xs text-slate-600 font-semibold pt-2">
                                    Leaving will remove you from the class and cancel all your upcoming sessions for it.
                                </div>
                            </div>

                            <div className="mt-5 flex flex-col md:flex-row gap-3">
                                <button
                                    disabled={actionLoading}
                                    onClick={() => cancelClassFully(modal.item.classId)}
                                    className="w-full inline-flex items-center justify-center px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-extrabold transition"
                                >
                                    {actionLoading ? "Cancelling…" : "Cancel / leave this class"}
                                </button>

                                <button
                                    disabled={actionLoading}
                                    onClick={() => setModal({ open: false })}
                                    className="w-full inline-flex items-center justify-center px-4 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 disabled:opacity-60 font-extrabold transition"
                                >
                                    Back
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
