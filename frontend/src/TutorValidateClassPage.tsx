import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
type PaymentMethodSelectedEnum = "CASH" | "FREE_LESSON";

// tutor marks outcome
type AttendanceStatus = "ATTENDED" | "ABSENT" | "CANCELLED" | "TUTOR_CANCELLED";

type StudentDTO = {
    studentUserId: number;
    recurrenceClassStudentId: number; // ✅ recurrence_class_student.id
    studentFirstName: string;
    studentLastName: string;
    studentEmail: string;
    paymentMethodSelected: PaymentMethodSelectedEnum | null; // what student picked originally
};

type TutorRecurrenceClassesDTO = {
    recurrenceClassId: number; // group_class_recurrence.id
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

// local row state (key by recurrenceClassStudentId)
type ValidateRow = {
    recurrenceStudentId: number; // ✅ recurrence_class_student.id
    studentUserId: number;
    status: AttendanceStatus | null;
    paymentMethodSelected: PaymentMethodSelectedEnum | null;
    amountPaid: string; // for CASH only ("" if none)
};

type ValidatePayload = {
    groupClassRecurrenceId: number;
    studentPaymentDTOs: Array<{
        recurrenceStudentId: number;
        status: AttendanceStatus;
        paymentMethodSelected: PaymentMethodSelectedEnum | null;
        amountPaid: string | null;
    }>;
};

const API = {
    tutorAllClasses: `${API_BASE_URL}/api/classes/tutor-get-all-classes`,
    validateRecurrence: `${API_BASE_URL}/api/classes/tutor/recurrence/validate`,
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
            `Expected JSON but got ${ct || "unknown content-type"}.\n` + (text ? text.slice(0, 300) : "(empty body)")
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
    return d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function prettyEnum(v?: string | null) {
    if (!v) return "—";
    return v
        .toLowerCase()
        .split("_")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
        .join(" ");
}

function paymentLabel(p: PaymentMethodSelectedEnum | null | undefined) {
    if (!p) return "—";
    return prettyEnum(p);
}

function statusBadgeColor(status: AttendanceStatus | null) {
    if (!status) return "bg-slate-100 text-slate-800 border-slate-200";
    if (status === "ATTENDED") return "bg-emerald-100 text-emerald-900 border-emerald-200";
    if (status === "ABSENT") return "bg-amber-100 text-amber-900 border-amber-200";
    return "bg-rose-100 text-rose-900 border-rose-200";
}

export default function TutorValidateRecurrencePage() {
    const navigate = useNavigate();
    const params = useParams();
    const recurrenceId = Number(params.recurrenceId);

    const token = localStorage.getItem("token");
    const userRoleLower = normalizeRoleLower(localStorage.getItem("userRole"));

    const isAuthenticated = !!token;
    const isTutor = userRoleLower === "tutor";

    const authHeaders = useMemo(() => {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    }, [token]);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [ok, setOk] = useState<string | null>(null);

    const [classItem, setClassItem] = useState<TutorClassesDTO | null>(null);
    const [recurrenceItem, setRecurrenceItem] = useState<TutorRecurrenceClassesDTO | null>(null);

    const [rows, setRows] = useState<ValidateRow[]>([]);

    // role guard
    useEffect(() => {
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }
        if (userRoleLower !== "tutor") {
            navigate(`/dashboard/${userRoleLower}`, { replace: true });
        }
    }, [token, userRoleLower, navigate]);

    // load session
    useEffect(() => {
        const load = async () => {
            if (!token || !isTutor) return;

            if (!recurrenceId || Number.isNaN(recurrenceId)) {
                setError("Invalid recurrence id.");
                return;
            }

            setLoading(true);
            setError(null);
            setOk(null);

            try {
                const res = await fetch(API.tutorAllClasses, { method: "GET", headers: authHeaders });

                if (res.status === 401 || res.status === 403) {
                    localStorage.removeItem("token");
                    navigate("/login", { replace: true });
                    return;
                }
                if (!res.ok) throw new Error(await readErrorText(res));

                const payload = await safeReadJson<TutorClassesDTO[]>(res);
                const all = Array.isArray(payload) ? payload : [];

                let foundClass: TutorClassesDTO | null = null;
                let foundRec: TutorRecurrenceClassesDTO | null = null;

                for (const c of all) {
                    const rr = (c.recurrenceClasses || []).find((r) => r.recurrenceClassId === recurrenceId);
                    if (rr) {
                        foundClass = c;
                        foundRec = rr;
                        break;
                    }
                }

                if (!foundClass || !foundRec) {
                    setError("Could not find this session. It may have been removed or you don’t have access.");
                    setClassItem(null);
                    setRecurrenceItem(null);
                    setRows([]);
                    return;
                }

                setClassItem(foundClass);
                setRecurrenceItem(foundRec);

                const init: ValidateRow[] = (foundRec.students || []).map((s) => ({
                    recurrenceStudentId: s.recurrenceClassStudentId, // ✅ key
                    studentUserId: s.studentUserId,
                    status: null,
                    paymentMethodSelected:
                        s.paymentMethodSelected === "FREE_LESSON"
                            ? "FREE_LESSON"
                            : s.paymentMethodSelected === "CASH"
                                ? "CASH"
                                : null,
                    amountPaid: "",
                }));

                setRows(init);
            } catch (e: any) {
                setError(e?.message || "Failed to load this session");
                setClassItem(null);
                setRecurrenceItem(null);
                setRows([]);
            } finally {
                setLoading(false);
            }
        };

        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, isTutor, recurrenceId, authHeaders, navigate]);

    function getStudentOrigPayment(recurrenceStudentId: number): PaymentMethodSelectedEnum | null {
        const orig =
            recurrenceItem?.students?.find((s) => s.recurrenceClassStudentId === recurrenceStudentId)?.paymentMethodSelected ??
            null;
        return orig;
    }

    function updateRow(recurrenceStudentId: number, patch: Partial<ValidateRow>) {
        setRows((prev) =>
            prev.map((r) => {
                if (r.recurrenceStudentId !== recurrenceStudentId) return r;

                const origPayment = getStudentOrigPayment(recurrenceStudentId);
                const isFreeLessonLocked = origPayment === "FREE_LESSON";

                const next: ValidateRow = { ...r, ...patch };

                // rule: if not attended => payment cleared + amount cleared
                if (next.status && next.status !== "ATTENDED") {
                    next.paymentMethodSelected = null;
                    next.amountPaid = "";
                    return next;
                }

                // if attended, restore default payment if missing
                if (next.status === "ATTENDED" && !next.paymentMethodSelected) {
                    next.paymentMethodSelected =
                        origPayment === "FREE_LESSON" ? "FREE_LESSON" : origPayment === "CASH" ? "CASH" : "CASH";
                }

                // FREE_LESSON locked
                if (next.status === "ATTENDED" && isFreeLessonLocked) {
                    next.paymentMethodSelected = "FREE_LESSON";
                    next.amountPaid = "";
                }

                // if CASH selected but no amount, keep empty and block submit
                if (next.status === "ATTENDED" && next.paymentMethodSelected !== "CASH") {
                    next.amountPaid = "";
                }

                return next;
            })
        );
    }

    function setAllStatus(status: AttendanceStatus) {
        setRows((prev) =>
            prev.map((r) => {
                const origPayment = getStudentOrigPayment(r.recurrenceStudentId);
                const isFreeLessonLocked = origPayment === "FREE_LESSON";

                const next: ValidateRow = { ...r, status };

                if (status !== "ATTENDED") {
                    next.paymentMethodSelected = null;
                    next.amountPaid = "";
                    return next;
                }

                next.paymentMethodSelected = (r.paymentMethodSelected ?? origPayment ?? null) as any;

                if (isFreeLessonLocked) {
                    next.paymentMethodSelected = "FREE_LESSON";
                    next.amountPaid = "";
                }

                if (!next.paymentMethodSelected) {
                    next.paymentMethodSelected = "CASH";
                }

                if (next.paymentMethodSelected !== "CASH") {
                    next.amountPaid = "";
                }

                return next;
            })
        );
    }

    const canSubmit = useMemo(() => {
        if (!recurrenceItem) return false;
        if (!rows.length) return false;

        for (const r of rows) {
            if (!r.status) return false;

            if (r.status === "ATTENDED") {
                if (!r.paymentMethodSelected) return false;
                if (r.paymentMethodSelected === "CASH") {
                    const v = r.amountPaid.trim();
                    if (!v) return false;
                    // basic number check (backend will re-validate)
                    const n = Number(v);
                    if (!Number.isFinite(n) || n < 0) return false;
                }
            }
        }
        return true;
    }, [rows, recurrenceItem]);

    async function submit() {
        if (!recurrenceItem) return;

        setSubmitting(true);
        setError(null);
        setOk(null);

        try {
            const payload: ValidatePayload = {
                groupClassRecurrenceId: recurrenceItem.recurrenceClassId,
                studentPaymentDTOs: rows.map((r) => {
                    const isAttended = r.status === "ATTENDED";
                    const pm = isAttended ? r.paymentMethodSelected : null;

                    // If not paid / no payment info => amountPaid null
                    // FREE_LESSON => amountPaid null (backend sets 0)
                    // CASH => amountPaid required
                    let amountPaid: string | null = null;
                    if (isAttended && pm === "CASH") {
                        amountPaid = r.amountPaid.trim() || null;
                    }

                    return {
                        recurrenceStudentId: r.recurrenceStudentId,
                        status: r.status as AttendanceStatus,
                        paymentMethodSelected: pm,
                        amountPaid,
                    };
                }),
            };

            const res = await fetch(API.validateRecurrence, {
                method: "POST", // ✅ matches your controller
                headers: authHeaders,
                body: JSON.stringify(payload),
            });

            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem("token");
                navigate("/login", { replace: true });
                return;
            }

            if (!res.ok) throw new Error(await readErrorText(res));

            setOk("Session saved.");
            navigate("/dashboard/tutor", { replace: true });
        } catch (e: any) {
            setError(e?.message || "Failed to submit validation");
        } finally {
            setSubmitting(false);
        }
    }

    const headerLine = useMemo(() => {
        if (!classItem || !recurrenceItem) return "—";
        const date = formatDateLabel(recurrenceItem.classDate);
        const time = `${formatTime(classItem.timeslot?.startTime ?? null)}–${formatTime(classItem.timeslot?.endTime ?? null)}`;
        return `${time} • ${date}`;
    }, [classItem, recurrenceItem]);

    return (
        <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 overflow-x-hidden">
            <TopBar customActions={null} />

            <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
                <div className="max-w-4xl mx-auto space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Validate session</h1>
                            <p className="text-sm text-slate-600 font-semibold mt-1">Mark attendance and confirm payment for each student.</p>
                        </div>

                        <button
                            onClick={() => navigate("/dashboard/tutor")}
                            className="inline-flex items-center justify-center px-4 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 font-extrabold transition"
                        >
                            Back
                        </button>
                    </div>

                    {(error || ok) && (
                        <div
                            className={
                                ok
                                    ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 font-extrabold"
                                    : "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-semibold whitespace-pre-wrap"
                            }
                        >
                            {ok || error}
                        </div>
                    )}

                    {loading && <div className="text-sm text-slate-600 font-semibold">Loading session…</div>}

                    {!loading && classItem && recurrenceItem && (
                        <>
                            {/* Session summary */}
                            <div className="rounded-3xl border border-black bg-white p-5 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-lg font-extrabold text-slate-900 truncate">
                                            {classItem.subject || "—"} • Grade {classItem.grade ?? "—"}
                                        </div>
                                        <div className="text-sm text-slate-600 font-semibold mt-1">
                                            {classItem.venueName || "—"} • {prettyDow(classItem.dayOfWeek)}
                                        </div>
                                        <div className="text-sm text-slate-700 font-extrabold mt-2">{headerLine}</div>

                                        <div className="mt-2 inline-flex items-center text-[11px] font-extrabold px-2 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                                            {prettyEnum(recurrenceItem.recurrenceStatus)}
                                        </div>
                                    </div>

                                    {/* bulk actions */}
                                    <div className="shrink-0 flex flex-col gap-2">
                                        <button
                                            onClick={() => setAllStatus("ATTENDED")}
                                            className="text-xs font-extrabold px-3 py-2 rounded-2xl border border-slate-200 hover:bg-slate-50 transition"
                                        >
                                            Set all attended
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 font-extrabold">
                                    Rule: If a student is marked Attended, a payment method must be selected. If Cash is selected, an amount must be entered.
                                </div>
                            </div>

                            {/* Students table */}
                            <div className="rounded-3xl border border-black bg-white p-5 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                                <div className="flex items-center justify-between">
                                    <p className="text-base font-extrabold text-slate-900">Students ({recurrenceItem.students?.length ?? 0})</p>
                                    <p className="text-xs text-slate-500 font-semibold">Click dropdowns to set values</p>
                                </div>

                                <div className="mt-4 space-y-2">
                                    {!recurrenceItem.students?.length ? (
                                        <div className="text-sm text-slate-600 font-semibold">No students enrolled for this session.</div>
                                    ) : (
                                        (recurrenceItem.students || []).map((s) => {
                                            const row = rows.find((r) => r.recurrenceStudentId === s.recurrenceClassStudentId);
                                            const status = row?.status ?? null;
                                            const pay = row?.paymentMethodSelected ?? null;
                                            const amountPaid = row?.amountPaid ?? "";

                                            const freeLessonLocked = s.paymentMethodSelected === "FREE_LESSON";
                                            const paymentDisabled = !status || status !== "ATTENDED" || freeLessonLocked;
                                            const amountDisabled = !status || status !== "ATTENDED" || pay !== "CASH";

                                            return (
                                                <div
                                                    key={s.recurrenceClassStudentId}
                                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_6px_18px_rgba(2,6,23,0.06)]"
                                                >
                                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-extrabold text-slate-900 truncate">
                                                                {s.studentFirstName} {s.studentLastName}
                                                            </div>
                                                            <div className="text-xs text-slate-600 font-semibold mt-1 truncate">{s.studentEmail}</div>

                                                            <div className="mt-2 inline-flex items-center gap-2">
                                <span className="text-[11px] font-extrabold px-2 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                                  Selected: {paymentLabel(s.paymentMethodSelected)}
                                </span>

                                                                <span className={`text-[11px] font-extrabold px-2 py-1 rounded-full border ${statusBadgeColor(status)}`}>
                                  {status ? prettyEnum(status) : "Not Set"}
                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                                            <select
                                                                value={status ?? ""}
                                                                onChange={(e) => updateRow(s.recurrenceClassStudentId, { status: (e.target.value || null) as any })}
                                                                className="w-full sm:w-48 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-slate-300"
                                                            >
                                                                <option value="">Status…</option>
                                                                <option value="ATTENDED">{prettyEnum("ATTENDED")}</option>
                                                                <option value="ABSENT">{prettyEnum("ABSENT")}</option>
                                                                <option value="CANCELLED">{prettyEnum("CANCELLED")}</option>
                                                                <option value="TUTOR_CANCELLED">{prettyEnum("TUTOR_CANCELLED")}</option>
                                                            </select>

                                                            <select
                                                                value={pay ?? ""}
                                                                disabled={paymentDisabled}
                                                                onChange={(e) =>
                                                                    updateRow(s.recurrenceClassStudentId, {
                                                                        paymentMethodSelected: (e.target.value || null) as any,
                                                                    })
                                                                }
                                                                className={`w-full sm:w-48 rounded-2xl border px-3 py-2 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                                                                    paymentDisabled ? "border-slate-200 bg-slate-50 text-slate-400" : "border-slate-200 bg-white text-slate-900"
                                                                }`}
                                                            >
                                                                <option value="">
                                                                    {paymentDisabled ? (freeLessonLocked ? "Free Lesson (locked)" : "Payment (disabled)") : "Payment…"}
                                                                </option>
                                                                <option value="CASH">{prettyEnum("CASH")}</option>
                                                                <option value="FREE_LESSON">{prettyEnum("FREE_LESSON")}</option>
                                                            </select>

                                                            <input
                                                                value={amountPaid}
                                                                disabled={amountDisabled}
                                                                onChange={(e) => updateRow(s.recurrenceClassStudentId, { amountPaid: e.target.value })}
                                                                placeholder={amountDisabled ? "Amount (disabled)" : "Cash amount"}
                                                                className={`w-full sm:w-40 rounded-2xl border px-3 py-2 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                                                                    amountDisabled ? "border-slate-200 bg-slate-50 text-slate-400" : "border-slate-200 bg-white text-slate-900"
                                                                }`}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="mt-5 flex flex-col md:flex-row gap-3">
                                    <button
                                        disabled={!canSubmit || submitting}
                                        onClick={submit}
                                        className="w-full inline-flex items-center justify-center px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-extrabold transition"
                                    >
                                        {submitting ? "Saving…" : "Save validation"}
                                    </button>

                                    <button
                                        disabled={submitting}
                                        onClick={() => navigate("/dashboard/tutor")}
                                        className="w-full inline-flex items-center justify-center px-4 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 disabled:opacity-60 font-extrabold transition"
                                    >
                                        Cancel
                                    </button>
                                </div>

                                {!canSubmit && (recurrenceItem.students?.length ?? 0) > 0 && (
                                    <div className="mt-3 text-xs text-slate-600 font-semibold">
                                        To save: every student needs a status. Attended students must have a payment method. If Cash is selected, an amount is required.
                                    </div>
                                )}
                            </div>
                        </>
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
        </div>
    );
}
