// PendingGroupClasses.tsx
import { useEffect, useMemo, useState } from "react";

// API endpoint
const API_BASE = "http://localhost:8080";
const CLASSES_BASE = `${API_BASE}/api/classes`;
const PENDING_CLASSES_URL = `${CLASSES_BASE}/get-all-pending-create-class-applications`;
const ACCEPT_CREATE_CLASS_URL = `${CLASSES_BASE}/accept-create-class-application`;

// Types
export const DAY_OF_WEEK = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
] as const;

export type DayOfWeekEnum = (typeof DAY_OF_WEEK)[number];

export type PendingGroupClassDTO = {
    venueName: string;
    groupClassId: number;
    venueTimeslotId: number;
    tutorFirstName: string;
    tutorLastName: string;
    subject: string;
    startTime: string;
    endTime: string;
    dayOfWeek: DayOfWeekEnum;
    classCapacity: number;
    venueCapacity: number;
    grade: number;
    startDate: string; // "YYYY-MM-DD"
    tutorId: number;
    price: number;
    language: string;
    classAbout: string;
    town: string;
};

// ✅ matches your new backend AdminReviewClassDTO
type AdminReviewClassDTO = {
    groupClassId: number;
    startDate: string; // "YYYY-MM-DD"
    endDate: string;   // "YYYY-MM-DD"
    day: DayOfWeekEnum;
};

// ---------- Helpers (date/time) ----------
function pad2(n: number) {
    return String(n).padStart(2, "0");
}

function toIsoLocalDate(d: Date): string {
    // uses local calendar values (no UTC shifting)
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    return `${y}-${m}-${day}`;
}

function parseIsoDateLocal(iso: string): Date {
    // "YYYY-MM-DD" -> local midnight date object
    // Avoids timezone weirdness by forcing local time.
    const [y, m, d] = iso.split("-").map((x) => Number(x));
    return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

function formatTime(timeStr: string): string {
    if (!timeStr) return "";
    const time = timeStr.trim();
    if (time.length >= 5) return time.substring(0, 5);
    return time;
}

function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    try {
        const date = parseIsoDateLocal(dateStr);
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return dateStr;
    }
}

function formatPrice(price: number): string {
    if (!price) return "Free";
    return `R${price.toFixed(2)}`;
}

function formatDayOfWeek(day: DayOfWeekEnum | string): string {
    const s = String(day || "").trim();
    if (!s) return "";
    const lower = s.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function getTutorFullName(firstName: string, lastName: string): string {
    return `${firstName || ""} ${lastName || ""}`.trim() || "Unknown Tutor";
}

function dayEnumToJsDay(day: DayOfWeekEnum): number {
    // JS: 0=Sunday .. 6=Saturday
    switch (day) {
        case "SUNDAY":
            return 0;
        case "MONDAY":
            return 1;
        case "TUESDAY":
            return 2;
        case "WEDNESDAY":
            return 3;
        case "THURSDAY":
            return 4;
        case "FRIDAY":
            return 5;
        case "SATURDAY":
            return 6;
        default:
            return 1;
    }
}

// ---------- API fetch helper ----------
async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(input, {
        ...init,
        headers: {
            ...(init.headers || {}),
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
    }

    return res;
}

// ---------- Calendar (weekday-locked) ----------
type EndDatePickerProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: (endDateIso: string) => void;

    title: string;
    requiredJsDay: number; // 0..6
    minDateIso: string; // "YYYY-MM-DD" (usually startDate)
    selectedIso: string | null;
    setSelectedIso: (v: string | null) => void;
    error: string | null;
};

function EndDatePickerModal(props: EndDatePickerProps) {
    const {
        open,
        onClose,
        onConfirm,
        title,
        requiredJsDay,
        minDateIso,
        selectedIso,
        setSelectedIso,
        error,
    } = props;

    const minDate = useMemo(() => parseIsoDateLocal(minDateIso), [minDateIso]);

    // month shown (local)
    const [monthCursor, setMonthCursor] = useState<Date>(() => {
        const base = selectedIso ? parseIsoDateLocal(selectedIso) : parseIsoDateLocal(minDateIso);
        return new Date(base.getFullYear(), base.getMonth(), 1);
    });

    useEffect(() => {
        if (!open) return;
        const base = selectedIso ? parseIsoDateLocal(selectedIso) : parseIsoDateLocal(minDateIso);
        setMonthCursor(new Date(base.getFullYear(), base.getMonth(), 1));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, minDateIso]);

    const monthLabel = monthCursor.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });

    const firstDayOfMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const startWeekday = firstDayOfMonth.getDay(); // 0..6
    const daysInMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate();

    // Build grid of 42 cells (6 weeks)
    const cells: Array<{ date: Date | null; iso: string | null }> = [];
    for (let i = 0; i < 42; i++) {
        const dayNum = i - startWeekday + 1;
        if (dayNum < 1 || dayNum > daysInMonth) {
            cells.push({ date: null, iso: null });
        } else {
            const d = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), dayNum, 0, 0, 0, 0);
            cells.push({ date: d, iso: toIsoLocalDate(d) });
        }
    }

    const canPick = (d: Date) => {
        // must be >= minDate and match required weekday
        if (d.getTime() < minDate.getTime()) return false;
        if (d.getDay() !== requiredJsDay) return false;
        return true;
    };

    const isSelected = (iso: string | null) => !!iso && iso === selectedIso;

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80]">
            <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />

            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-[96vw] max-w-lg rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl shadow-slate-950/80 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-semibold text-slate-100">Choose end date</div>
                            <div className="text-xs text-slate-400 mt-0.5">{title}</div>
                        </div>

                        <button
                            className="h-9 w-9 rounded-full border border-slate-700 hover:border-sky-500 bg-slate-900/70 flex items-center justify-center transition"
                            onClick={onClose}
                            aria-label="Close"
                            title="Close"
                        >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                                <path d="M6 6l12 12M18 6L6 18" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <button
                                className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 text-slate-200 transition"
                                onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
                            >
                                ← Prev
                            </button>

                            <div className="text-sm text-slate-200 font-semibold">{monthLabel}</div>

                            <button
                                className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 text-slate-200 transition"
                                onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
                            >
                                Next →
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-[11px] text-slate-500 mb-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                                <div key={d} className="text-center py-1">
                                    {d}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {cells.map((c, idx) => {
                                if (!c.date || !c.iso) {
                                    return <div key={idx} className="h-10 rounded-xl bg-transparent" />;
                                }

                                const ok = canPick(c.date);
                                const selected = isSelected(c.iso);

                                return (
                                    <button
                                        key={c.iso}
                                        type="button"
                                        disabled={!ok}
                                        onClick={() => setSelectedIso(c.iso)}
                                        className={[
                                            "h-10 rounded-xl text-sm transition border",
                                            selected
                                                ? "bg-sky-500/90 text-black border-sky-400"
                                                : ok
                                                    ? "bg-slate-950/40 text-slate-100 border-slate-800 hover:border-sky-500 hover:bg-slate-800/30"
                                                    : "bg-slate-950/20 text-slate-600 border-slate-800/50 cursor-not-allowed opacity-70",
                                        ].join(" ")}
                                        title={
                                            ok
                                                ? `Pick ${c.iso}`
                                                : `Only ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][requiredJsDay]} dates allowed (and not before ${minDateIso})`
                                        }
                                    >
                                        {c.date.getDate()}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-3 text-xs text-slate-500">
                            Only <span className="text-slate-300 font-semibold">{["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][requiredJsDay]}</span>{" "}
                            dates are selectable. Dates before <span className="text-slate-300 font-semibold">{minDateIso}</span> are disabled.
                        </div>

                        {selectedIso && (
                            <div className="mt-3 text-sm text-slate-200">
                                Selected end date: <span className="font-semibold">{formatDate(selectedIso)}</span>
                            </div>
                        )}

                        {error && (
                            <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-end gap-2">
                        <button
                            className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 text-slate-200 transition"
                            onClick={onClose}
                        >
                            Cancel
                        </button>

                        <button
                            className="text-xs px-4 py-1.5 rounded-full bg-emerald-500/90 hover:bg-emerald-400 text-black font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={!selectedIso}
                            onClick={() => {
                                if (!selectedIso) return;
                                onConfirm(selectedIso);
                            }}
                        >
                            Confirm end date
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---------- Main component ----------
interface PendingGroupClassesProps {
    onClose: () => void;
}

export default function PendingGroupClasses({ onClose }: PendingGroupClassesProps) {
    const [applications, setApplications] = useState<PendingGroupClassDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedClassId, setExpandedClassId] = useState<number | null>(null);
    const [actionLoadingById, setActionLoadingById] = useState<Record<number, boolean>>({});
    const [actionErrorById, setActionErrorById] = useState<Record<number, string | null>>({});

    // ✅ end-date picker state
    const [endPickerOpen, setEndPickerOpen] = useState(false);
    const [endPickerApp, setEndPickerApp] = useState<PendingGroupClassDTO | null>(null);
    const [endPickerSelectedIso, setEndPickerSelectedIso] = useState<string | null>(null);
    const [endPickerError, setEndPickerError] = useState<string | null>(null);

    const fetchApplications = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await apiFetch(PENDING_CLASSES_URL, { method: "GET" });
            const data: PendingGroupClassDTO[] = await res.json();
            setApplications(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load pending applications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openEndPickerFor = (app: PendingGroupClassDTO) => {
        setEndPickerError(null);
        setEndPickerApp(app);
        setEndPickerSelectedIso(null); // admin must choose
        setEndPickerOpen(true);
    };

    const closeEndPicker = () => {
        setEndPickerOpen(false);
        setEndPickerApp(null);
        setEndPickerSelectedIso(null);
        setEndPickerError(null);
    };

    const approveWithEndDate = async (app: PendingGroupClassDTO, endDateIso: string) => {
        const groupClassId = app.groupClassId;

        setActionErrorById((prev) => ({ ...prev, [groupClassId]: null }));
        setActionLoadingById((prev) => ({ ...prev, [groupClassId]: true }));

        try {
            // Validate: endDate must be >= startDate and same weekday
            const start = parseIsoDateLocal(app.startDate);
            const end = parseIsoDateLocal(endDateIso);

            if (end.getTime() < start.getTime()) {
                throw new Error("End date cannot be before the start date.");
            }

            const requiredJsDay = dayEnumToJsDay(app.dayOfWeek);
            if (end.getDay() !== requiredJsDay) {
                throw new Error(`End date must fall on a ${formatDayOfWeek(app.dayOfWeek)}.`);
            }

            const payload: AdminReviewClassDTO = {
                groupClassId: app.groupClassId,
                startDate: app.startDate,
                endDate: endDateIso,
                day: app.dayOfWeek,
            };

            await apiFetch(ACCEPT_CREATE_CLASS_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            setApplications((prev) => prev.filter((x) => x.groupClassId !== groupClassId));
            if (expandedClassId === groupClassId) setExpandedClassId(null);

            closeEndPicker();
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed to approve";
            // show error inside picker (best UX)
            setEndPickerError(msg);
            setActionErrorById((prev) => ({ ...prev, [groupClassId]: msg }));
        } finally {
            setActionLoadingById((prev) => ({ ...prev, [groupClassId]: false }));
        }
    };

    const rejectApplication = async (groupClassId: number, reason: string) => {
        setActionErrorById((prev) => ({ ...prev, [groupClassId]: null }));
        setActionLoadingById((prev) => ({ ...prev, [groupClassId]: true }));

        try {
            // If your backend reject endpoint differs, change this URL accordingly.
            await apiFetch(`${CLASSES_BASE}/${groupClassId}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });

            setApplications((prev) => prev.filter((app) => app.groupClassId !== groupClassId));
            if (expandedClassId === groupClassId) setExpandedClassId(null);
        } catch (e) {
            setActionErrorById((prev) => ({
                ...prev,
                [groupClassId]: e instanceof Error ? e.message : "Failed to reject",
            }));
        } finally {
            setActionLoadingById((prev) => ({ ...prev, [groupClassId]: false }));
        }
    };

    const applicationCount = applications.length;

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />

            {/* ✅ End date picker modal */}
            <EndDatePickerModal
                open={endPickerOpen}
                onClose={closeEndPicker}
                onConfirm={(iso) => {
                    if (!endPickerApp) return;
                    approveWithEndDate(endPickerApp, iso);
                }}
                title={
                    endPickerApp
                        ? `${endPickerApp.subject} · Grade ${endPickerApp.grade} · ${formatDayOfWeek(endPickerApp.dayOfWeek)} ${formatTime(endPickerApp.startTime)}-${formatTime(endPickerApp.endTime)}`
                        : ""
                }
                requiredJsDay={endPickerApp ? dayEnumToJsDay(endPickerApp.dayOfWeek) : 1}
                minDateIso={endPickerApp ? endPickerApp.startDate : toIsoLocalDate(new Date())}
                selectedIso={endPickerSelectedIso}
                setSelectedIso={setEndPickerSelectedIso}
                error={endPickerError}
            />

            <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6">
                <div className="w-[95vw] h-[85vh] md:w-[80vw] md:h-[80vh] rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl shadow-slate-950/80 relative overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
                        <div>
                            <div className="text-sm font-semibold text-slate-100">Pending Group Class Applications</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                                Review new class proposals · {loading ? "…" : applicationCount} pending
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 text-slate-200 transition"
                                onClick={fetchApplications}
                            >
                                Refresh
                            </button>
                            <button
                                className="h-9 w-9 rounded-full border border-slate-700 hover:border-sky-500 bg-slate-900/70 flex items-center justify-center transition"
                                onClick={onClose}
                                aria-label="Close"
                                title="Close"
                            >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                                    <path d="M6 6l12 12M18 6L6 18" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60">
                        <div className="flex flex-wrap gap-2">
                            <button
                                className="text-xs px-3 py-1 rounded-full bg-slate-900/70 border border-slate-800 hover:border-sky-500 transition"
                                onClick={() => alert("Filter by subject")}
                            >
                                Subject
                            </button>
                            <button
                                className="text-xs px-3 py-1 rounded-full bg-slate-900/70 border border-slate-800 hover:border-sky-500 transition"
                                onClick={() => alert("Filter by town")}
                            >
                                Town
                            </button>
                            <button
                                className="text-xs px-3 py-1 rounded-full bg-slate-900/70 border border-slate-800 hover:border-sky-500 transition"
                                onClick={() => alert("Filter by grade")}
                            >
                                Grade
                            </button>
                            <button
                                className="text-xs px-3 py-1 rounded-full bg-slate-900/70 border border-slate-800 hover:border-sky-500 transition"
                                onClick={() => alert("Filter by date")}
                            >
                                Start Date
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="h-[calc(100%-116px)] overflow-y-auto">
                        <div className="p-5">
                            {loading && <div className="text-sm text-slate-400 py-6">Loading pending class applications…</div>}

                            {!loading && error && (
                                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                    Failed to load: {error}
                                </div>
                            )}

                            {!loading && !error && applications.length === 0 && (
                                <div className="text-sm text-slate-400 py-6">No pending class applications right now.</div>
                            )}

                            {!loading && !error && applications.length > 0 && (
                                <div className="space-y-4">
                                    {applications.map((app) => {
                                        const isOpen = expandedClassId === app.groupClassId;
                                        const isRowLoading = !!actionLoadingById[app.groupClassId];
                                        const rowError = actionErrorById[app.groupClassId];

                                        return (
                                            <div
                                                key={app.groupClassId}
                                                className={`rounded-2xl border border-slate-800 bg-slate-950/40 p-4 cursor-pointer transition-all ${
                                                    isOpen ? "ring-2 ring-sky-500/30 bg-slate-800/30" : "hover:bg-slate-800/20"
                                                }`}
                                                onClick={() => setExpandedClassId(isOpen ? null : app.groupClassId)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h3 className="text-sm font-semibold text-slate-100">
                                                                {app.subject} - Grade {app.grade}
                                                            </h3>
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                                                {app.language}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                                            <div>
                                                                <span className="text-slate-400">Tutor:</span>{" "}
                                                                <span className="text-slate-200">
                                                                    {getTutorFullName(app.tutorFirstName, app.tutorLastName)}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400">Venue:</span>{" "}
                                                                <span className="text-slate-200">{app.venueName}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400">Time:</span>{" "}
                                                                <span className="text-slate-200">
                                                                    {formatDayOfWeek(app.dayOfWeek)} {formatTime(app.startTime)}-{formatTime(app.endTime)}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400">Start Date:</span>{" "}
                                                                <span className="text-slate-200">{formatDate(app.startDate)}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400">Capacity:</span>{" "}
                                                                <span className="text-slate-200">
                                                                    {app.classCapacity}/{app.venueCapacity} seats
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400">Town:</span>{" "}
                                                                <span className="text-slate-200 capitalize">{app.town}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400">Price:</span>{" "}
                                                                <span className="text-slate-200">{formatPrice(app.price)}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400">Status:</span>{" "}
                                                                <span className="text-amber-400 font-medium">Pending</span>
                                                            </div>
                                                        </div>

                                                        {rowError && <div className="mt-2 text-xs text-red-300">{rowError}</div>}
                                                    </div>

                                                    <div className="flex flex-col gap-2 ml-4">
                                                        {/* ✅ Approve now opens calendar picker */}
                                                        <button
                                                            disabled={isRowLoading}
                                                            className={`px-3 py-1.5 text-xs rounded-full font-semibold transition ${
                                                                isRowLoading
                                                                    ? "bg-emerald-500/40 text-black/60 cursor-not-allowed"
                                                                    : "bg-emerald-500/90 text-black hover:bg-emerald-400"
                                                            }`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openEndPickerFor(app);
                                                            }}
                                                        >
                                                            {isRowLoading ? "Working…" : "Approve"}
                                                        </button>

                                                        <button
                                                            disabled={isRowLoading}
                                                            className={`px-3 py-1.5 text-xs rounded-full font-semibold transition ${
                                                                isRowLoading
                                                                    ? "bg-red-500/30 text-white/60 cursor-not-allowed"
                                                                    : "bg-red-500/80 text-white hover:bg-red-400"
                                                            }`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const reason = prompt("Rejection reason:");
                                                                if (reason) rejectApplication(app.groupClassId, reason);
                                                            }}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Expanded Details */}
                                                {isOpen && (
                                                    <div className="mt-4 pt-4 border-t border-slate-800">
                                                        <div className="grid md:grid-cols-2 gap-4">
                                                            <div>
                                                                <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Class Details</h4>
                                                                <div className="space-y-1 text-sm">
                                                                    <div>
                                                                        <span className="text-slate-400">Class ID:</span>{" "}
                                                                        <span className="text-slate-200">#{app.groupClassId}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-slate-400">Tutor ID:</span>{" "}
                                                                        <span className="text-slate-200">#{app.tutorId}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-slate-400">Venue Timeslot ID:</span>{" "}
                                                                        <span className="text-slate-200">#{app.venueTimeslotId}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2">About This Class</h4>
                                                                <div className="text-sm text-slate-200 bg-slate-900/30 rounded-xl p-3">
                                                                    {app.classAbout || "No description provided."}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                                            <button
                                                                className="text-sky-400 hover:text-sky-300 transition"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setExpandedClassId(null);
                                                                }}
                                                            >
                                                                Collapse
                                                            </button>
                                                            <span>Click outside to collapse</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/70 px-5 py-3 flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                            Tip: Approve opens a weekday-locked calendar so you pick the final lesson date.
                        </div>
                        <button
                            className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 text-slate-200 transition"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
