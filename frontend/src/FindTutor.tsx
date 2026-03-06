import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./components/TopBar";
import { API_BASE_URL } from "./config/api";

// ✅ Hardcoded venue image (Vite import)
import venueInteriorNoStudents from "../images/venue-interior-no-students.webp";

type TownDTO = { id: number; name: string };
type SubjectWithoutGradesDTO = { id: number; name: string };
type LanguageDTO = { id: number; name: string };

type GradeComboDTO = {
    comboId: number;
    grade: number;
};

type ClassDTO = {
    maxCapacity: number; // backend: short
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

const API_BASE = API_BASE_URL;

const API = {
    towns: `${API_BASE}/api/location/get-towns`,
    subjects: `${API_BASE}/api/subjects/get-all-subjects`,
    languages: `${API_BASE}/api/languages/get-all-languages`,
    gradesViaCombo: `${API_BASE}/api/teaching/academic-offers/get-grades-via-combo`,
    classesByCombo: `${API_BASE}/api/classes/get-all-classes-by-language-town-subject-grade`,
};

type FocusKey = "subject" | "town" | "language" | "grade" | null;

function FindTutor() {
    const navigate = useNavigate();

    // PUBLIC page: token may be null
    const token = localStorage.getItem("token");

    const authHeaders = useMemo(() => {
        const h: Record<string, string> = { "Content-Type": "application/json" };
        if (token) h.Authorization = `Bearer ${token}`;
        return h;
    }, [token]);

    // Dropdown data
    const [towns, setTowns] = useState<TownDTO[]>([]);
    const [subjects, setSubjects] = useState<SubjectWithoutGradesDTO[]>([]);
    const [languages, setLanguages] = useState<LanguageDTO[]>([]);

    // Selections
    const [selectedTownId, setSelectedTownId] = useState<number | "">("");
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | "">("");
    const [selectedLanguageId, setSelectedLanguageId] = useState<number | "">("");

    // Grades after first 3 selections
    const [gradeOptions, setGradeOptions] = useState<GradeComboDTO[]>([]);
    const [gradesLoading, setGradesLoading] = useState(false);
    const [selectedComboId, setSelectedComboId] = useState<number | "">("");

    // Classes after grade selected
    const [classes, setClasses] = useState<ClassDTO[]>([]);
    const [classesLoading, setClassesLoading] = useState(false);

    // Error handling
    const [topError, setTopError] = useState<string | null>(null);

    // Focus handling (fix "lingering blue border / second tap doesn't open" on mobile)
    const [focused, setFocused] = useState<FocusKey>(null);
    const activeSelectRef = useRef<HTMLSelectElement | null>(null);

    // ✅ Venue modal
    const [venueModalOpen, setVenueModalOpen] = useState(false);
    const [venueModalTitle, setVenueModalTitle] = useState<string>("Venue");

    const blurActive = () => {
        const el = activeSelectRef.current || (document.activeElement as HTMLElement | null);
        if (el && typeof (el as any).blur === "function") (el as any).blur();
        activeSelectRef.current = null;
        setFocused(null);
    };

    const titleCase = (s: string) =>
        (s || "")
            .toLowerCase()
            .split(" ")
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

    const normalizeDay = (raw: string) => {
        if (!raw) return "";
        const s = raw.toLowerCase();
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const formatTime = (t: string) => {
        if (!t) return "";
        return t.length >= 5 ? t.slice(0, 5) : t;
    };

    // Initial load of towns/subjects/languages (PUBLIC)
    useEffect(() => {
        const run = async () => {
            setTopError(null);
            try {
                const [townRes, subjRes, langRes] = await Promise.all([
                    fetch(API.towns, { headers: authHeaders }),
                    fetch(API.subjects, { headers: authHeaders }),
                    fetch(API.languages, { headers: authHeaders }),
                ]);

                if (!townRes.ok) {
                    const t = await townRes.text().catch(() => "");
                    throw new Error(t || `Failed towns (${townRes.status})`);
                }
                if (!subjRes.ok) {
                    const t = await subjRes.text().catch(() => "");
                    throw new Error(t || `Failed subjects (${subjRes.status})`);
                }
                if (!langRes.ok) {
                    const t = await langRes.text().catch(() => "");
                    throw new Error(t || `Failed languages (${langRes.status})`);
                }

                const [townData, subjData, langData] = await Promise.all([
                    townRes.json() as Promise<TownDTO[]>,
                    subjRes.json() as Promise<SubjectWithoutGradesDTO[]>,
                    langRes.json() as Promise<LanguageDTO[]>,
                ]);

                setTowns(Array.isArray(townData) ? townData : []);
                setSubjects(Array.isArray(subjData) ? subjData : []);
                setLanguages(Array.isArray(langData) ? langData : []);
            } catch (e: any) {
                setTopError(e?.message || "Failed to load filters");
            }
        };

        run();
    }, [authHeaders]);

    const canFetchGrades = selectedTownId !== "" && selectedSubjectId !== "" && selectedLanguageId !== "";

    const fetchGrades = async () => {
        if (!canFetchGrades) return;

        setGradesLoading(true);
        setTopError(null);

        try {
            const url =
                `${API.gradesViaCombo}` +
                `?languageId=${encodeURIComponent(String(selectedLanguageId))}` +
                `&townId=${encodeURIComponent(String(selectedTownId))}` +
                `&subjectId=${encodeURIComponent(String(selectedSubjectId))}`;

            const res = await fetch(url, { headers: authHeaders });

            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(t || `Failed to load grades (${res.status})`);
            }

            const data = (await res.json()) as GradeComboDTO[];
            setGradeOptions(Array.isArray(data) ? data : []);
        } catch (e: any) {
            setTopError(e?.message || "Failed to load grades");
            setGradeOptions([]);
        } finally {
            setGradesLoading(false);
        }
    };

    const fetchClasses = async (comboId: number) => {
        setClassesLoading(true);
        setTopError(null);

        try {
            const url = `${API.classesByCombo}?comboId=${encodeURIComponent(String(comboId))}`;
            const res = await fetch(url, { headers: authHeaders });

            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(t || `Failed to load classes (${res.status})`);
            }

            const data = (await res.json()) as ClassDTO[];
            setClasses(Array.isArray(data) ? data : []);
        } catch (e: any) {
            setTopError(e?.message || "Failed to load classes");
            setClasses([]);
        } finally {
            setClassesLoading(false);
        }
    };

    // When any of the first 3 selections change:
    // - reset downstream selection
    // - auto-fetch grades if possible
    useEffect(() => {
        setSelectedComboId("");
        setClasses([]);
        setGradeOptions([]);

        if (!canFetchGrades) return;
        fetchGrades();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTownId, selectedSubjectId, selectedLanguageId]);

    // Capacity logic
    const pctFull = (cur: number, max: number) => (max ? cur / max : 0);

    const isAlmostFull = (cur: number, max: number) => {
        const left = Math.max(0, max - cur);
        return max > 0 && left <= 2;
    };

    // New until and INCLUDING 30%
    const isNewClass = (cur: number, max: number) => {
        if (!max) return false;
        return pctFull(cur, max) <= 0.3;
    };

    const capacityLine = (cls: ClassDTO) => {
        const cur = cls.currentCapacity ?? 0;
        const max = cls.maxCapacity ?? 0;
        if (!max) return "Capacity unknown";

        const left = Math.max(0, max - cur);

        if (isAlmostFull(cur, max)) return `Only ${left} spot${left === 1 ? "" : "s"} left`;
        if (isNewClass(cur, max)) return `Max ${max} students`;

        return `${cur}/${max} enrolled · ${left} spot${left === 1 ? "" : "s"} left`;
    };

    const capacityPills = (cls: ClassDTO) => {
        const cur = cls.currentCapacity ?? 0;
        const max = cls.maxCapacity ?? 0;
        if (!max) return { showNew: false, showAlmost: false };
        return { showNew: isNewClass(cur, max), showAlmost: isAlmostFull(cur, max) };
    };

    const selectClass = (key: FocusKey) => {
        const base =
            "mt-2 w-full rounded-2xl border-2 bg-white px-4 text-[17px] text-slate-900 font-semibold " +
            "focus:outline-none appearance-none";
        const tall = "py-4 md:py-3";
        const border = focused === key ? "border-slate-900 ring-2 ring-slate-200" : "border-black";
        return [base, tall, border].join(" ");
    };

    const openVenueModal = (title: string) => {
        setVenueModalTitle(title || "Venue");
        setVenueModalOpen(true);
    };

    const closeVenueModal = () => setVenueModalOpen(false);

    // close modal with ESC
    useEffect(() => {
        if (!venueModalOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeVenueModal();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [venueModalOpen]);

    return (
        <div
            className="min-h-screen flex flex-col bg-slate-100 text-slate-900 overflow-x-hidden"
            onPointerDownCapture={(e) => {
                const t = e.target as HTMLElement | null;
                const isSelect = !!t && (t.tagName === "SELECT" || t.closest("select"));
                if (isSelect) {
                    const active = document.activeElement as HTMLElement | null;
                    if (active && active.tagName === "SELECT" && active !== t && !active.contains(t as any)) {
                        blurActive();
                    }
                }
            }}
        >
            {/* TOP BAR */}
            <TopBar />

            {/* ✅ VENUE MODAL */}
            {venueModalOpen && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center px-4"
                    role="dialog"
                    aria-modal="true"
                    onMouseDown={(e) => {
                        // click outside closes
                        if (e.target === e.currentTarget) closeVenueModal();
                    }}
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                    <div className="relative z-[61] w-full max-w-4xl rounded-3xl border border-black bg-white shadow-[0_30px_80px_rgba(2,6,23,0.35)] overflow-hidden">
                        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
                            <div className="min-w-0">
                                <p className="text-sm font-black text-slate-900 truncate">{venueModalTitle}</p>
                            </div>

                            <button
                                className="inline-flex items-center gap-2 text-[12px] md:text-[13px] px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition font-extrabold text-slate-900"
                                onClick={closeVenueModal}
                            >
                                Close
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M18 6l-12 12" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-4 md:p-6">
                            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                                <img
                                    src={venueInteriorNoStudents}
                                    alt="Venue interior"
                                    className="w-full h-auto object-cover"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN */}
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

                {/* SCROLLABLE CONTENT */}
                <div className="relative z-10 px-4 py-6 md:px-8 md:py-10">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {/* FILTERS CARD */}
                        <section className="rounded-3xl border border-black bg-white p-5 md:p-7 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Find a class</h1>

                            {topError && (
                                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-semibold">
                                    {topError}
                                </div>
                            )}

                            {/* FILTERS */}
                            <div className="mt-6 grid gap-4 md:grid-cols-3">
                                {/* SUBJECT */}
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                    <label className="text-xs uppercase tracking-wide text-slate-600 font-bold">Subject</label>
                                    <select
                                        className={selectClass("subject")}
                                        value={selectedSubjectId}
                                        onPointerDown={() => blurActive()}
                                        onFocus={(e) => {
                                            activeSelectRef.current = e.currentTarget;
                                            setFocused("subject");
                                        }}
                                        onBlur={() => {
                                            if (focused === "subject") setFocused(null);
                                            activeSelectRef.current = null;
                                        }}
                                        onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : "")}
                                    >
                                        <option value="">Select subject</option>
                                        {subjects.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {titleCase(s.name)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* TOWN */}
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                    <label className="text-xs uppercase tracking-wide text-slate-600 font-bold">Town</label>
                                    <select
                                        className={selectClass("town")}
                                        value={selectedTownId}
                                        onPointerDown={() => blurActive()}
                                        onFocus={(e) => {
                                            activeSelectRef.current = e.currentTarget;
                                            setFocused("town");
                                        }}
                                        onBlur={() => {
                                            if (focused === "town") setFocused(null);
                                            activeSelectRef.current = null;
                                        }}
                                        onChange={(e) => setSelectedTownId(e.target.value ? Number(e.target.value) : "")}
                                    >
                                        <option value="">Select town</option>
                                        {towns.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {titleCase(t.name)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* LANGUAGE */}
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                    <label className="text-xs uppercase tracking-wide text-slate-600 font-bold">Language</label>
                                    <select
                                        className={selectClass("language")}
                                        value={selectedLanguageId}
                                        onPointerDown={() => blurActive()}
                                        onFocus={(e) => {
                                            activeSelectRef.current = e.currentTarget;
                                            setFocused("language");
                                        }}
                                        onBlur={() => {
                                            if (focused === "language") setFocused(null);
                                            activeSelectRef.current = null;
                                        }}
                                        onChange={(e) => setSelectedLanguageId(e.target.value ? Number(e.target.value) : "")}
                                    >
                                        <option value="">Select language</option>
                                        {languages.map((l) => (
                                            <option key={l.id} value={l.id}>
                                                {titleCase(l.name)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* GRADES */}
                            <div className="mt-5">
                                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-extrabold text-slate-900">Grades</p>
                                        </div>
                                        <div className="text-xs text-slate-600 font-semibold">
                                            {!canFetchGrades ? "Waiting for filters…" : gradesLoading ? "Loading…" : ""}
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <select
                                            className={selectClass("grade")}
                                            value={selectedComboId}
                                            disabled={!canFetchGrades || gradesLoading}
                                            onPointerDown={() => blurActive()}
                                            onFocus={(e) => {
                                                activeSelectRef.current = e.currentTarget;
                                                setFocused("grade");
                                            }}
                                            onBlur={() => {
                                                if (focused === "grade") setFocused(null);
                                                activeSelectRef.current = null;
                                            }}
                                            onChange={(e) => {
                                                const val = e.target.value ? Number(e.target.value) : "";
                                                setSelectedComboId(val);
                                                if (val !== "") fetchClasses(val);
                                            }}
                                        >
                                            <option value="">
                                                {!canFetchGrades
                                                    ? "Select subject/town/language first"
                                                    : gradesLoading
                                                        ? "Loading grades..."
                                                        : gradeOptions.length
                                                            ? "Select grade"
                                                            : "No grades found"}
                                            </option>

                                            {gradeOptions.map((g) => (
                                                <option key={g.comboId} value={g.comboId}>
                                                    Grade {g.grade}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* CLASSES LIST */}
                        <section className="rounded-3xl bg-white p-5 md:p-7 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base md:text-lg font-extrabold text-slate-900">Available classes</h2>
                                <span className="text-sm text-slate-600 font-semibold">
                  {selectedComboId === "" ? "Select a grade" : classesLoading ? "Loading..." : `${classes.length} found`}
                </span>
                            </div>

                            {selectedComboId === "" ? (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 font-semibold">
                                    Pick a grade to see classes.
                                </div>
                            ) : classesLoading ? (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 font-semibold">
                                    Loading classes…
                                </div>
                            ) : classes.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                    <p className="text-base font-extrabold text-slate-900">No classes found</p>
                                    <p className="text-sm text-slate-600 mt-1 font-medium">Try another grade or change your filters.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {classes.map((cls) => {
                                        const pills = capacityPills(cls);

                                        return (
                                            <div
                                                key={cls.groupClassId}
                                                className="relative rounded-3xl border border-black bg-white px-5 py-5 shadow-[0_10px_30px_rgba(2,6,23,0.06)]"
                                            >
                                                {/* New pill top-right */}
                                                {pills.showNew && (
                                                    <div className="absolute top-4 right-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] md:text-[13px] border border-slate-300 bg-slate-50 text-slate-900 font-extrabold">
                              New
                            </span>
                                                    </div>
                                                )}

                                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[14px] md:text-[15px] border-2 border-blue-900 bg-blue-100 text-black font-extrabold">
                                {normalizeDay(cls.dayOfWeek)} · {formatTime(cls.startTime)}–{formatTime(cls.endTime)}
                              </span>

                                                            {pills.showAlmost && (
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] md:text-[13px] border border-amber-300 bg-amber-50 text-amber-900 font-extrabold">
                                  Almost full
                                </span>
                                                            )}
                                                        </div>

                                                        <p className="text-[18px] md:text-[19px] font-extrabold text-slate-900 mt-4 truncate">
                                                            {cls.venueName || "Venue"}
                                                        </p>

                                                        {/* ✅ NEW: View venue button directly under venue name */}
                                                        <div className="mt-2">
                                                            <button
                                                                className="inline-flex items-center gap-1 text-[12px] md:text-[13px] px-3 py-2 rounded-2xl border border-black bg-white hover:bg-slate-50 transition font-extrabold text-slate-900"
                                                                onClick={() => openVenueModal(cls.venueName || "Venue")}
                                                                type="button"
                                                            >
                                                                View venue →
                                                            </button>

                                                        </div>

                                                        <div className="mt-3 flex items-center gap-3 flex-wrap">
                                                            <p className="text-[15px] md:text-[16px] text-slate-800 font-medium">
                                                                Tutor: <span className="text-blue-900 font-extrabold">{cls.tutorName || "Unknown"}</span>
                                                            </p>

                                                            {cls.tutorId && (
                                                                <button
                                                                    className="inline-flex items-center gap-1 text-[12px] md:text-[13px] px-3 py-2 rounded-2xl border border-black bg-white hover:bg-slate-50 transition font-extrabold text-slate-900"
                                                                    onClick={() => alert(`Tutor profile route later: /tutors/${cls.tutorId}`)}
                                                                    type="button"
                                                                >
                                                                    View profile →
                                                                </button>

                                                            )}
                                                        </div>

                                                        <p className="text-[14px] md:text-[15px] text-slate-800 mt-3 font-medium">
                                                            <span className="text-slate-700 font-bold">Address:</span>{" "}
                                                            <span className="text-slate-900">{cls.streetAddress || "Not set"}</span>
                                                        </p>

                                                        {/* ✅ NOTE: No town text is rendered anywhere in this card */}
                                                    </div>

                                                    <div className="flex flex-col items-start md:items-end gap-3">
                            <span className="text-[14px] md:text-[15px] text-slate-800 font-extrabold">
                              {capacityLine(cls)}
                            </span>

                                                        <div className="flex flex-wrap gap-2">
                                                            {cls.mapsUrl && (
                                                                <a
                                                                    href={cls.mapsUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-2 text-[12px] md:text-[13px] px-4 py-3 rounded-2xl border border-black bg-white hover:bg-slate-50 text-slate-900 transition font-extrabold"
                                                                >
                                                                    Open map →
                                                                </a>

                                                            )}

                                                            <button
                                                                className="inline-flex items-center gap-2 text-[12px] md:text-[13px] px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold transition"
                                                                onClick={() => navigate(`/book-class/${cls.groupClassId}`, { state: { cls } })}
                                                                type="button"
                                                            >
                                                                Book class
                                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                    <path d="M5 12h14" strokeWidth="1.8" strokeLinecap="round" />
                                                                    <path
                                                                        d="M13 6l6 6-6 6"
                                                                        strokeWidth="1.8"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default FindTutor;
