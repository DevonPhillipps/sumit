import { useNavigate } from "react-router-dom";
import { useState } from "react";

// Define the type for subject data
interface SubjectData {
    selected: boolean;
    mark: string;
    grades: number[];
}

interface FormData {
    age: string;
    location: string;
    experience: string;
    preferredLanguage: string;
    subjects: {
        mathematics: SubjectData;
        accounting: SubjectData;
        physics: SubjectData;
    };
}

function BecomeTutorPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<FormData>({
        age: "",
        location: "",
        experience: "",
        preferredLanguage: "",
        subjects: {
            mathematics: { selected: false, mark: "", grades: [] },
            accounting: { selected: false, mark: "", grades: [] },
            physics: { selected: false, mark: "", grades: [] },
        }
    });
    const [isLoading, setIsLoading] = useState(false);

    const gradeOptions = [8, 9, 10, 11, 12];
    const languageOptions = ["english", "afrikaans"];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubjectToggle = (subject: keyof FormData['subjects']) => {
        setFormData(prev => ({
            ...prev,
            subjects: {
                ...prev.subjects,
                [subject]: {
                    ...prev.subjects[subject],
                    selected: !prev.subjects[subject].selected,
                    mark: !prev.subjects[subject].selected ? "" : prev.subjects[subject].mark,
                    grades: !prev.subjects[subject].selected ? [] : prev.subjects[subject].grades
                }
            }
        }));
    };

    const handleSubjectMarkChange = (subject: keyof FormData['subjects'], mark: string) => {
        const numMark = parseInt(mark);
        if ((numMark >= 0 && numMark <= 100) || mark === "") {
            setFormData(prev => ({
                ...prev,
                subjects: {
                    ...prev.subjects,
                    [subject]: {
                        ...prev.subjects[subject],
                        mark: mark
                    }
                }
            }));
        }
    };

    const handleGradeToggle = (subject: keyof FormData['subjects'], grade: number) => {
        setFormData(prev => {
            const currentGrades = prev.subjects[subject].grades;
            const newGrades = currentGrades.includes(grade)
                ? currentGrades.filter(g => g !== grade)
                : [...currentGrades, grade];

            return {
                ...prev,
                subjects: {
                    ...prev.subjects,
                    [subject]: {
                        ...prev.subjects[subject],
                        grades: newGrades
                    }
                }
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Validate age
        const age = parseInt(formData.age);
        if (age < 18) {
            alert("You must be at least 18 years old to become a tutor.");
            setIsLoading(false);
            return;
        }

        // Validate preferred language
        if (!formData.preferredLanguage) {
            alert("Please select your preferred teaching language.");
            setIsLoading(false);
            return;
        }

        // Validate location
        if (!formData.location) {
            alert("Please select a location.");
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
            if (!data.mark || parseInt(data.mark) < 0 || parseInt(data.mark) > 100) {
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

        // Prepare data EXACTLY matching your backend DTOs
        const applicationData = {
            age: parseInt(formData.age),
            town: {
                town: formData.location
            },
            teachingExperience: formData.experience,
            preferredLanguage: {
                language: formData.preferredLanguage
            },
            subjects: selectedSubjects.map(([subjectName, data]) => ({
                subject: subjectName,
                mark: parseInt(data.mark),
                grades: data.grades
            }))
        };

        console.log("Submitting tutor application:", JSON.stringify(applicationData, null, 2));

        // REAL API CALL (uncomment and update URL/token)
        try {
            const token = localStorage.getItem("token"); // or your auth token
            const response = await fetch('http://localhost:8080/api/tutor/become-a-tutor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(applicationData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Backend error:", errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log("Success:", result);

            alert("Tutor application submitted successfully! We'll review your application and get back to you soon.");
            navigate("/");

        } catch (error) {
            console.error('Error submitting application:', error);

            let errorMessage = "Failed to submit application. Please try again.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
            {/* Background Glow Orbs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 -left-16 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
                <div className="absolute top-1/3 right-4 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="absolute bottom-40 left-6 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            </div>

            {/* Become Tutor Card */}
            <div className="relative z-10 w-full max-w-4xl rounded-3xl border border-slate-800/70 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/70">
                {/* Back Button */}
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
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Age *
                            </label>
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
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Location *
                            </label>
                            <select
                                name="location"
                                required
                                value={formData.location}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 transition"
                            >
                                <option value="">Select location</option>
                                <option value="Durbanville">Durbanville</option>
                                <option value="Stellenbosch">Stellenbosch</option>
                            </select>
                        </div>
                    </div>

                    {/* Preferred Language Section */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Preferred Teaching Language *</h2>
                        <p className="text-sm text-slate-400 mb-4">Select the language you're most comfortable teaching in</p>

                        <div className="flex flex-wrap gap-4">
                            {languageOptions.map((language) => (
                                <div key={language} className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        id={`lang-${language}`}
                                        name="preferredLanguage"
                                        checked={formData.preferredLanguage === language}
                                        onChange={() => setFormData(prev => ({ ...prev, preferredLanguage: language }))}
                                        className="w-5 h-5 text-sky-500 bg-slate-700 border-slate-600 focus:ring-sky-500"
                                    />
                                    <label
                                        htmlFor={`lang-${language}`}
                                        className="text-slate-300 cursor-pointer capitalize"
                                    >
                                        {language}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Subjects Section */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Subjects You Can Teach *</h2>
                        <p className="text-sm text-slate-400 mb-4">Select subjects and provide your marks (0-100%)</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(Object.entries(formData.subjects) as [keyof FormData['subjects'], SubjectData][]).map(([subject, data]) => (
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
                                            {/* Mark Input */}
                                            <div>
                                                <label className="block text-sm text-slate-300 mb-2">
                                                    Your final mark (%) *
                                                </label>
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

                                            {/* Grade Selection */}
                                            <div>
                                                <label className="block text-sm text-slate-300 mb-2">
                                                    Grades to teach *
                                                </label>
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
                            ))}
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

                    {/* Submit Button */}
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
                        After submitting, our team will review your application. You'll receive an email once approved.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default BecomeTutorPage;