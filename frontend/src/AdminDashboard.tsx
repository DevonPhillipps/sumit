import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Role = "student" | "tutor" | "admin";

type SubjectDTO = {
    subject: string;
    mark: number | null;
    grades: number[];
};

type AdminTutorViewDTO = {
    id: number;
    firstName: string | null;
    surname: string | null;
    userId: number;
    age: number;
    teachingExperience: string | null;
    status: string;

    preferredLanguage: string | null;
    town: string | null;

    rejectedReason: string | null;
    createdAt: string; // ISO
    reviewed: boolean;
    reviewedAt: string | null;
    subjects: SubjectDTO[];
};

const API_BASE = "http://localhost:8080";
const ADMIN_TUTORS_BASE = `${API_BASE}/api/admin/tutors`;

function timeAgo(iso: string) {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
}

function subjectsSummary(subjects: SubjectDTO[]) {
    if (!subjects || subjects.length === 0) return "—";
    return (
        subjects
            .map((s) => s.subject)
            .slice(0, 3)
            .join(", ") + (subjects.length > 3 ? "…" : "")
    );
}

function displayName(t: AdminTutorViewDTO) {
    const fn = (t.firstName || "").trim();
    const sn = (t.surname || "").trim();
    const name = `${fn} ${sn}`.trim();
    return name.length ? name : `Tutor #${t.id}`;
}

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

function AdminDashboard() {
    const navigate = useNavigate();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const token = localStorage.getItem("token");
    const storedRole = (localStorage.getItem("userRole") || "student") as Role;
    const isAuthenticated = !!token;

    const [pendingTutors, setPendingTutors] = useState<AdminTutorViewDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [expandedTutorId, setExpandedTutorId] = useState<number | null>(null);

    // ✅ pending list modal
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);

    // ✅ reject reason modal
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectTutorId, setRejectTutorId] = useState<number | null>(null);
    const [rejectTutorName, setRejectTutorName] = useState<string>("");
    const [rejectReason, setRejectReason] = useState("");
    const [rejectError, setRejectError] = useState<string | null>(null);

    // Per-row action loading (approve/reject)
    const [actionLoadingById, setActionLoadingById] = useState<Record<number, boolean>>({});
    const [actionErrorById, setActionErrorById] = useState<Record<number, string | null>>({});

    const pendingCount = pendingTutors.length;

    // 🔒 optional role verify endpoint
    useEffect(() => {
        const verifyRole = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login", { replace: true });
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/auth/role`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    navigate("/login", { replace: true });
                    return;
                }

                const role: Role = await res.json();
                if (role !== "admin") {
                    navigate(role === "tutor" ? "/dashboard/tutor" : "/dashboard/student", { replace: true });
                }
            } catch {
                navigate("/login", { replace: true });
            }
        };

        verifyRole();
    }, [navigate]);

    const fetchPendingTutors = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setErr("Not authenticated");
            setLoading(false);
            return;
        }

        setLoading(true);
        setErr(null);

        try {
            const res = await fetch(`${ADMIN_TUTORS_BASE}/view-pending-tutor-applicants`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `HTTP ${res.status}`);
            }

            const data: AdminTutorViewDTO[] = await res.json();
            setPendingTutors(Array.isArray(data) ? data : []);
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Failed to load pending tutors");
        } finally {
            setLoading(false);
        }
    };

    // Fetch pending tutors on mount
    useEffect(() => {
        fetchPendingTutors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Close pending modal with ESC
    useEffect(() => {
        if (!isPendingModalOpen && !isRejectModalOpen) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (isRejectModalOpen) closeRejectModal();
                else setIsPendingModalOpen(false);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isPendingModalOpen, isRejectModalOpen]);

    const handleSignOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        setIsProfileMenuOpen(false);
        navigate("/login");
    };

    const toggleProfileMenu = () => setIsProfileMenuOpen((prev) => !prev);
    const handleLogoClick = () => navigate("/dashboard/admin");

    const rows = useMemo(() => pendingTutors, [pendingTutors]);

    const setRowLoading = (id: number, isLoading: boolean) => {
        setActionLoadingById((prev) => ({ ...prev, [id]: isLoading }));
    };

    const setRowError = (id: number, message: string | null) => {
        setActionErrorById((prev) => ({ ...prev, [id]: message }));
    };

    const approveTutor = async (id: number) => {
        setRowError(id, null);
        setRowLoading(id, true);

        try {
            // ✅ change this path if your backend uses something else
            await apiFetch(`${ADMIN_TUTORS_BASE}/${id}/accept`, {
                method: "POST",
            });

            // Remove from pending list immediately
            setPendingTutors((prev) => prev.filter((t) => t.id !== id));
            if (expandedTutorId === id) setExpandedTutorId(null);
        } catch (e) {
            setRowError(id, e instanceof Error ? e.message : "Failed to approve tutor");
        } finally {
            setRowLoading(id, false);
        }
    };

    const openRejectModal = (t: AdminTutorViewDTO) => {
        setRejectTutorId(t.id);
        setRejectTutorName(displayName(t));
        setRejectReason("");
        setRejectError(null);
        setIsRejectModalOpen(true);
    };

    const closeRejectModal = () => {
        setIsRejectModalOpen(false);
        setRejectTutorId(null);
        setRejectTutorName("");
        setRejectReason("");
        setRejectError(null);
    };

    const submitReject = async () => {
        const id = rejectTutorId;
        if (!id) return;

        const reason = rejectReason.trim();
        if (!reason) {
            setRejectError("Reason is required.");
            return;
        }

        setRejectError(null);
        setRowError(id, null);
        setRowLoading(id, true);

        try {
            await apiFetch(`${ADMIN_TUTORS_BASE}/${id}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });

            setPendingTutors((prev) => prev.filter((t) => t.id !== id));
            if (expandedTutorId === id) setExpandedTutorId(null);
            closeRejectModal();
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed to reject tutor";
            setRejectError(msg);
            setRowError(id, msg);
        } finally {
            setRowLoading(id, false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden">
            {/* HEADER */}
            <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between relative z-20 bg-slate-950/80 backdrop-blur">
                <div className="font-semibold text-lg tracking-tight cursor-pointer" onClick={handleLogoClick}>
                    Sumit
                </div>

                {!isAuthenticated ? (
                    <div className="flex gap-3">
                        <button
                            className="text-sm px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 transition"
                            onClick={() => navigate("/login")}
                        >
                            Log in
                        </button>
                        <button
                            className="text-sm px-3 py-1 rounded-full bg-sky-500 hover:bg-sky-400 text-black font-medium transition"
                            onClick={() => navigate("/signup")}
                        >
                            Sign up
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <button
                            onClick={toggleProfileMenu}
                            className="flex items-center gap-2 px-2 py-1 rounded-full border border-slate-700 bg-slate-900/80 hover:border-sky-500 transition"
                        >
                            <div className="h-8 w-8 rounded-full bg-sky-500/90 flex items-center justify-center text-xs font-semibold text-black">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path
                                        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M4 20c0-2.7614 3.134-5 8-5s8 2.2386 8 5"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <div className="hidden sm:flex flex-col items-start">
                                <span className="text-xs uppercase tracking-wide text-slate-400">Signed in as</span>
                                <span className="text-xs font-medium text-slate-100">{storedRole}</span>
                            </div>
                            <svg
                                className={`h-4 w-4 text-slate-400 transition-transform ${isProfileMenuOpen ? "rotate-180" : ""}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                            >
                                <path d="M6 9l6 6 6-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        {isProfileMenuOpen && (
                            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl shadow-slate-950/70 py-2 z-30">
                                <div className="px-4 pb-2">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Account</p>
                                    <p className="text-sm text-slate-200 mt-1">Admin account</p>
                                </div>

                                <button
                                    className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800/80 transition"
                                    onClick={() => {
                                        setIsProfileMenuOpen(false);
                                        navigate("/profile");
                                    }}
                                >
                                    Profile
                                </button>

                                <button
                                    className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800/80 transition"
                                    onClick={() => {
                                        setIsProfileMenuOpen(false);
                                        navigate("/dashboard/admin");
                                    }}
                                >
                                    Admin dashboard
                                </button>

                                <div className="my-1 border-t border-slate-800" />

                                <button
                                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
                                    onClick={handleSignOut}
                                >
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* MAIN CONTENT */}
            <main className="relative flex-1 px-4 py-8 md:px-8 md:py-10">
                {/* Background glows */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
                    <div className="absolute -top-24 -left-10 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
                    <div className="absolute top-1/4 right-0 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
                    <div className="absolute bottom-10 left-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto space-y-8">
                    {/* HEADER ROW */}
                    <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
                            <p className="text-sm text-slate-400 mt-1">Review tutor applications and manage platform activity.</p>
                        </div>
                        <button
                            className="self-start px-4 py-2 rounded-full bg-sky-500 hover:bg-sky-400 text-black text-sm font-semibold shadow-lg shadow-sky-500/30 transition"
                            onClick={() => alert("Quick admin actions coming soon")}
                        >
                            + Quick admin action
                        </button>
                    </section>

                    {/* SUMMARY CARDS */}
                    <section className="grid gap-4 md:grid-cols-3">
                        <button
                            type="button"
                            className="text-left rounded-3xl border border-slate-800/70 bg-slate-900/80 px-5 py-4 shadow-lg shadow-slate-950/70 hover:border-sky-500/70 hover:bg-slate-900/90 transition focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                            onClick={() => setIsPendingModalOpen(true)}
                        >
                            <p className="text-xs uppercase tracking-wide text-slate-400">Pending tutor applications</p>
                            <p className="text-2xl font-semibold mt-1">{loading ? "…" : pendingCount}</p>
                            <p className="text-xs text-slate-500 mt-1">click to review</p>
                        </button>

                        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/80 px-5 py-4 shadow-lg shadow-slate-950/70">
                            <p className="text-xs uppercase tracking-wide text-slate-400">Active tutors</p>
                            <p className="text-2xl font-semibold mt-1">—</p>
                            <p className="text-xs text-slate-500 mt-1">wire this later</p>
                        </div>

                        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/80 px-5 py-4 shadow-lg shadow-slate-950/70">
                            <p className="text-xs uppercase tracking-wide text-slate-400">Total students</p>
                            <p className="text-2xl font-semibold mt-1">—</p>
                            <p className="text-xs text-slate-500 mt-1">wire this later</p>
                        </div>
                    </section>

                    {err && (
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            Failed to load pending tutors: {err}
                        </div>
                    )}
                </div>
            </main>

            <footer className="px-4 py-4 border-t border-slate-800 text-xs text-slate-400 text-center relative z-10">
                © {new Date().getFullYear()} Sumit. Admin panel.
            </footer>

            {/* ✅ MODAL: Pending tutor approvals */}
            {isPendingModalOpen && (
                <div className="fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-black/25 backdrop-blur-sm"
                        onClick={() => {
                            setIsPendingModalOpen(false);
                            setExpandedTutorId(null);
                        }}
                    />

                    <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6">
                        <div className="w-[95vw] h-[85vh] md:w-[80vw] md:h-[80vh] rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl shadow-slate-950/80 relative overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
                                <div>
                                    <div className="text-sm font-semibold text-slate-100">Pending tutor approvals</div>
                                    <div className="text-xs text-slate-400 mt-0.5">
                                        Review applicants · {loading ? "…" : pendingCount} pending
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 text-slate-200 transition"
                                        onClick={() => fetchPendingTutors()}
                                    >
                                        Refresh
                                    </button>
                                    <button
                                        className="h-9 w-9 rounded-full border border-slate-700 hover:border-sky-500 bg-slate-900/70 flex items-center justify-center transition"
                                        onClick={() => {
                                            setIsPendingModalOpen(false);
                                            setExpandedTutorId(null);
                                        }}
                                        aria-label="Close"
                                        title="Close"
                                    >
                                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                                            <path
                                                d="M6 6l12 12M18 6L6 18"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        className="text-xs px-3 py-1 rounded-full bg-slate-900/70 border border-slate-800 hover:border-sky-500 transition"
                                        onClick={() => alert("Pending filter coming soon")}
                                    >
                                        Pending
                                    </button>
                                    <button
                                        className="text-xs px-3 py-1 rounded-full bg-slate-900/70 border border-slate-800 hover:border-sky-500 transition"
                                        onClick={() => alert("Town filter coming soon")}
                                    >
                                        Town
                                    </button>
                                    <button
                                        className="text-xs px-3 py-1 rounded-full bg-slate-900/70 border border-slate-800 hover:border-sky-500 transition"
                                        onClick={() => alert("Language filter coming soon")}
                                    >
                                        Language
                                    </button>
                                    <button
                                        className="text-xs px-3 py-1 rounded-full bg-slate-900/70 border border-slate-800 hover:border-sky-500 transition"
                                        onClick={() => alert("Newest filter coming soon")}
                                    >
                                        Newest
                                    </button>
                                </div>
                            </div>

                            <div className="h-[calc(100%-116px)] overflow-y-auto">
                                <div className="p-5">
                                    {loading && <div className="text-sm text-slate-400 py-6">Loading pending tutors…</div>}

                                    {!loading && err && (
                                        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                            Failed to load: {err}
                                        </div>
                                    )}

                                    {!loading && !err && rows.length === 0 && (
                                        <div className="text-sm text-slate-400 py-6">No pending applications right now.</div>
                                    )}

                                    {!loading && !err && rows.length > 0 && (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-800">
                                                    <th className="py-2 pr-4">Tutor</th>
                                                    <th className="py-2 pr-4">Subjects</th>
                                                    <th className="py-2 pr-4">Town</th>
                                                    <th className="py-2 pr-4">Language</th>
                                                    <th className="py-2 pr-4">Applied</th>
                                                    <th className="py-2 pr-4 text-right">Action</th>
                                                </tr>
                                                </thead>

                                                <tbody>
                                                {rows.map((t) => {
                                                    const isOpen = expandedTutorId === t.id;
                                                    const isRowLoading = !!actionLoadingById[t.id];
                                                    const rowError = actionErrorById[t.id];

                                                    return (
                                                        <Fragment key={t.id}>
                                                            <tr
                                                                className={`border-b border-slate-800/60 last:border-0 cursor-pointer ${
                                                                    isOpen ? "bg-slate-800/30" : "hover:bg-slate-800/20"
                                                                }`}
                                                                onClick={() => setExpandedTutorId(isOpen ? null : t.id)}
                                                            >
                                                                <td className="py-2 pr-4 text-slate-100">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium">{displayName(t)}</span>
                                                                        <span className="text-xs text-slate-500">#{t.id} · user {t.userId}</span>
                                                                    </div>
                                                                    {rowError && (
                                                                        <div className="text-xs text-red-300 mt-1">
                                                                            {rowError}
                                                                        </div>
                                                                    )}
                                                                </td>

                                                                <td className="py-2 pr-4 text-slate-300">{subjectsSummary(t.subjects)}</td>

                                                                <td className="py-2 pr-4 text-slate-300">{t.town ?? "—"}</td>

                                                                <td className="py-2 pr-4 text-slate-300 capitalize">{t.preferredLanguage ?? "—"}</td>

                                                                <td className="py-2 pr-4 text-slate-400 text-xs">{t.createdAt ? timeAgo(t.createdAt) : "—"}</td>

                                                                <td className="py-2 pr-4 text-right space-x-2">
                                                                    <button
                                                                        disabled={isRowLoading}
                                                                        className={`px-2 py-1 text-xs rounded-full ${
                                                                            isRowLoading
                                                                                ? "bg-emerald-500/40 text-black/60 cursor-not-allowed"
                                                                                : "bg-emerald-500/90 text-black hover:bg-emerald-400"
                                                                        } transition`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            approveTutor(t.id);
                                                                        }}
                                                                    >
                                                                        {isRowLoading ? "Working…" : "Approve"}
                                                                    </button>

                                                                    <button
                                                                        disabled={isRowLoading}
                                                                        className={`px-2 py-1 text-xs rounded-full ${
                                                                            isRowLoading
                                                                                ? "bg-red-500/30 text-white/60 cursor-not-allowed"
                                                                                : "bg-red-500/80 text-white hover:bg-red-400"
                                                                        } transition`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openRejectModal(t);
                                                                        }}
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </td>
                                                            </tr>

                                                            {isOpen && (
                                                                <tr className="border-b border-slate-800/60">
                                                                    <td colSpan={6} className="py-3 pr-4">
                                                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                                                <div className="space-y-2">
                                                                                    <div className="text-xs uppercase tracking-wide text-slate-500">Application details</div>

                                                                                    <div className="text-sm text-slate-200">
                                                                                        <span className="text-slate-400">Name:</span> {displayName(t)}
                                                                                    </div>

                                                                                    <div className="text-sm text-slate-200">
                                                                                        <span className="text-slate-400">Age:</span> {t.age}
                                                                                    </div>

                                                                                    <div className="text-sm text-slate-200">
                                                                                        <span className="text-slate-400">Town:</span> {t.town ?? "—"}
                                                                                    </div>

                                                                                    <div className="text-sm text-slate-200">
                                                                                        <span className="text-slate-400">Language:</span>{" "}
                                                                                        <span className="capitalize">{t.preferredLanguage ?? "—"}</span>
                                                                                    </div>

                                                                                    <div className="text-sm text-slate-200">
                                                                                        <span className="text-slate-400">Reviewed:</span> {t.reviewed ? "Yes" : "No"}
                                                                                    </div>

                                                                                    {t.rejectedReason && (
                                                                                        <div className="text-sm text-slate-200">
                                                                                            <span className="text-slate-400">Rejected reason:</span> {t.rejectedReason}
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                <div className="flex-1 space-y-2">
                                                                                    <div className="text-xs uppercase tracking-wide text-slate-500">Subjects & grades</div>

                                                                                    <div className="flex flex-wrap gap-2">
                                                                                        {t.subjects?.length ? (
                                                                                            t.subjects.map((s) => (
                                                                                                <div
                                                                                                    key={s.subject}
                                                                                                    className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2"
                                                                                                >
                                                                                                    <div className="text-sm font-medium text-slate-100 capitalize">{s.subject}</div>
                                                                                                    <div className="text-xs text-slate-400 mt-1">
                                                                                                        Grades: {(s.grades || []).slice().sort((a, b) => a - b).join(", ")}
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))
                                                                                        ) : (
                                                                                            <div className="text-sm text-slate-400">No subjects found.</div>
                                                                                        )}
                                                                                    </div>

                                                                                    {t.teachingExperience && (
                                                                                        <div className="pt-2">
                                                                                            <div className="text-xs uppercase tracking-wide text-slate-500">Teaching experience</div>
                                                                                            <div className="text-sm text-slate-200 mt-1 whitespace-pre-wrap">{t.teachingExperience}</div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                                                                                <span>Status: {t.status}</span>
                                                                                <button
                                                                                    className="text-sky-400 hover:text-sky-300 transition"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setExpandedTutorId(null);
                                                                                    }}
                                                                                >
                                                                                    Collapse
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </Fragment>
                                                    );
                                                })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/70 px-5 py-3 flex items-center justify-between">
                                <div className="text-xs text-slate-500">Tip: click a row to expand details · ESC to close</div>
                                <button
                                    className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 text-slate-200 transition"
                                    onClick={() => {
                                        setIsPendingModalOpen(false);
                                        setExpandedTutorId(null);
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ MODAL: Reject reason */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-[60]">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeRejectModal} />

                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="w-[92vw] max-w-xl rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl shadow-slate-950/80 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-slate-100">Reject applicant</div>
                                    <div className="text-xs text-slate-400 mt-0.5">{rejectTutorName}</div>
                                </div>

                                <button
                                    className="h-9 w-9 rounded-full border border-slate-700 hover:border-sky-500 bg-slate-900/70 flex items-center justify-center transition"
                                    onClick={closeRejectModal}
                                    aria-label="Close"
                                    title="Close"
                                >
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                                        <path d="M6 6l12 12M18 6L6 18" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-5 space-y-3">
                                <label className="block text-xs uppercase tracking-wide text-slate-400">Reason</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    rows={4}
                                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/40"
                                    placeholder="Explain why this application is being rejected…"
                                />

                                {rejectError && (
                                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                        {rejectError}
                                    </div>
                                )}
                            </div>

                            <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-end gap-2">
                                <button
                                    className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 text-slate-200 transition"
                                    onClick={closeRejectModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="text-xs px-4 py-1.5 rounded-full bg-red-500/90 hover:bg-red-400 text-white font-semibold transition"
                                    onClick={submitReject}
                                    disabled={!rejectTutorId || !!actionLoadingById[rejectTutorId]}
                                >
                                    {rejectTutorId && actionLoadingById[rejectTutorId] ? "Rejecting…" : "Reject"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
