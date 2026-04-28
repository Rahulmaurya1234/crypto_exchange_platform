import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Eye, EyeOff, AlertCircle, Ban, Loader2 } from "lucide-react";
import { useAppDispatch } from "../app/hooks";
import { loginUser } from "../features/auth/authSlice";

// ---------------- ZOD SCHEMA ----------------
const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

type ErrorType = "none" | "suspended" | "invalid" | "generic";

// ----------------- Mock Auth (simulate backend) -----------------
// Credentials:
//  - admin@cryptians.app / Password123  -> success, no MFA
//  - mfa@cryptians.app   / Password123  -> requires MFA (OTP: 123456)
// Any other credentials -> 401

async function mockLogin({ email, password }: LoginForm) {
    await new Promise((r) => setTimeout(r, 700));

    if (email === "admin@cryptians.app" && password === "Password123") {
        return {
            mfa: false,
            user: { id: "u_admin", email, name: "Admin User" },
            token: "fake-jwt-token-admin",
            rbac: { roles: ["admin"], permissions: ["*"] },
        };
    }

    if (email === "mfa@cryptians.app" && password === "Password123") {
        return {
            mfa: true,
            method: "totp",
            mfaSession: "mfa-session-1",
            user: { id: "u_mfa", email, name: "MFA User" },
        };
    }

    if (email === "suspended@cryptians.app") {
        const err: any = new Error("Account suspended");
        err.response = { status: 403 };
        throw err;
    }

    const err: any = new Error("Invalid credentials");
    err.response = { status: 401 };
    throw err;
}

async function mockVerifyOtp({ mfaSession, otp }: { mfaSession: string; otp: string }) {
    await new Promise((r) => setTimeout(r, 500));
    if (otp === "123456") {
        return {
            success: true,
            token: "fake-jwt-token-mfa",
            rbac: { roles: ["support"], permissions: ["tickets:view", "kyc:review"] },
        };
    }
    const err: any = new Error("Invalid OTP");
    err.response = { status: 401 };
    throw err;
}

// ----------------- Mock Google login -----------------
// For UI/demo purposes only. Real OAuth will redirect to Google's flow.
async function mockGoogleLogin() {
    // simulate redirect & backend exchange
    await new Promise((r) => setTimeout(r, 800));

    // pick a mocked outcome: success (admin) or require MFA
    // Here we return success with Google user
    return {
        mfa: false,
        user: { id: "u_google", email: "googleuser@cryptians.app", name: "Google User" },
        token: "fake-jwt-token-google",
        rbac: { roles: ["support"], permissions: ["tickets:view"] },
    };
}

// store RBAC payload in localStorage
function saveRbacToStorage(payload: any) {
    try {
        localStorage.setItem("cryptians_rbac", JSON.stringify(payload));
    } catch (e) {
        // ignore for now
    }
}

// ----------------- Small UI components -----------------
function Loader() {
    return (
        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    );
}

function SmallSpinner() {
    return (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    );
}

function ErrorBlock({ type, message }: { type: ErrorType; message?: string | null }) {
    if (type === "none" || !message) return null;

    const styles = {
        suspended: "mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800",
        invalid: "mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800",
        generic: "mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800",
    } as Record<string, string>;

    const icons = {
        suspended: <Ban className="w-5 h-5 mt-0.5" />,
        invalid: <AlertCircle className="w-5 h-5 mt-0.5" />,
        generic: <AlertCircle className="w-5 h-5 mt-0.5" />,
    } as Record<string, React.ReactNode>;

    return (
        <div className={styles[type]} role="alert">
            <div className="flex items-start gap-3">
                {icons[type]}
                <div>
                    <p className="font-semibold mb-1">{type === "invalid" ? "Email or password is incorrect" : type === "suspended" ? "Account suspended" : "Error"}</p>
                    {message && <p className={type === "invalid" ? "text-xs" : "text-sm text-red-700"}>{message}</p>}
                </div>
            </div>
        </div>
    );
}

// MFA Modal (simple overlay)
function MFAPrompt({ open, onClose, onSubmit, method }: { open: boolean; onClose: () => void; onSubmit: (otp: string) => Promise<void>; method?: string }) {
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            setOtp("");
            setErr(null);
            setLoading(false);
        }
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Two-factor authentication</h3>
                <p className="text-sm text-gray-600 mb-4">Enter the one-time code from your authenticator app{method ? ` (${method})` : ""}.</p>

                {err && <div className="mb-3 text-sm text-red-700">{err}</div>}

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">One-time code</label>
                    <input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        pattern="[0-9]*"
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1.5 rounded bg-gray-100 text-sm">Cancel</button>
                    <button
                        onClick={async () => {
                            setLoading(true);
                            setErr(null);
                            try {
                                await onSubmit(otp);
                            } catch (e: any) {
                                setErr(e?.message || "Invalid code");
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="px-4 py-1.5 rounded bg-blue-600 text-white text-sm flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading && <SmallSpinner />}
                        Verify
                    </button>
                </div>
            </div>
        </div>
    );
}

// LoginForm component (email, password — OTP optional prop for inline OTP if desired)
function LoginForm({ value, onChange, onSubmit, loading }: { value: LoginForm; onChange: (f: Partial<LoginForm>) => void; onSubmit: () => void; loading: boolean }) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">Email address</label>
                <input
                    type="email"
                    name="email"
                    value={value.email}
                    onChange={(e) => onChange({ email: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoComplete="email"
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium">Password</label>
                    <button type="button" onClick={() => alert("Forgot password flow not implemented in mock.")} className="text-xs text-blue-600 hover:underline">Forgot password?</button>
                </div>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={value.password}
                        onChange={(e) => onChange({ password: e.target.value })}
                        className="w-full border rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoComplete="current-password"
                    />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" onClick={() => setShowPassword((p) => !p)} aria-label="Toggle password visibility">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition flex items-center justify-center gap-2">
                {loading && <SmallSpinner />}
                {loading ? "Signing in..." : "Sign in"}
            </button>
        </form>
    );
}

// ----------------- Page: Login -----------------
export default function Login() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [errorType, setErrorType] = useState<ErrorType>("none");
    const [loading, setLoading] = useState(false);

    // MFA state
    const [mfaOpen, setMfaOpen] = useState(false);
    const [mfaSession, setMfaSession] = useState<string | null>(null);
    const [mfaMethod, setMfaMethod] = useState<string | undefined>(undefined);
    const [pendingUser, setPendingUser] = useState<any>(null);

    // Google button loading state
    const [googleLoading, setGoogleLoading] = useState(false);

    useEffect(() => {
        document.title = "Login - Cryptians";
    }, []);

    const handleChange = (patch: Partial<LoginForm>) => setForm((s) => ({ ...s, ...patch }));

    const handleSubmit = async () => {
        setLoading(true);
        setErrors({});
        setErrorType("none");

        const parsed = loginSchema.safeParse(form);
        if (!parsed.success) {
            const fieldErrors: Record<string, string> = {};
            parsed.error.errors.forEach((err) => {
                const field = err.path[0] as string;
                if (field) fieldErrors[field] = err.message;
            });
            setErrors(fieldErrors);
            setLoading(false);
            return;
        }

            try {
                // dispatch login thunk which posts to /api/v1/platform-b/auth/login
                const result = await dispatch(loginUser(form)).unwrap();

                // on success navigate to admin dashboard
                navigate("/admin");
            } catch (err: any) {
                const message = typeof err === 'string' ? err : err?.message || '';

                if (/suspend/i.test(message) || /suspended/i.test(message)) {
                    setErrorType("suspended");
                    setErrors({ general: message || "Your account is suspended." });
                } else if (/invalid|credentials|401/i.test(message)) {
                    setErrorType("invalid");
                    setErrors({ general: message || "Email or password is incorrect." });
                } else {
                    setErrorType("generic");
                    setErrors({ general: message || "Something went wrong while signing you in. Please try again in a moment." });
                }
            } finally {
                setLoading(false);
            }
    };

    const handleVerifyOtp = async (otp: string) => {
        if (!mfaSession) throw new Error("Missing MFA session");
        try {
            const res = await mockVerifyOtp({ mfaSession, otp });
            const rbacPayload = { token: res.token, user: pendingUser, rbac: res.rbac, fetchedAt: new Date().toISOString() };
            saveRbacToStorage(rbacPayload);
            setMfaOpen(false);
            navigate("/dashboard");
        } catch (e: any) {
            throw new Error(e?.message || "Invalid code");
        }
    };

    // Google login UI handler (mock)
    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setErrorType("none");
        try {
            const res = await mockGoogleLogin();
            if (res.mfa) {
                setMfaOpen(true);
                setMfaSession(res.mfaSession);
                setMfaMethod(res.method);
                setPendingUser(res.user);
                setGoogleLoading(false);
                return;
            }

            const rbacPayload = { token: res.token, user: res.user, rbac: res.rbac, fetchedAt: new Date().toISOString() };
            saveRbacToStorage(rbacPayload);
            navigate("/dashboard");
        } catch (e: any) {
            setErrorType("generic");
            setErrors({ general: "Google sign-in failed. Try again." });
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">C</div>
                        <div className="flex flex-col">
                            <span className="text-lg font-semibold text-gray-900">Cryptians</span>
                            <span className="text-xs text-gray-500">P2P Crypto Classifieds</span>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-semibold text-center mb-4">Sign in</h2>

                <ErrorBlock type={errorType} message={errors.general} />

                <LoginForm value={form} onChange={handleChange} onSubmit={handleSubmit} loading={loading} />

                <div className="mt-4">
                    <div className="relative flex items-center justify-center my-3">
                        <hr className="w-full border-t border-gray-200" />
                        <span className="absolute bg-white px-3 text-sm text-gray-500">or</span>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={googleLoading}
                        className="w-full flex items-center justify-center gap-3 border rounded py-2 text-sm hover:bg-gray-50 transition"
                        aria-label="Sign in with Google"
                    >
                        <svg width="18" height="18" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                            <path d="M533.5 278.4c0-17.4-1.4-34.2-4-50.4H272v95.5h147.1c-6.3 34-25 62.8-53.3 82v68.2h85.9c50.2-46.2 81.8-114.5 81.8-195.3z" fill="#4285f4" />
                            <path d="M272 544.3c72.6 0 133.6-23.9 178.1-64.7l-85.9-68.2c-23.9 16-54.5 25.4-92.2 25.4-70.8 0-130.8-47.8-152.3-112.1H32.5v70.6C76.9 487.8 168 544.3 272 544.3z" fill="#34a853" />
                            <path d="M119.7 325.2c-10.6-31.8-10.6-65.9 0-97.7V156.9H32.5c-42.8 86-42.8 188.8 0 274.8l87.2-70.5z" fill="#fbbc04" />
                            <path d="M272 107.7c38.4-.6 75.4 13.6 103.5 39.2l77.5-77.5C405.6 24.9 344.6 0 272 0 168 0 76.9 56.5 32.5 156.9l87.2 70.6C141.2 155.5 201.2 107.7 272 107.7z" fill="#ea4335" />
                        </svg>
                        {googleLoading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Signing in with Google…</span>
                            </div>
                        ) : (
                            <span>Sign in with Google</span>
                        )}
                    </button>
                </div>

                <div className="mt-4 text-center text-sm">
                    <span>Don’t have an account? </span>
                    <button type="button" onClick={() => navigate("/register")} className="text-blue-600 hover:underline">Register</button>
                </div>
            </div>

            <MFAPrompt
                open={mfaOpen}
                onClose={() => setMfaOpen(false)}
                method={mfaMethod}
                onSubmit={async (otp: string) => {
                    await handleVerifyOtp(otp);
                }}
            />
        </div>
    );
}

// NOTES:
// - The `mockGoogleLogin` function is for UI/demo only. For production, plug in Google's OAuth client
//   and exchange the code/profile on your backend, then save the JWT/RBAC the same way.
// - To test the Google flow UI: clicking the button performs a mocked successful login and redirects to /dashboard.
// - If you want the Google button to sometimes trigger MFA in the mock, update `mockGoogleLogin` to return `mfa: true` in some cases.
