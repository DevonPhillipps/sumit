import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/** --------------------
 * Types
 * -------------------*/

interface SubjectData {
    selected: boolean;
    mark: string;
    grades: number[];
}

interface FormData {
    age: string;
    townId: string; // select stores strings
    experience: string;

    // NEW: store language as ID (string in select)
    preferredLanguageId: string;

    subjects: {
        mathematics: SubjectData;
        accounting: SubjectData;
        physics: SubjectData;
    };
}

type TownDTO = {
    id: number;
    name: string;
};

type LanguageDTO = {
    id: number;
    name: string;
};

const API_BASE = "http://localhost:8080";

const ENDPOINTS = {
    towns: `${API_BASE}/api/location/get-towns`,
    languages: `${API_BASE}/api/languages/get-all-languages`, // <-- change if your mapping differs
    becomeTutor: `${API_BASE}/api/tutor/become-a-tutor`,
};

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

function BecomeTutorPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState<FormData>({
        age: "",
        townId: "",
        experience: "",
        preferredLanguageId: "",
        subjects: {
            mathematics: { selected: false, mark: "", grades: [] },
            accounting: { selected: false, mark: "", grades: [] },
            physics: { selected: false, mark: "", grades: [] },
        },
    });

    const [isLoading, setIsLoading] = useState(false);

    const [towns, setTowns] = useState<TownDTO[]>([]);
    const [townsLoading, setTownsLoading] = useState(false);

    const [languages, setLanguages] = useState<LanguageDTO[]>([]);
    const [languagesLoading, setLanguagesLoading] = useState(false);

    const gradeOptions = useMemo(() => [8, 9, 10, 11, 12], []);

    /** --------------------
     * Load towns + languages on mount
     * -------------------*/
    useEffect(() => {
        const fetchTowns = async () => {
            setTownsLoading(true);
            try {
                const response = await fetch(ENDPOINTS.towns, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch towns (HTTP ${response.status}): ${errorText}`);
                }

                const data: TownDTO[] = await response.json();
                console.log("[BecomeTutor] towns raw:", data);

                data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                setTowns(data);
            } catch (err) {
                console.error("[BecomeTutor] Error fetching towns:", err);
                alert("Failed to load towns. Please refresh the page.");
            } finally {
                setTownsLoading(false);
            }
        };

        const fetchLanguages = async () => {
            setLanguagesLoading(true);
            try {
                const response = await fetch(ENDPOINTS.languages, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch languages (HTTP ${response.status}): ${errorText}`);
                }

                const data: LanguageDTO[] = await response.json();
                console.log("[BecomeTutor] languages raw:", data);

                data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                setLanguages(data);

                // Optional default: if "english" exists, preselect it
                const eng = data.find((l) => (l.name || "").toLowerCase() === "english");
                if (eng?.id != null) {
                    setFormData((prev) => ({ ...prev, preferredLanguageId: String(eng.id) }));
                }
            } catch (err) {
                console.error("[BecomeTutor] Error fetching languages:", err);
                alert("Failed to load languages. Please refresh the page.");
            } finally {
                setLanguagesLoading(false);
            }
        };

        fetchTowns();
        fetchLanguages();
    }, []);

    /** --------------------
     * Handlers
     * -------------------*/
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubjectToggle = (subject: keyof FormData["subjects"]) => {
        setFormData((prev) => ({
            ...prev,
            subjects: {
                ...prev.subjects,
                [subject]: {
                    ...prev.subjects[subject],
                    selected: !prev.subjects[subject].selected,
                    mark: !prev.subjects[subject].selected ? "" : prev.subjects[subject].mark,
                    grades: !prev.subjects[subject].selected ? [] : prev.subjects[subject].grades,
                },
            },
        }));
    };

    const handleSubjectMarkChange = (subject: keyof FormData["subjects"], mark: string) => {
        const numMark = parseInt(mark);
        if ((numMark >= 0 && numMark <= 100) || mark === "") {
            setFormData((prev) => ({
                ...prev,
                subjects: {
                    ...prev.subjects,
                    [subject]: {
                        ...prev.subjects[subject],
                        mark,
                    },
                },
            }));
        }
    };

    const handleGradeToggle = (subject: keyof FormData["subjects"], grade: number) => {
        setFormData((prev) => {
            const currentGrades = prev.subjects[subject].grades;
            const newGrades = currentGrades.includes(grade)
                ? currentGrades.filter((g) => g !== grade)
                : [...currentGrades, grade];

            return {
                ...prev,
                subjects: {
                    ...prev.subjects,
                    [subject]: {
                        ...prev.subjects[subject],
                        grades: newGrades,
                    },
                },
            };
        });
    };

    /** --------------------
     * Submit
     * -------------------*/
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Validate age
        const age = parseInt(formData.age);
        if (Number.isNaN(age) || age < 18) {
            alert("You must be at least 18 years old to become a tutor.");
            setIsLoading(false);
            return;
        }

        // Validate town
        if (!formData.townId) {
            alert("Please select a location.");
            setIsLoading(false);
            return;
        }
        const selectedTownId = parseInt(formData.townId);
        if (Number.isNaN(selectedTownId)) {
            alert("Invalid town selected.");
            setIsLoading(false);
            return;
        }

        // Validate language
        if (!formData.preferredLanguageId) {
            alert("Please select your preferred teaching language.");
            setIsLoading(false);
            return;
        }
        const preferredLanguageId = parseInt(formData.preferredLanguageId);
        if (Number.isNaN(preferredLanguageId)) {
            alert("Invalid language selected.");
            setIsLoading(false);
            return;
        }

        // Validate at least one subject
        const selectedSubjects = Object.entries(formData.subjects).filter(([_, data]) => data.selected);
        if (selectedSubjects.length === 0) {
            alert("Please select at least one subject to teach.");
            setIsLoading(false);
            return;
        }

        // Validate subject details
        for (const [subject, data] of selectedSubjects) {
            const m = parseInt(data.mark);
            if (!data.mark || Number.isNaN(m) || m < 0 || m > 100) {
                alert(`Please enter a valid mark (0-100) for ${subject}.`);
                setIsLoading(false);
                return;
            }
            if (data.grades.length === 0) {
                alert(`Please select at least one grade to teach for ${subject}.`);
                setIsLoading(false);
                return;
            }
        }

        // Find language name (optional)
        const preferredLangObj = languages.find((l) => l.id === preferredLanguageId);
        const preferredLanguageName = preferredLangObj?.name ?? null;

        // Payload:
        // - preferredLanguageId is the *right* way (backend should do findById)
        // - also send preferredLanguage: { id, name } to match older patterns if you used that before
        const applicationData: any = {
            age,
            town: { id: selectedTownId },
            teachingExperience: formData.experience,

            preferredLanguageId, // <-- RECOMMENDED
            preferredLanguage: preferredLangObj
                ? { id: preferredLangObj.id, name: preferredLangObj.name }
                : preferredLanguageName
                    ? { name: preferredLanguageName }
                    : null,

            subjects: selectedSubjects.map(([subjectName, data]) => ({
                subject: subjectName,
                mark: parseInt(data.mark),
                grades: data.grades,
            })),
        };

        console.log("[BecomeTutor] submitting payload:", applicationData);

        try {
            const response = await fetch(ENDPOINTS.becomeTutor, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(applicationData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("[BecomeTutor] backend error:", errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json().catch(() => null);
            console.log("[BecomeTutor] success result:", result);

            alert("Tutor application submitted successfully! We'll review it and get back to you soon.");
            navigate("/");
        } catch (error) {
            console.error("[BecomeTutor] submit error:", error);

            let errorMessage = "Failed to submit application. Please try again.";
            if (error instanceof Error) errorMessage = error.message;

            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    /** --------------------
     * Render
     * -------------------*/
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
            {/* Background Glow Orbs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 -left-16 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
                <div className="absolute top-1/3 right-4 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="absolute bottom-40 left-6 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-4xl rounded-3xl border border-slate-800/70 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/70">
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 text-slate-400 hover:text-sky-400 transition mb-6"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to home
                </button>

                <h1 className="text-3xl font-bold text-center mb-8">Become a Tutor</h1>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Age *</label>
                            <input
                                type="number"
                                name="age"
                                required
                                min="18"
                                max="80"
                                value={formData.age}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 transition"
                                placeholder="Enter your age"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Location *</label>
                            <select
                                name="townId"
                                required
                                value={formData.townId}
                                onChange={handleChange}
                                disabled={townsLoading}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 transition disabled:opacity-60"
                            >
                                <option value="">
                                    {townsLoading ? "Loading towns..." : "Select location"}
                                </option>
                                {towns.map((t) => (
                                    <option key={t.id} value={String(t.id)}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Preferred Language (API-driven) */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Preferred Teaching Language *</h2>
                        <p className="text-sm text-slate-400 mb-4">Loaded from your backend (get-all-languages)</p>

                        <select
                            name="preferredLanguageId"
                            required
                            value={formData.preferredLanguageId}
                            onChange={handleChange}
                            disabled={languagesLoading}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 transition disabled:opacity-60"
                        >
                            <option value="">
                                {languagesLoading ? "Loading languages..." : "Select language"}
                            </option>
                            {languages.map((l) => (
                                <option key={l.id} value={String(l.id)}>
                                    {l.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subjects */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Subjects You Can Teach *</h2>
                        <p className="text-sm text-slate-400 mb-4">Select subjects and provide your marks (0-100%)</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(Object.entries(formData.subjects) as [keyof FormData["subjects"], SubjectData][]).map(
                                ([subject, data]) => (
                                    <div key={subject} className="border border-slate-800 rounded-xl p-4 bg-slate-800/50">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={data.selected}
                                                    onChange={() => handleSubjectToggle(subject)}
                                                    className="w-5 h-5 text-sky-500 bg-slate-700 border-slate-600 rounded focus:ring-sky-500"
                                                />
                                                <span className="font-medium capitalize">{subject}</span>
                                            </label>
                                        </div>

                                        {data.selected && (
                                            <div className="space-y-4 mt-4 pl-2 border-l-2 border-sky-500/50">
                                                <div>
                                                    <label className="block text-sm text-slate-300 mb-2">Your final mark (%) *</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={data.mark}
                                                        onChange={(e) => handleSubjectMarkChange(subject, e.target.value)}
                                                        className="w-full px-3 py-2 bg-slate-700/70 border border-slate-600 rounded-lg focus:outline-none focus:border-sky-500 transition"
                                                        placeholder="0-100"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm text-slate-300 mb-2">Grades to teach *</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {gradeOptions.map((grade) => (
                                                            <button
                                                                key={grade}
                                                                type="button"
                                                                onClick={() => handleGradeToggle(subject, grade)}
                                                                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                                                                    data.grades.includes(grade)
                                                                        ? "bg-sky-500 text-black font-medium"
                                                                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                                                }`}
                                                            >
                                                                Grade {grade}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Experience */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Teaching Experience (Optional)
                        </label>
                        <textarea
                            name="experience"
                            value={formData.experience}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 transition resize-none"
                            placeholder="Tell us about your teaching/tutoring experience..."
                            rows={4}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-600 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition shadow-lg shadow-sky-500/30"
                    >
                        {isLoading ? "Submitting Application..." : "Submit Application"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-slate-400 text-sm">
                        After submitting, our team will review your application. You’ll receive an email once approved.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default BecomeTutorPage;
