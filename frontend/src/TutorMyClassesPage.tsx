import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type DayOfWeek =
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";

type TutorClassesOverviewDTO = {
    classId: number;
    venueName: string;
    startTime: string; // backend Time usually serializes like "16:00:00"
    endTime: string;
    day: DayOfWeek; // Java DayOfWeek -> "MONDAY"
    subject: string;
    numberOfEnrolledStudents: number;
    maxCapacity: number; // backend short comes as number in JSON
    grade: number;
};

function formatTime(t: string | null | undefined) {
    if (!t) return "";
    // "16:00:00" -> "16:00"
    const parts = t.split(":");
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return t;
}

function formatDay(d: string) {
    if (!d) return "";
    // "MONDAY" -> "Monday"
    const lower = d.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default function TutorMyClassesPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [classes, setClasses] = useState<TutorClassesOverviewDTO[]>([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        const fetchMyClasses = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch("http://localhost:8080/api/classes/tutor-classes-overview", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (res.status === 401 || res.status === 403) {
                    navigate("/login", { replace: true });
                    return;
                }

                if (!res.ok) {
                    const text = await res.text();
                    setError(text || "Failed to load your classes.");
                    setLoading(false);
                    return;
                }

                const data: TutorClassesOverviewDTO[] = await res.json();
                setClasses(Array.isArray(data) ? data : []);
                setLoading(false);
            } catch (e) {
                console.error(e);
                setError("Network error while loading your classes.");
                setLoading(false);
            }
        };

        fetchMyClasses();
    }, [navigate]);

    const sorted = useMemo(() => {
        const dayOrder: Record<DayOfWeek, number> = {
            MONDAY: 1,
            TUESDAY: 2,
            WEDNESDAY: 3,
            THURSDAY: 4,
            FRIDAY: 5,
            SATURDAY: 6,
            SUNDAY: 7,
        };

        return [...classes].sort((a, b) => {
            const da = dayOrder[a.day] ?? 99;
            const db = dayOrder[b.day] ?? 99;
            if (da !== db) return da - db;
            return a.startTime.localeCompare(b.startTime);
        });
    }, [classes]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between bg-slate-950/80 backdrop-blur">
                <div className="flex items-center gap-3">
                    <button
                        className="text-sm px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 transition"
                        onClick={() => navigate("/dashboard/tutor")}
                    >
                        Back
                    </button>
                    <div className="font-semibold text-lg tracking-tight">My classes</div>
                </div>

                <button
                    className="text-sm px-3 py-1 rounded-full bg-sky-500 hover:bg-sky-400 text-black font-semibold transition"
                    onClick={() => navigate("/tutor/create-class")}
                >
                    + Create new class
                </button>
            </header>

            <main className="px-4 py-8 md:px-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Your classes</h1>
                            <p className="text-sm text-slate-400 mt-1">
                                This is the overview of all classes you created. Click a class later to manage students or terminate it.
                            </p>
                        </div>
                    </div>

                    {loading && (
                        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6">
                            <p className="text-sm text-slate-300">Loading...</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
                            <p className="text-sm text-red-200">{error}</p>
                        </div>
                    )}

                    {!loading && !error && sorted.length === 0 && (
                        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6">
                            <p className="text-sm text-slate-300">You haven’t created any classes yet.</p>
                            <button
                                className="mt-4 px-4 py-2 rounded-full bg-sky-500 hover:bg-sky-400 text-black text-sm font-semibold transition"
                                onClick={() => navigate("/tutor/create-class")}
                            >
                                + Create your first class
                            </button>
                        </div>
                    )}

                    {!loading && !error && sorted.length > 0 && (
                        <div className="grid gap-4 md:grid-cols-2">
                            {sorted.map((c) => (
                                <div
                                    key={c.classId}
                                    className="rounded-3xl border border-slate-800/70 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/70 hover:border-sky-500/60 transition"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-slate-400">
                                                {c.subject} · Grade {c.grade}
                                            </p>
                                            <p className="text-lg font-semibold mt-1">
                                                {formatDay(c.day)} · {formatTime(c.startTime)}–{formatTime(c.endTime)}
                                            </p>
                                            <p className="text-sm text-slate-300 mt-1">{c.venueName}</p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xs uppercase tracking-wide text-slate-400">Enrolled</p>
                                            <p className="text-lg font-semibold mt-1">
                                                {c.numberOfEnrolledStudents}/{c.maxCapacity}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between">
                                        <button
                                            className="text-sm px-4 py-2 rounded-full border border-slate-700 hover:border-sky-500 transition"
                                            onClick={() => {
                                                navigate(`/dashboard/tutor/my-classes/${c.classId}`);
                                            }}
                                        >
                                            Manage
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
