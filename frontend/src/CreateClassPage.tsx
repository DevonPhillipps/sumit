// CreateClassPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/** --------------------
 * Types
 * -------------------*/

type TownDTO = {
    id?: number;
    name: string;
};

type LanguageDTO = {
    id?: number;
    name: string;
};

type SubjectWithoutGradesDTO = {
    id?: number;
    name: string;
};

type LanguagesSubjectsTownsDTO = {
    townDTOs?: TownDTO[];
    languageDTOs?: LanguageDTO[];
    subjectDTOs?: SubjectWithoutGradesDTO[];
};

type GradeComboDTO = {
    comboId: number;
    grade: number;
};

type VenueDTO = {
    id: number;
    name: string;
    town: string;
    streetAddress: string;
    maxCapacity: number;
    url: string;
};

// Backend uses java.time.DayOfWeek enum values
type DayOfWeek =
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";

/**
 * Backend: VenuesTimeslotIfDayIsKnownDTO
 * id is not sent — it sends venueTimeslotId
 */
type VenueTimeslotDTO = {
    venueTimeslotId: number;
    startTime: string; // "HH:mm" or "HH:mm:ss"
    endTime: string;
    turnaroundMinutes?: number | null;
};

type DayTimeslotsGetDTO = {
    day: DayOfWeek;
    timeslots: VenueTimeslotDTO[];
};

type CreateClassDTO = {
    comboId: number;
    classCapacity: number; // backend short is fine for JSON number
    venueTimeslotsId: number;
    price: string; // REQUIRED (string)
    startDate: string; // yyyy-mm-dd (LocalDate)
};

/** --------------------
 * Helpers
 * -------------------*/

const capFirst = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const API_BASE = "http://localhost:8080";

const ENDPOINTS = {
    setup: `${API_BASE}/api/teaching/academic-offers/get-languages-and-subjects-and-towns`,
    venuesByTown: (townId: number) => `${API_BASE}/api/location/get-venues-by-town?townId=${townId}`,
    gradesViaCombo: (languageId: number, townId: number, subjectId: number) =>
        `${API_BASE}/api/teaching/academic-offers/get-grades-via-combo?languageId=${languageId}&townId=${townId}&subjectId=${subjectId}`,
    availableByVenueAndDay: (venueId: number, day: DayOfWeek) =>
        `${API_BASE}/api/venue-timeslots/get-available-timeslots-by-venue-id-and-day?venueId=${venueId}&day=${day}`,
    availableByVenue: (venueId: number) =>
        `${API_BASE}/api/venue-timeslots/get-available-timeslots-by-venue-id?venueId=${venueId}`,
    createClass: `${API_BASE}/api/classes/submit-create-class-application`,

    // ✅ your controller mappings:
    currentDate: `${API_BASE}/api/classes/current-date`,
    currentTime: `${API_BASE}/api/classes/current-time`,
};

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

function safeSortByName<T extends { name: string }>(arr: T[]): T[] {
    return [...arr].sort((a, b) => a.name.localeCompare(b.name));
}

function idKey(o: { id?: number; name: string }, fallbackPrefix: string) {
    return o.id != null ? String(o.id) : `${fallbackPrefix}:${o.name}`;
}

function formatTime(t: string) {
    if (!t) return "";
    return t.length >= 5 ? t.slice(0, 5) : t;
}

function normalizeUrl(raw: string) {
    const s = (raw || "").trim();
    if (!s) return "";
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    return `https://${s}`;
}

function dayLabel(d: DayOfWeek) {
    return d.charAt(0) + d.slice(1).toLowerCase(); // MONDAY -> Monday
}

function dayShort(d: DayOfWeek) {
    return dayLabel(d).slice(0, 3); // Monday -> Mon
}

const DAY_INDEX: Record<DayOfWeek, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 0, // JS Date: Sunday=0
};

function toISODate(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function parseISODate(s: string): Date | null {
    if (!s) return null;
    const [y, m, d] = s.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

function addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

/**
 * Next occurrence of the chosen day-of-week.
 * allowToday=true means: if today is same DOW, it returns today.
 */
function nextDowDate(today: Date, dow: DayOfWeek, allowToday: boolean) {
    const target = DAY_INDEX[dow];
    const current = today.getDay(); // 0=Sun..6=Sat
    let diff = (target - current + 7) % 7;
    if (!allowToday && diff === 0) diff = 7;
    return addDays(today, diff);
}

function isSameDow(date: Date, dow: DayOfWeek) {
    return date.getDay() === DAY_INDEX[dow];
}

function parseTimeToMinutes(t: string): number | null {
    if (!t) return null;
    // supports "HH:mm" or "HH:mm:ss"
    const parts = t.split(":").map((x) => Number(x));
    if (parts.length < 2) return null;
    const hh = parts[0];
    const mm = parts[1];
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
}

function nowMinutesFromBackendNow(backendNow: Date | null): number | null {
    if (!backendNow) return null;
    return backendNow.getHours() * 60 + backendNow.getMinutes();
}

/** --------------------
 * Page
 * -------------------*/

export default function CreateClassPage() {
    const navigate = useNavigate();
    const dbg = (...args: any[]) => console.log("[CreateClassPage]", ...args);

    // Setup options
    const [setupLoading, setSetupLoading] = useState(false);
    const [towns, setTowns] = useState<TownDTO[]>([]);
    const [languages, setLanguages] = useState<LanguageDTO[]>([]);
    const [subjects, setSubjects] = useState<SubjectWithoutGradesDTO[]>([]);

    // Backend "today" (Africa/Johannesburg), returned as yyyy-mm-dd
    const [backendToday, setBackendToday] = useState<string>("");

    // Backend "now" (Africa/Johannesburg OffsetDateTime), used for same-day time gating
    const [backendNow, setBackendNow] = useState<Date | null>(null);

    // Selections
    const [selectedTownId, setSelectedTownId] = useState<number | null>(null);
    const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

    // Grades via combo
    const [gradesLoading, setGradesLoading] = useState(false);
    const [gradeCombos, setGradeCombos] = useState<GradeComboDTO[]>([]);
    const [selectedComboId, setSelectedComboId] = useState<number | null>(null);

    // Venues
    const [venuesLoading, setVenuesLoading] = useState(false);
    const [venues, setVenues] = useState<VenueDTO[]>([]);
    const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
    const [expandedVenueId, setExpandedVenueId] = useState<number | null>(null);

    // Venue dropdown UI
    const [venuePickerOpen, setVenuePickerOpen] = useState(false);

    // Day selection mode: null = All, else specific day
    const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek | null>(null);

    // Timeslots
    const [dayTimeslotsLoading, setDayTimeslotsLoading] = useState(false);
    const [dayTimeslots, setDayTimeslots] = useState<VenueTimeslotDTO[]>([]);
    const [weeklyLoading, setWeeklyLoading] = useState(false);
    const [weekly, setWeekly] = useState<DayTimeslotsGetDTO[]>([]);

    // 1 class = 1 venueTimeslot
    const [selectedVenueTimeslotId, setSelectedVenueTimeslotId] = useState<number | null>(null);

    // track the day of the selected slot (needed for calendar rules)
    const [selectedSlotDay, setSelectedSlotDay] = useState<DayOfWeek | null>(null);

    // Calendar start date (yyyy-mm-dd)
    const [startDate, setStartDate] = useState<string>("");
    const [minStartDate, setMinStartDate] = useState<string>("");

    // Class capacity
    const [classCapacity, setClassCapacity] = useState<number | null>(null);

    // Price (REQUIRED, string)
    const [price, setPrice] = useState<string>("");

    const [submitLoading, setSubmitLoading] = useState(false);

    const days: DayOfWeek[] = useMemo(
        () => ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
        []
    );

    const selectedVenue = useMemo(
        () => venues.find((v) => v.id === selectedVenueId) ?? null,
        [venues, selectedVenueId]
    );

    const capacityOptions = useMemo(() => {
        const max = selectedVenue?.maxCapacity ?? 0;
        if (!max || max <= 0) return [];
        const out: number[] = [];
        for (let i = 1; i <= max; i++) out.push(i);
        return out;
    }, [selectedVenue?.maxCapacity]);

    const isReady =
        selectedTownId != null &&
        selectedLanguageId != null &&
        selectedSubjectId != null &&
        selectedComboId != null &&
        selectedVenueId != null &&
        classCapacity != null &&
        selectedVenueTimeslotId != null &&
        selectedSlotDay != null &&
        price.trim().length > 0 &&
        startDate.trim().length > 0 &&
        !submitLoading;

    /** --------------------
     * State change logs
     * -------------------*/
    useEffect(() => dbg("STATE backendToday", backendToday), [backendToday]);
    useEffect(() => dbg("STATE backendNow", backendNow), [backendNow]);
    useEffect(() => dbg("STATE selectedTownId", selectedTownId), [selectedTownId]);
    useEffect(() => dbg("STATE selectedLanguageId", selectedLanguageId), [selectedLanguageId]);
    useEffect(() => dbg("STATE selectedSubjectId", selectedSubjectId), [selectedSubjectId]);
    useEffect(() => dbg("STATE selectedComboId", selectedComboId), [selectedComboId]);
    useEffect(() => dbg("STATE selectedVenueId", selectedVenueId), [selectedVenueId]);
    useEffect(() => dbg("STATE dayOfWeek", dayOfWeek), [dayOfWeek]);
    useEffect(() => dbg("STATE selectedVenueTimeslotId", selectedVenueTimeslotId), [selectedVenueTimeslotId]);
    useEffect(() => dbg("STATE selectedSlotDay", selectedSlotDay), [selectedSlotDay]);
    useEffect(() => dbg("STATE startDate", startDate), [startDate]);
    useEffect(() => dbg("STATE minStartDate", minStartDate), [minStartDate]);
    useEffect(() => dbg("STATE classCapacity", classCapacity), [classCapacity]);
    useEffect(() => dbg("STATE price", price), [price]);

    /** --------------------
     * Fetch backend "today" + "now" (Africa/Johannesburg)
     * -------------------*/
    useEffect(() => {
        const run = async () => {
            // DATE
            try {
                dbg("FETCH current-date ->", ENDPOINTS.currentDate);
                const res = await fetch(ENDPOINTS.currentDate, {
                    method: "GET",
                    headers: getAuthHeaders(),
                });

                if (!res.ok) {
                    const txt = await res.text().catch(() => "");
                    throw new Error(`Failed current-date (HTTP ${res.status}): ${txt}`);
                }

                const txt = await res.text();
                const normalized = (txt || "").replaceAll('"', "").trim();
                if (!normalized) throw new Error("current-date empty response");
                setBackendToday(normalized);
            } catch (e) {
                console.error(e);
                setBackendToday(toISODate(new Date()));
            }

            // TIME
            try {
                dbg("FETCH current-time ->", ENDPOINTS.currentTime);
                const res = await fetch(ENDPOINTS.currentTime, {
                    method: "GET",
                    headers: getAuthHeaders(),
                });

                if (!res.ok) {
                    const txt = await res.text().catch(() => "");
                    throw new Error(`Failed current-time (HTTP ${res.status}): ${txt}`);
                }

                // Could be JSON string or raw ISO string
                const txt = await res.text();
                const normalized = (txt || "").replaceAll('"', "").trim();
                if (!normalized) throw new Error("current-time empty response");

                const dt = new Date(normalized);
                if (Number.isNaN(dt.getTime())) throw new Error(`current-time invalid date: ${normalized}`);
                setBackendNow(dt);
            } catch (e) {
                console.error(e);
                // fallback to browser now
                setBackendNow(new Date());
            }
        };

        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** --------------------
     * Load towns/languages/subjects (single call)
     * -------------------*/
    useEffect(() => {
        const run = async () => {
            setSetupLoading(true);
            dbg("FETCH setup ->", ENDPOINTS.setup);
            try {
                const res = await fetch(ENDPOINTS.setup, {
                    method: "GET",
                    headers: getAuthHeaders(),
                });

                if (!res.ok) {
                    const txt = await res.text();
                    throw new Error(`Failed to load setup (HTTP ${res.status}): ${txt}`);
                }

                const data: LanguagesSubjectsTownsDTO = await res.json();
                dbg("SETUP response", data);

                const loadedTowns = safeSortByName(data.townDTOs ?? []).map((t) => ({
                    ...t,
                    name: capFirst(t.name),
                }));
                const loadedLanguages = safeSortByName(data.languageDTOs ?? []).map((l) => ({
                    ...l,
                    name: capFirst(l.name),
                }));
                const loadedSubjects = safeSortByName(data.subjectDTOs ?? []).map((s) => ({
                    ...s,
                    name: capFirst(s.name),
                }));

                setTowns(loadedTowns);
                setLanguages(loadedLanguages);
                setSubjects(loadedSubjects);

                const durb = loadedTowns.find((t) => t.name.toLowerCase() === "durbanville");
                if (durb?.id != null) setSelectedTownId(durb.id);
                else if (loadedTowns.length && loadedTowns[0].id != null) setSelectedTownId(loadedTowns[0].id);

                const eng = loadedLanguages.find((l) => l.name.toLowerCase() === "english");
                if (eng?.id != null) setSelectedLanguageId(eng.id);
                else if (loadedLanguages.length && loadedLanguages[0].id != null)
                    setSelectedLanguageId(loadedLanguages[0].id);
            } catch (e) {
                console.error(e);
                alert("Failed to load towns/languages/subjects. Please refresh.");
            } finally {
                setSetupLoading(false);
            }
        };

        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** --------------------
     * Load grades via combo when (town, language, subject) all selected
     * -------------------*/
    useEffect(() => {
        if (selectedTownId == null || selectedLanguageId == null || selectedSubjectId == null) {
            setGradeCombos([]);
            setSelectedComboId(null);
            return;
        }

        const run = async () => {
            setGradesLoading(true);
            const url = ENDPOINTS.gradesViaCombo(selectedLanguageId, selectedTownId, selectedSubjectId);
            dbg("FETCH gradeCombos ->", url);

            try {
                const res = await fetch(url, { method: "GET", headers: getAuthHeaders() });

                if (!res.ok) {
                    const txt = await res.text();
                    throw new Error(`Failed to load grades (HTTP ${res.status}): ${txt}`);
                }

                const data: GradeComboDTO[] = await res.json();
                dbg("GRADECOMBOS response", data);

                const list = Array.isArray(data) ? data : [];
                list.sort((a, b) => a.grade - b.grade);

                setGradeCombos(list);
                setSelectedComboId(list.length ? list[0].comboId : null);
            } catch (e) {
                console.error(e);
                setGradeCombos([]);
                setSelectedComboId(null);
            } finally {
                setGradesLoading(false);
            }
        };

        run();
    }, [selectedTownId, selectedLanguageId, selectedSubjectId]);

    /** --------------------
     * Load venues whenever town changes
     * -------------------*/
    useEffect(() => {
        if (selectedTownId == null) {
            setVenues([]);
            setSelectedVenueId(null);
            setExpandedVenueId(null);
            setVenuePickerOpen(false);

            // reset dependent fields
            setDayOfWeek(null);
            setWeekly([]);
            setDayTimeslots([]);
            setSelectedVenueTimeslotId(null);
            setSelectedSlotDay(null);
            setMinStartDate("");
            setStartDate("");
            setClassCapacity(null);
            setPrice("");
            return;
        }

        const run = async () => {
            setVenuesLoading(true);
            const url = ENDPOINTS.venuesByTown(selectedTownId);
            dbg("FETCH venues ->", url);

            try {
                const res = await fetch(url, {
                    method: "GET",
                    headers: getAuthHeaders(),
                });

                if (!res.ok) {
                    const txt = await res.text();
                    throw new Error(`Failed to load venues (HTTP ${res.status}): ${txt}`);
                }

                const data: VenueDTO[] = await res.json();
                dbg("VENUES response", data);

                const list = Array.isArray(data) ? data : [];
                list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

                setVenues(list);

                setSelectedVenueId(null);
                setExpandedVenueId(null);
                setVenuePickerOpen(false);

                setDayOfWeek(null);
                setWeekly([]);
                setDayTimeslots([]);
                setSelectedVenueTimeslotId(null);
                setSelectedSlotDay(null);
                setMinStartDate("");
                setStartDate("");

                setClassCapacity(null);
                setPrice("");
            } catch (e) {
                console.error(e);
                alert("Failed to load venues for this town.");
                setVenues([]);
            } finally {
                setVenuesLoading(false);
            }
        };

        run();
    }, [selectedTownId]);

    /** --------------------
     * When selectedVenueId/dayOfWeek changes, fetch timeslots
     * -------------------*/
    useEffect(() => {
        if (selectedVenueId == null) {
            setWeekly([]);
            setDayTimeslots([]);
            setSelectedVenueTimeslotId(null);
            setSelectedSlotDay(null);
            setMinStartDate("");
            setStartDate("");
            return;
        }

        if (dayOfWeek === null) {
            const runWeekly = async () => {
                setWeeklyLoading(true);
                const url = ENDPOINTS.availableByVenue(selectedVenueId);
                dbg("FETCH weekly timeslots ->", url);

                try {
                    const res = await fetch(url, {
                        method: "GET",
                        headers: getAuthHeaders(),
                    });

                    if (!res.ok) {
                        const txt = await res.text();
                        throw new Error(`Failed to load timeslots (HTTP ${res.status}): ${txt}`);
                    }

                    const data: DayTimeslotsGetDTO[] = await res.json();
                    dbg("WEEKLY response (raw)", data);

                    const list = Array.isArray(data) ? data : [];

                    const order = new Map<DayOfWeek, number>();
                    days.forEach((d, idx) => order.set(d, idx));
                    list.sort((a, b) => (order.get(a.day) ?? 0) - (order.get(b.day) ?? 0));

                    setWeekly(list);
                } catch (e) {
                    console.error(e);
                    alert("Failed to load timeslots for this venue.");
                    setWeekly([]);
                } finally {
                    setWeeklyLoading(false);
                }
            };

            runWeekly();
            return;
        }

        const runDay = async () => {
            setDayTimeslotsLoading(true);
            const url = ENDPOINTS.availableByVenueAndDay(selectedVenueId, dayOfWeek);
            dbg("FETCH day timeslots ->", url);

            try {
                const res = await fetch(url, {
                    method: "GET",
                    headers: getAuthHeaders(),
                });

                if (!res.ok) {
                    const txt = await res.text();
                    throw new Error(`Failed to load timeslots (HTTP ${res.status}): ${txt}`);
                }

                const data: VenueTimeslotDTO[] = await res.json();
                dbg("DAY response (raw)", data);

                const list = Array.isArray(data) ? data : [];
                setDayTimeslots(list);
            } catch (e) {
                console.error(e);
                alert("Failed to load timeslots for this day.");
                setDayTimeslots([]);
            } finally {
                setDayTimeslotsLoading(false);
            }
        };

        runDay();
    }, [selectedVenueId, dayOfWeek, days]);

    /** --------------------
     * When venue changes, default class capacity = venue capacity (max)
     * -------------------*/
    useEffect(() => {
        if (!selectedVenue) {
            setClassCapacity(null);
            return;
        }
        setClassCapacity(selectedVenue.maxCapacity);
    }, [selectedVenue?.id]);

    /** --------------------
     * Timeslot selection -> set min calendar date + default startDate
     *
     * Rule you wanted:
     * - If selected day is TODAY and the slot startTime is still in the future -> allow today
     * - If selected day is TODAY and slot startTime already passed -> next week
     * - Otherwise -> next occurrence (could be later this week)
     * -------------------*/
    const selectTimeslot = (day: DayOfWeek, venueTimeslotId: number, slotStartTime: string) => {
        dbg("selectTimeslot()", { day, venueTimeslotId, slotStartTime });

        setSelectedVenueTimeslotId(venueTimeslotId);
        setSelectedSlotDay(day);

        const todayStr = backendToday || toISODate(new Date());
        const todayDate = parseISODate(todayStr) ?? new Date();

        const nowMins = nowMinutesFromBackendNow(backendNow);
        const slotMins = parseTimeToMinutes(slotStartTime);

        let minObj: Date;

        if (isSameDow(todayDate, day)) {
            // same day of week as today
            const canUseToday = nowMins != null && slotMins != null && slotMins > nowMins;
            minObj = canUseToday ? todayDate : addDays(todayDate, 7);
        } else {
            // different day -> next occurrence (this week or next)
            minObj = nextDowDate(todayDate, day, true);
        }

        const minStr = toISODate(minObj);
        setMinStartDate(minStr);
        setStartDate(minStr);
    };

    /** --------------------
     * Submit
     * -------------------*/
    const handleSubmit = async () => {
        if (!isReady) return;

        // extra guard: date must be >= minStartDate and correct DOW
        if (selectedSlotDay) {
            const chosen = parseISODate(startDate);
            const min = parseISODate(minStartDate);
            if (!chosen) {
                alert("Please pick a start date.");
                return;
            }
            if (min && chosen < min) {
                alert(`Start date must be on or after ${minStartDate}.`);
                setStartDate(minStartDate);
                return;
            }
            if (!isSameDow(chosen, selectedSlotDay)) {
                alert(`Start date must be a ${dayLabel(selectedSlotDay)}.`);
                setStartDate(minStartDate);
                return;
            }
        }

        const payload: CreateClassDTO = {
            comboId: selectedComboId as number,
            classCapacity: classCapacity as number,
            venueTimeslotsId: selectedVenueTimeslotId as number,
            price: price.trim(),
            startDate: startDate.trim(),
        };

        dbg("SUBMIT -> POST", ENDPOINTS.createClass, payload);

        setSubmitLoading(true);
        try {
            const res = await fetch(ENDPOINTS.createClass, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`Failed to create class (HTTP ${res.status}): ${txt}`);
            }

            alert("Class created.");
            navigate("/");
        } catch (e) {
            console.error(e);
            alert("Failed to create class. Check console.");
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-32 -left-16 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
                <div className="absolute top-1/3 right-4 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="absolute bottom-40 left-6 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-6xl p-4 md:p-8 pb-28">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate("/")}
                        className="flex items-center gap-2 text-slate-400 hover:text-sky-400 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                        Back
                    </button>

                    <div className="text-right">
                        <div className="text-xl font-semibold">Create a Class</div>
                        <div className="text-xs text-slate-500 mt-1">
                            Today (backend): {backendToday || "—"}
                            <span className="text-slate-600"> · </span>
                            Now:{" "}
                            {backendNow ? `${String(backendNow.getHours()).padStart(2, "0")}:${String(backendNow.getMinutes()).padStart(2, "0")}` : "—"}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT PANEL */}
                    <div className="lg:col-span-5 rounded-3xl border border-slate-800/70 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/70">
                        <div className="text-lg font-semibold mb-1">Class setup</div>

                        <div className="mb-5">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Town</label>
                            <select
                                disabled={setupLoading}
                                value={selectedTownId ?? ""}
                                onChange={(e) => {
                                    const v = e.target.value ? Number(e.target.value) : null;
                                    setSelectedTownId(Number.isFinite(v as number) ? (v as number) : null);
                                }}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 transition disabled:opacity-60"
                            >
                                <option value="">{setupLoading ? "Loading..." : "Select a town"}</option>
                                {towns.map((t) => (
                                    <option key={idKey(t, "town")} value={t.id ?? ""}>
                                        {capFirst(t.name)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-5">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {languages.map((l) => {
                                    const disabled = l.id == null;
                                    const selected = l.id != null && selectedLanguageId === l.id;
                                    return (
                                        <button
                                            key={idKey(l, "lang")}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => l.id != null && setSelectedLanguageId(l.id)}
                                            className={[
                                                "px-4 py-3 rounded-xl border transition text-left",
                                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                                selected
                                                    ? "border-sky-500 bg-sky-500/10"
                                                    : "border-slate-700 bg-slate-800 hover:border-sky-500/70",
                                            ].join(" ")}
                                        >
                                            <div className="font-medium">{capFirst(l.name)}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mb-5">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                            <select
                                disabled={setupLoading}
                                value={selectedSubjectId ?? ""}
                                onChange={(e) => {
                                    const v = e.target.value ? Number(e.target.value) : null;
                                    setSelectedSubjectId(Number.isFinite(v as number) ? (v as number) : null);
                                }}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 transition disabled:opacity-60"
                            >
                                <option value="">{setupLoading ? "Loading..." : "Select a subject"}</option>
                                {subjects.map((s) => (
                                    <option key={idKey(s, "subj")} value={s.id ?? ""}>
                                        {capFirst(s.name)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-5">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Grade</label>
                            <select
                                disabled={
                                    gradesLoading ||
                                    selectedTownId == null ||
                                    selectedLanguageId == null ||
                                    selectedSubjectId == null
                                }
                                value={selectedComboId ?? ""}
                                onChange={(e) => {
                                    const v = e.target.value ? Number(e.target.value) : null;
                                    setSelectedComboId(Number.isFinite(v as number) ? (v as number) : null);
                                }}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 transition disabled:opacity-60"
                            >
                                <option value="">
                                    {gradesLoading
                                        ? "Loading..."
                                        : gradeCombos.length
                                            ? "Select a grade"
                                            : "No grades available"}
                                </option>
                                {gradeCombos.map((g) => (
                                    <option key={g.comboId} value={g.comboId}>
                                        Grade {g.grade}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* PRICE (required string) */}
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Price</label>
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="e.g. 150 or 150.99"
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 transition"
                            />
                            <div className="text-xs text-slate-500 mt-2">
                                Required. Stored as a string (no formatting enforced).
                            </div>
                        </div>

                        <div className="mb-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Class capacity</label>

                            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm text-slate-200">
                                        {selectedVenue ? (
                                            <>
                                                Max{" "}
                                                <span className="font-semibold text-slate-100">
                                                    {selectedVenue.maxCapacity}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-slate-400">Pick a venue first</span>
                                        )}
                                    </div>

                                    <select
                                        disabled={!selectedVenue || capacityOptions.length === 0}
                                        value={classCapacity ?? ""}
                                        onChange={(e) => {
                                            const v = e.target.value ? Number(e.target.value) : null;
                                            setClassCapacity(Number.isFinite(v as number) ? (v as number) : null);
                                        }}
                                        className="min-w-[140px] px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 transition disabled:opacity-60"
                                    >
                                        <option value="">{selectedVenue ? "Select capacity" : "No venue"}</option>
                                        {capacityOptions.map((n) => (
                                            <option key={n} value={n}>
                                                {n} students
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="lg:col-span-7 rounded-3xl border border-slate-800/70 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/70">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <div className="text-lg font-semibold">Venue & times</div>
                                <div className="text-sm text-slate-400">Pick a venue, then pick a single timeslot.</div>
                            </div>
                            <div className="text-xs text-slate-400">
                                {selectedTownId == null
                                    ? "Select a town first"
                                    : venuesLoading
                                        ? "Loading venues..."
                                        : ""}
                            </div>
                        </div>

                        <div className="relative mb-5">
                            <button
                                type="button"
                                disabled={selectedTownId == null || venuesLoading}
                                onClick={() => setVenuePickerOpen((v) => !v)}
                                className={[
                                    "w-full rounded-2xl border px-4 py-4 text-left transition",
                                    selectedTownId == null || venuesLoading
                                        ? "border-slate-800 bg-slate-800/30 opacity-60 cursor-not-allowed"
                                        : "border-slate-800 bg-slate-800/40 hover:border-sky-500/70",
                                ].join(" ")}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Venue</div>
                                        <div className="text-base font-semibold">
                                            {selectedVenue ? selectedVenue.name : venuesLoading ? "Loading..." : "Select a venue"}
                                        </div>
                                        {selectedVenue ? (
                                            <div className="text-xs text-slate-400 mt-1">
                                                Max {selectedVenue.maxCapacity} · {capFirst(selectedVenue.town)}
                                            </div>
                                        ) : null}
                                    </div>

                                    <svg
                                        className={`w-5 h-5 text-slate-400 transition-transform ${venuePickerOpen ? "rotate-180" : ""}`}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path d="M6 9l6 6 6-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </button>

                            {venuePickerOpen && (
                                <div className="absolute z-30 mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-slate-950/80 overflow-hidden">
                                    <div className="max-h-[360px] overflow-y-auto p-3 space-y-3">
                                        {venues.length === 0 ? (
                                            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-slate-300">
                                                No venues found for this town.
                                            </div>
                                        ) : (
                                            venues.map((v) => {
                                                const isSelected = selectedVenueId === v.id;
                                                const isExpanded = expandedVenueId === v.id;

                                                return (
                                                    <div
                                                        key={v.id}
                                                        className={[
                                                            "rounded-2xl border p-4 transition",
                                                            isSelected ? "border-sky-500 bg-sky-500/5" : "border-slate-800 bg-slate-800/40",
                                                        ].join(" ")}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    dbg("SELECT venue", v);
                                                                    setSelectedVenueId(v.id);

                                                                    // reset timeslot + calendar
                                                                    setDayOfWeek(null);
                                                                    setSelectedVenueTimeslotId(null);
                                                                    setSelectedSlotDay(null);
                                                                    setMinStartDate("");
                                                                    setStartDate("");

                                                                    setVenuePickerOpen(false);
                                                                    setExpandedVenueId(null);
                                                                }}
                                                                className="flex-1 text-left"
                                                            >
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <div className="font-medium">{v.name}</div>
                                                                    <div className="text-xs text-slate-400">Max {v.maxCapacity}</div>
                                                                </div>

                                                                <div className="text-xs text-slate-500 mt-1">{capFirst(v.town)}</div>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 transition shrink-0"
                                                                onClick={() => setExpandedVenueId((cur) => (cur === v.id ? null : v.id))}
                                                            >
                                                                {isExpanded ? "Hide details" : "See details"}
                                                            </button>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="mt-4 text-sm text-slate-300 border-t border-slate-800 pt-4 space-y-2">
                                                                <div>
                                                                    <span className="text-slate-400">Address:</span> {v.streetAddress || "—"}
                                                                </div>

                                                                {v.url ? (
                                                                    <a
                                                                        className="text-sky-400 hover:text-sky-300 underline"
                                                                        href={normalizeUrl(v.url)}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        Open map
                                                                    </a>
                                                                ) : (
                                                                    <div className="text-slate-400">No map link.</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    <div className="border-t border-slate-800 bg-slate-950/70 px-4 py-2 flex items-center justify-between">
                                        <div className="text-xs text-slate-500">{venues.length ? `${venues.length} venues` : ""}</div>
                                        <button
                                            type="button"
                                            className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 text-slate-200 transition"
                                            onClick={() => {
                                                setVenuePickerOpen(false);
                                                setExpandedVenueId(null);
                                            }}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                <div>
                                    <div className="font-semibold">Timeslots</div>
                                    <div className="text-xs text-slate-400">
                                        {selectedVenue ? `Venue: ${selectedVenue.name}` : "Select a venue to view timeslots"}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        disabled={selectedVenueId == null}
                                        onClick={() => {
                                            dbg("DAY switch -> ALL");
                                            setDayOfWeek(null);
                                            setSelectedVenueTimeslotId(null);
                                            setSelectedSlotDay(null);
                                            setMinStartDate("");
                                            setStartDate("");
                                        }}
                                        className={[
                                            "px-3 py-1.5 rounded-lg text-sm transition border",
                                            selectedVenueId == null
                                                ? "opacity-50 cursor-not-allowed border-slate-700"
                                                : dayOfWeek === null
                                                    ? "border-sky-500 bg-sky-500/10"
                                                    : "border-slate-700 hover:border-sky-500/70",
                                        ].join(" ")}
                                    >
                                        All
                                    </button>

                                    {days.map((d) => (
                                        <button
                                            key={d}
                                            type="button"
                                            disabled={selectedVenueId == null}
                                            onClick={() => {
                                                dbg("DAY switch ->", d);
                                                setDayOfWeek(d);
                                                setSelectedVenueTimeslotId(null);
                                                setSelectedSlotDay(null);
                                                setMinStartDate("");
                                                setStartDate("");
                                            }}
                                            className={[
                                                "px-3 py-1.5 rounded-lg text-sm transition border",
                                                selectedVenueId == null
                                                    ? "opacity-50 cursor-not-allowed border-slate-700"
                                                    : dayOfWeek === d
                                                        ? "border-sky-500 bg-sky-500/10"
                                                        : "border-slate-700 hover:border-sky-500/70",
                                            ].join(" ")}
                                        >
                                            {dayShort(d)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedVenueId == null ? (
                                <div className="text-slate-300">Select a venue to see available times.</div>
                            ) : dayOfWeek === null ? (
                                <div>
                                    {weeklyLoading ? (
                                        <div className="text-slate-300">Loading timeslots...</div>
                                    ) : weekly.length === 0 ? (
                                        <div className="text-slate-300">No timeslots available.</div>
                                    ) : (
                                        <div className="space-y-4">
                                            {weekly.map((d) => (
                                                <div key={d.day} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                                                    <div className="font-medium mb-2">{dayLabel(d.day)}</div>

                                                    {d.timeslots.length === 0 ? (
                                                        <div className="text-sm text-slate-400">No timeslots.</div>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-2">
                                                            {d.timeslots.map((t) => {
                                                                const selected = selectedVenueTimeslotId === t.venueTimeslotId;
                                                                return (
                                                                    <button
                                                                        key={t.venueTimeslotId}
                                                                        type="button"
                                                                        onClick={() => selectTimeslot(d.day, t.venueTimeslotId, t.startTime)}
                                                                        className={[
                                                                            "text-xs px-3 py-2 rounded-lg border transition",
                                                                            selected
                                                                                ? "border-sky-500 bg-sky-500/10"
                                                                                : "border-slate-700 hover:border-sky-500 bg-slate-900/40",
                                                                        ].join(" ")}
                                                                    >
                                                                        {formatTime(t.startTime)} - {formatTime(t.endTime)}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {dayTimeslotsLoading ? (
                                        <div className="text-slate-300">Loading timeslots...</div>
                                    ) : dayTimeslots.length === 0 ? (
                                        <div className="text-slate-300">No timeslots for {dayLabel(dayOfWeek)}.</div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {dayTimeslots.map((t) => {
                                                const selected = selectedVenueTimeslotId === t.venueTimeslotId;
                                                return (
                                                    <button
                                                        key={t.venueTimeslotId}
                                                        type="button"
                                                        className={[
                                                            "text-xs px-3 py-2 rounded-lg border transition",
                                                            selected
                                                                ? "border-sky-500 bg-sky-500/10"
                                                                : "border-slate-700 hover:border-sky-500 bg-slate-900/40",
                                                        ].join(" ")}
                                                        onClick={() => selectTimeslot(dayOfWeek, t.venueTimeslotId, t.startTime)}
                                                    >
                                                        {formatTime(t.startTime)} - {formatTime(t.endTime)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* CALENDAR UI */}
                        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-800/40 p-5">
                            <div className="font-semibold mb-1">Start date</div>
                            <div className="text-xs text-slate-400 mb-3">
                                Pick the first class date for this weekly timeslot. You can push it out to later weeks.
                            </div>

                            {selectedSlotDay == null || !selectedVenueTimeslotId ? (
                                <div className="text-slate-300">Pick a timeslot first to unlock the calendar.</div>
                            ) : (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        <div className="text-sm text-slate-300">
                                            Day:{" "}
                                            <span className="font-semibold text-slate-100">{dayLabel(selectedSlotDay)}</span>
                                        </div>

                                        <input
                                            type="date"
                                            value={startDate}
                                            min={minStartDate || undefined}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                setStartDate(v);

                                                const dt = parseISODate(v);
                                                if (dt && selectedSlotDay && !isSameDow(dt, selectedSlotDay)) {
                                                    alert(
                                                        `That date is not a ${dayLabel(selectedSlotDay)}. Please pick a ${dayLabel(selectedSlotDay)}.`
                                                    );
                                                    setStartDate(minStartDate);
                                                }
                                            }}
                                            className="w-full sm:w-auto px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 transition"
                                        />
                                    </div>

                                    <div className="text-xs text-slate-500 mt-3">
                                        Earliest allowed:{" "}
                                        <span className="text-slate-200 font-semibold">{minStartDate || "—"}</span>
                                        <span className="text-slate-600"> · </span>
                                        Must be a{" "}
                                        <span className="text-slate-200 font-semibold">{dayLabel(selectedSlotDay)}</span>.
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-800 bg-slate-950/90 backdrop-blur">
                <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex justify-center">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!isReady}
                        className="w-full max-w-md py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-600 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition shadow-lg shadow-sky-500/30"
                    >
                        {submitLoading ? "Creating..." : "Create"}
                    </button>
                </div>
            </div>
        </div>
    );
}
