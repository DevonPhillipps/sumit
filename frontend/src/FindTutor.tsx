import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
    dayOfWeek: string; // Java DayOfWeek -> "MONDAY"
};

type RoleUpper = "STUDENT" | "TUTOR" | "ADMIN";
type RoleLower = "student" | "tutor" | "admin";
type RoleAny = RoleUpper | RoleLower;

const API_BASE = "http://localhost:8080";

const API = {
    towns: `${API_BASE}/api/location/get-towns`,
    subjects: `${API_BASE}/api/subjects/get-all-subjects`,
    languages: `${API_BASE}/api/languages/get-all-languages`,
    gradesViaCombo: `${API_BASE}/api/teaching/academic-offers/get-grades-via-combo`,
    classesByCombo: `${API_BASE}/api/classes/get-all-classes-by-language-town-subject-grade`,
};

function normalizeRole(raw: string | null): RoleUpper {
    const v = (raw || "").trim();
    if (!v) return "STUDENT";
    const up = v.toUpperCase();
    if (up === "STUDENT" || up === "TUTOR" || up === "ADMIN") return up as RoleUpper;
    return "STUDENT";
}

function roleToPath(role: RoleAny): RoleLower {
    const up = (role || "").toString().toUpperCase();
    if (up === "TUTOR") return "tutor";
    if (up === "ADMIN") return "admin";
    return "student";
}

function FindTutor() {
    const navigate = useNavigate();

    // PUBLIC page: token may be null
    const token = localStorage.getItem("token");

    // tolerate old lowercase localStorage + new uppercase backend enums
    const userRoleUpper = normalizeRole(localStorage.getItem("userRole"));
    const dashboardPathRole = roleToPath(userRoleUpper);

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

    const titleCase = (s: string) =>
        (s || "")
            .toLowerCase()
            .split(" ")
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

    // Works for "MONDAY" (DayOfWeek.name()) and also "monday" just in case
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

        if (isAlmostFull(cur, max)) {
            return `Only ${left} spot${left === 1 ? "" : "s"} left`;
        }

        if (isNewClass(cur, max)) {
            return `Max ${max} students · New class`;
        }

        return `${cur}/${max} enrolled · ${left} spot${left === 1 ? "" : "s"} left`;
    };

    const capacityPills = (cls: ClassDTO) => {
        const cur = cls.currentCapacity ?? 0;
        const max = cls.maxCapacity ?? 0;
        if (!max) return { showNew: false, showAlmost: false };
        return { showNew: isNewClass(cur, max), showAlmost: isAlmostFull(cur, max) };
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden">
            {/* HEADER */}
            <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between relative z-20 bg-slate-950/80 backdrop-blur">
                <div className="font-semibold text-lg tracking-tight cursor-pointer" onClick={() => navigate("/")}>
                    Sumit
                </div>

                <div className="flex items-center gap-3">
                    {!!token && (
                        <button
                            onClick={() => navigate(`/dashboard/${dashboardPathRole}`)}
                            className="text-sm px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 transition"
                        >
                            Back to dashboard
                        </button>
                    )}
                </div>
            </header>

            {/* MAIN */}
            <main className="relative flex-1 px-4 py-8 md:px-8 md:py-10">
                {/* Glows */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
                    <div className="absolute -top-24 -left-10 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
                    <div className="absolute top-1/4 right-0 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
                    <div className="absolute bottom-10 left-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto space-y-6">
                    <section className="rounded-3xl border border-slate-800/70 bg-slate-900/80 px-6 py-6 md:px-8 md:py-7 shadow-lg shadow-slate-950/70">
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Find a class</h1>
                        <p className="text-slate-300 text-sm md:text-base mt-2">
                            Select your town, subject, and language — then we’ll show grades automatically.
                        </p>

                        {topError && (
                            <div className="mt-4 rounded-2xl border border-rose-800/60 bg-rose-900/20 px-4 py-3 text-xs text-rose-200">
                                {topError}
                            </div>
                        )}

                        {/* FILTERS */}
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {/* SUBJECT */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                <label className="text-xs uppercase tracking-wide text-slate-500">Subject</label>
                                <select
                                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/60"
                                    value={selectedSubjectId}
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
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                <label className="text-xs uppercase tracking-wide text-slate-500">Town</label>
                                <select
                                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/60"
                                    value={selectedTownId}
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
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                <label className="text-xs uppercase tracking-wide text-slate-500">Language</label>
                                <select
                                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/60"
                                    value={selectedLanguageId}
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
                            {!canFetchGrades ? (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-4 text-xs text-slate-400">
                                    Choose <span className="text-slate-200">subject</span>, <span className="text-slate-200">town</span>, and{" "}
                                    <span className="text-slate-200">language</span> to reveal grades.
                                </div>
                            ) : (
                                <div className="rounded-3xl border border-slate-800 bg-slate-950/30 p-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-100">Grades</p>
                                            <p className="text-xs text-slate-400 mt-1">Select a grade to see available classes.</p>
                                        </div>
                                        <div className="text-xs text-slate-400">{gradesLoading ? "Loading…" : `${gradeOptions.length} found`}</div>
                                    </div>

                                    <div className="mt-4">
                                        <select
                                            className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/60"
                                            value={selectedComboId}
                                            onChange={(e) => {
                                                const val = e.target.value ? Number(e.target.value) : "";
                                                setSelectedComboId(val);
                                                if (val !== "") fetchClasses(val);
                                            }}
                                            disabled={gradesLoading}
                                        >
                                            <option value="">
                                                {gradesLoading ? "Loading grades..." : gradeOptions.length ? "Select grade" : "No grades found"}
                                            </option>

                                            {gradeOptions.map((g) => (
                                                <option key={g.comboId} value={g.comboId}>
                                                    Grade {g.grade}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* CLASSES LIST */}
                    <section className="rounded-3xl border border-slate-800/70 bg-slate-900/80 px-6 py-6 md:px-8 md:py-7 shadow-lg shadow-slate-950/70">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-slate-100">Available classes</h2>
                            <span className="text-xs text-slate-400">
                                {selectedComboId === "" ? "Select a grade" : classesLoading ? "Loading..." : `${classes.length} found`}
                            </span>
                        </div>

                        {selectedComboId === "" ? (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-4 text-xs text-slate-400">
                                Pick a grade to see classes.
                            </div>
                        ) : classesLoading ? (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-4 text-xs text-slate-400">
                                Loading classes…
                            </div>
                        ) : classes.length === 0 ? (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-4">
                                <p className="text-sm font-medium text-slate-100">No classes found</p>
                                <p className="text-xs text-slate-400 mt-1">Try another grade or change your filters.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {classes.map((cls) => {
                                    const pills = capacityPills(cls);

                                    return (
                                        <div
                                            key={cls.groupClassId}
                                            className="rounded-3xl border border-slate-800 bg-slate-900/90 px-5 py-4 shadow-lg shadow-slate-950/40"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-sky-500/15 border border-sky-500/30 text-sky-200">
                                                            {normalizeDay(cls.dayOfWeek)} · {formatTime(cls.startTime)}–{formatTime(cls.endTime)}
                                                        </span>

                                                        {pills.showNew && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border border-slate-700 bg-slate-950/40 text-slate-300">
                                                                New
                                                            </span>
                                                        )}
                                                        {pills.showAlmost && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border border-amber-600/40 bg-amber-500/10 text-amber-200">
                                                                Almost full
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-base font-semibold text-slate-100 mt-3 truncate">{cls.venueName || "Venue"}</p>

                                                    <p className="text-sm text-slate-200 mt-1">
                                                        Tutor: <span className="text-sky-300 font-semibold">{cls.tutorName || "Unknown"}</span>
                                                    </p>

                                                    <p className="text-sm text-slate-200 mt-2">
                                                        <span className="text-slate-300 font-medium">Address:</span>{" "}
                                                        <span className="text-slate-200">{cls.streetAddress || "Not set"}</span>
                                                    </p>
                                                </div>

                                                <div className="flex flex-col items-start md:items-end gap-2">
                                                    <span className="text-sm text-slate-200 font-medium">{capacityLine(cls)}</span>

                                                    <div className="flex flex-wrap gap-2">
                                                        {cls.mapsUrl && (
                                                            <a
                                                                href={cls.mapsUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-2xl border border-slate-700 hover:border-emerald-500/60 text-slate-200 transition"
                                                            >
                                                                Open map
                                                                <svg className="h-4 w-4 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                    <path d="M12 21s7-4.35 7-11a7 7 0 0 0-14 0c0 6.65 7 11 7 11z" strokeWidth="1.6" />
                                                                    <path d="M12 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" strokeWidth="1.6" />
                                                                </svg>
                                                            </a>
                                                        )}

                                                        <button
                                                            className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-2xl bg-sky-500 hover:bg-sky-400 text-black font-semibold transition"
                                                            onClick={() => navigate(`/book-class/${cls.groupClassId}`, { state: { cls } })}
                                                        >
                                                            Book class
                                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <path d="M5 12h14" strokeWidth="1.8" strokeLinecap="round" />
                                                                <path d="M13 6l6 6-6 6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </button>
                                                    </div>

                                                    {cls.tutorId && (
                                                        <button
                                                            className="text-[11px] text-sky-300 hover:text-sky-200 transition"
                                                            onClick={() => alert(`Tutor profile route later: /tutors/${cls.tutorId}`)}
                                                        >
                                                            View tutor profile →
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* FOOTER */}
            <footer className="px-4 py-4 border-t border-slate-800 text-xs text-slate-400 text-center relative z-10">
                © {new Date().getFullYear()} Sumit. All rights reserved.
            </footer>
        </div>
    );
}

export default FindTutor;
