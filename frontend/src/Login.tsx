import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { API_BASE_URL } from "./config/api";
import { setAuthData } from "./utils/auth";

interface JwtResponse {
    token: string;
    userId: number;
    role: string; // backend might return "student"/"tutor"/"admin" OR "STUDENT"/"TUTOR"/"ADMIN"
    username?: string;
}

type RoleLower = "student" | "tutor" | "admin";

function toRoleLower(role: string): RoleLower {
    const up = (role || "").trim().toUpperCase();
    if (up === "STUDENT") return "student";
    if (up === "TUTOR") return "tutor";
    if (up === "ADMIN") return "admin";

    const low = (role || "").trim().toLowerCase();
    if (low === "student" || low === "tutor" || low === "admin") return low as RoleLower;

    return "student";
}

function normalizeDashboardPath(path: string) {
    // If returnTo is "/dashboard/STUDENT" etc, normalize it
    const p = (path || "/").trim();

    const m = p.match(/^\/dashboard\/([^/?#]+)/i);
    if (!m) return p;

    const roleLower = toRoleLower(m[1]);
    return p.replace(/^\/dashboard\/[^/?#]+/i, `/dashboard/${roleLower}`);
}

function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const rawReturnTo = (location.state as any)?.returnTo ?? "/";
    const returnTo = normalizeDashboardPath(rawReturnTo);

    const [formData, setFormData] = useState({ email: "", password: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => "");
                alert(`Login failed: ${errorText || response.status}`);
                return;
            }

            const data: JwtResponse = await response.json();

            // ✅ store lowercase role
            const roleLower = toRoleLower(data.role);

            // ✅ setAuthData should now store lowercase userRole
            setAuthData(data.token, roleLower, data.username);

            localStorage.setItem("userId", String(data.userId));

            // ✅ if user logged in and returnTo was "/", send them to their dashboard
            if (returnTo === "/" || returnTo === "/login" || returnTo === "/signup") {
                navigate(`/dashboard/${roleLower}`, { replace: true });
            } else {
                navigate(returnTo, { replace: true });
            }
        } catch (error) {
            console.error("Login error:", error);
            alert(
                "Network error.\n\nIf you're on your phone, make sure API_BASE_URL points to your PC IP, not localhost."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
{/* Background Glow Orbs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 -left-16 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
                <div className="absolute top-1/3 right-4 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="absolute bottom-40 left-6 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-800/70 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/70">
                <button
                    onClick={() => navigate(returnTo)}
                    className="flex items-center gap-2 text-slate-400 hover:text-sky-400 transition mb-6"
                    type="button"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </button>

                <h1 className="text-3xl font-bold text-center mb-8">Welcome Back</h1>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 transition"
                            placeholder="Enter your email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Password *</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 transition pr-12"
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-400 transition"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-600 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition shadow-lg shadow-sky-500/30"
                    >
                        {isLoading ? "Signing In..." : "Sign In"}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-400">
                        Don't have an account?{" "}
                        <button
                            onClick={() => navigate("/signup", { state: { returnTo } })}
                            className="text-sky-400 hover:text-sky-300 font-medium transition"
                            type="button"
                        >
                            Sign up
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
