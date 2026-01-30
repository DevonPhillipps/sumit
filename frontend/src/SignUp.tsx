import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { setAuthData } from "./utils/auth"; // <-- adjust path if needed
import { API_BASE_URL } from "./config/api";

type RoleUpper = "STUDENT" | "TUTOR" | "ADMIN";

interface JwtResponse {
    token: string;
    userId: number;
    role: RoleUpper;
}

function SignUp() {
    const navigate = useNavigate();
    const location = useLocation();

    const returnTo = (location.state as any)?.returnTo as string | undefined;

    const [formData, setFormData] = useState({
        firstName: "",
        surname: "",
        email: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
        role: "STUDENT" as RoleUpper,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === "password" || name === "confirmPassword") setPasswordError("");
        setErrorMessage("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");

        if (formData.password !== formData.confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }

        if (formData.password.length < 6) {
            setPasswordError("Password must be at least 6 characters long");
            return;
        }

        setIsLoading(true);

        try {
            const { confirmPassword, ...dataToSend } = formData;

            let phoneNumber = dataToSend.phoneNumber;
            if (phoneNumber && !phoneNumber.startsWith("+")) {
                phoneNumber = "+27" + phoneNumber.replace(/^0+/, "");
            }

            const signupData = {
                ...dataToSend,
                phoneNumber,
                role: "STUDENT" as RoleUpper,
            };

            const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(signupData),
            });

            if (!response.ok) {
                const responseText = await response.text();
                try {
                    const errorData = JSON.parse(responseText);
                    setErrorMessage(errorData.error || `Signup failed: ${response.statusText}`);
                } catch {
                    setErrorMessage(`Signup failed: ${response.statusText || responseText}`);
                }
                return;
            }

            const jwtResponse: JwtResponse = await response.json();

            // ✅ store auth + fire auth-changed event (so TopBar updates instantly)
            await setAuthData(jwtResponse.token, jwtResponse.role);
            localStorage.setItem("userId", String(jwtResponse.userId)); // keep this here if you need it


            // ✅ go back to where they came from (booking page), otherwise dashboard
            if (returnTo) {
                navigate(returnTo, { replace: true });
            } else {
                navigate(`/dashboard/${jwtResponse.role.toLowerCase()}`, { replace: true });
            }
        } catch (error) {
            console.error("Error:", error);
            setErrorMessage(
                `Network error - make sure backend is running on ${window.location.hostname}:8080`
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 -left-16 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
                <div className="absolute top-1/3 right-4 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="absolute bottom-40 left-6 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-800/70 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/70">
                <button
                    onClick={() => navigate(returnTo ?? "/")}
                    className="flex items-center gap-2 text-slate-400 hover:text-sky-400 transition mb-6"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                    Back to home
                </button>

                <h1 className="text-3xl font-bold text-center mb-8">Create Account</h1>

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm">
                        {errorMessage}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">First Name *</label>
                            <input
                                type="text"
                                name="firstName"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 transition"
                                placeholder="First name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Surname *</label>
                            <input
                                type="text"
                                name="surname"
                                required
                                value={formData.surname}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 transition"
                                placeholder="Surname"
                            />
                        </div>
                    </div>

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
                        <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number *</label>
                        <div className="flex">
                            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border border-r-0 border-slate-700 rounded-l-xl">
                                <span className="text-sm">🇿🇦</span>
                                <span className="text-sm text-slate-300">+27</span>
                            </div>
                            <input
                                type="tel"
                                name="phoneNumber"
                                required
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-r-xl focus:outline-none focus:border-sky-500 transition"
                                placeholder="00 000 0000"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Password *</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                minLength={6}
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 transition pr-12"
                                placeholder="Create a password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((p) => !p)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-400 transition"
                            >
                                👁
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password *</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                required
                                minLength={6}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 transition pr-12"
                                placeholder="Confirm your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((p) => !p)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-400 transition"
                            >
                                👁
                            </button>
                        </div>
                        {passwordError && <p className="mt-2 text-sm text-red-400">{passwordError}</p>}
                    </div>

                    <div className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            id="terms"
                            required
                            className="w-4 h-4 mt-1 text-sky-500 bg-slate-800 border-slate-700 rounded focus:ring-sky-500"
                        />
                        <label htmlFor="terms" className="text-sm text-slate-400">
                            I agree to the Terms and Conditions and Privacy Policy *
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-600 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition shadow-lg shadow-sky-500/30"
                    >
                        {isLoading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-slate-400">
                        Already have an account?{" "}
                        <button
                            onClick={() => navigate("/login", { state: { returnTo } })}
                            className="text-sky-400 hover:text-sky-300 font-medium transition"
                        >
                            Log in
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SignUp;
