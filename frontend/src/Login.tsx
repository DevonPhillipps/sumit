import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface JwtResponse {
    token: string;
    userId: number;
    role: string; // "student" | "tutor" | "admin"
}

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:8080/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data: JwtResponse = await response.json();
                console.log("Login successful!", data);

                // Store auth info
                localStorage.setItem("token", data.token);
                localStorage.setItem("userId", data.userId.toString());
                localStorage.setItem("userRole", data.role); // "student" | "tutor" | "admin"

                // Redirect directly to correct dashboard
                navigate(`/dashboard/${data.role}`, { replace: true });
            } else {
                const errorText = await response.text();
                console.error("Login failed:", errorText);
                alert(`Login failed: ${errorText}`);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Network error - make sure backend is running on localhost:8080");
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
            {/* Background Glow Orbs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 -left-16 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
                <div className="absolute top-1/3 right-4 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="absolute bottom-40 left-6 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-800/70 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/70">
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

                <h1 className="text-3xl font-bold text-center mb-8">Welcome Back</h1>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Email *
                        </label>
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
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Password *
                        </label>
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
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-sky-400 transition"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                        />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="remember"
                                className="w-4 h-4 text-sky-500 bg-slate-800 border-slate-700 rounded focus:ring-sky-500"
                            />
                            <label htmlFor="remember" className="text-sm text-slate-400">
                                Remember me
                            </label>
                        </div>
                        <button
                            type="button"
                            className="text-sm text-sky-400 hover:text-sky-300 transition"
                        >
                            Forgot password?
                        </button>
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
                            onClick={() => navigate("/signup")}
                            className="text-sky-400 hover:text-sky-300 font-medium transition"
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
