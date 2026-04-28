import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import SummaryApi from "../api/SummaryApi";
import {
    Mail,
    ArrowLeft,
    Shield,
    Lock,
    Eye,
    EyeOff,
    CheckCircle,
    RefreshCw,
    Phone,
} from "lucide-react";
import logoWithName from "../assets/logoWithName.png";

type Step = 1 | 2 | 3;

export default function ForgotPassword() {
    const navigate = useNavigate();

    // Flow state
    const [step, setStep] = useState<Step>(1);
    const [identifier, setIdentifier] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [channels, setChannels] = useState<{ email: boolean; sms: boolean }>({
        email: false,
        sms: false,
    });

    // Resend timer
    const [resendTimer, setResendTimer] = useState(0);
    useEffect(() => {
        if (resendTimer <= 0) return;
        const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
        return () => clearInterval(id);
    }, [resendTimer]);

    // OTP input refs
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // ---------- STEP 1: Send OTP ----------
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier.trim()) {
            setError("Please enter your email or phone number");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await api.post(SummaryApi.forgotPassword.url, {
                identifier: identifier.trim(),
            });
            const data = res.data?.data ?? res.data;
            setChannels(data.channels ?? { email: true, sms: false });
            setStep(2);
            setResendTimer(60);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    // ---------- OTP input handlers ----------
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const newOtp = [...otp];
        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);
        const nextIndex = Math.min(pastedData.length, 5);
        otpRefs.current[nextIndex]?.focus();
    };

    // ---------- Resend OTP ----------
    const handleResend = async () => {
        if (resendTimer > 0) return;
        setLoading(true);
        setError(null);
        try {
            await api.post(SummaryApi.forgotPassword.url, {
                identifier: identifier.trim(),
            });
            setResendTimer(60);
            setOtp(["", "", "", "", "", ""]);
            setSuccess("OTP resent successfully!");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to resend OTP");
        } finally {
            setLoading(false);
        }
    };

    // ---------- STEP 2 → 3: Verify OTP (just advance step) ----------
    const handleVerifyOTP = (e: React.FormEvent) => {
        e.preventDefault();
        const otpValue = otp.join("");
        if (otpValue.length !== 6) {
            setError("Please enter the complete 6-digit OTP");
            return;
        }
        setError(null);
        setStep(3);
    };

    // ---------- STEP 3: Reset Password ----------
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpValue = otp.join("");

        if (!newPassword || !confirmPassword) {
            setError("Please fill in both password fields");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await api.post(SummaryApi.resetPassword.url, {
                identifier: identifier.trim(),
                otp: otpValue,
                newPassword,
            });
            setSuccess("Password reset successful! Redirecting to login...");
            setTimeout(() => navigate("/login"), 2500);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    // ---------- Step indicator ----------
    const StepIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step >= s
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                                : "bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500"
                            }`}
                    >
                        {step > s ? <CheckCircle className="h-4 w-4" /> : s}
                    </div>
                    {s < 3 && (
                        <div
                            className={`w-8 h-0.5 transition-all duration-300 ${step > s
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600"
                                    : "bg-gray-200 dark:bg-slate-700"
                                }`}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    // ---------- Step titles ----------
    const titles: Record<Step, { heading: string; sub: string }> = {
        1: {
            heading: "Forgot Password?",
            sub: "Enter your email or phone number to receive a reset code.",
        },
        2: {
            heading: "Verify OTP",
            sub: `Enter the 6-digit code sent to ${channels.email && channels.sms
                    ? "your email & phone"
                    : channels.email
                        ? "your email"
                        : "your phone"
                }.`,
        },
        3: {
            heading: "Set New Password",
            sub: "Create a strong password for your account.",
        },
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-50 transition-colors">
            <div className="w-full max-w-md px-6 sm:px-8">
                <div className="rounded-3xl border border-indigo-100/60 bg-white/95 p-8 shadow-2xl shadow-indigo-500/20 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/90">
                    {/* Logo & Title */}
                    <div className="mb-6 text-center">
                        <img src={logoWithName} className="h-12 mx-auto mb-2" alt="Logo" />
                        <StepIndicator />
                        <h1 className="text-2xl font-bold">{titles[step].heading}</h1>
                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                            {titles[step].sub}
                        </p>
                    </div>

                    {/* ========== STEP 1: Identifier ========== */}
                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-400">
                                    Email or Phone
                                </label>
                                <div className="relative flex items-center">
                                    {identifier.includes("@") ? (
                                        <Mail className="absolute left-3 h-4 text-gray-400" />
                                    ) : (
                                        <Phone className="absolute left-3 h-4 text-gray-400" />
                                    )}
                                    <input
                                        type="text"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder="Enter email or phone number"
                                        required
                                        autoFocus
                                        className="w-full pl-10 py-2.5 rounded-xl border border-indigo-100 bg-white/80 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/40 transition hover:from-blue-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <RefreshCw className="h-4 w-4 animate-spin" /> Sending...
                                    </span>
                                ) : (
                                    "Send Reset Code"
                                )}
                            </button>
                        </form>
                    )}

                    {/* ========== STEP 2: OTP ========== */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            {/* Channel badges */}
                            <div className="flex items-center justify-center gap-2 text-xs">
                                {channels.email && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                        <Mail className="h-3 w-3" /> Email
                                    </span>
                                )}
                                {channels.sms && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                        <Phone className="h-3 w-3" /> SMS
                                    </span>
                                )}
                            </div>

                            {/* OTP boxes */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-400">
                                    Verification Code
                                </label>
                                <div
                                    className="flex justify-center gap-2"
                                    onPaste={handleOtpPaste}
                                >
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => { otpRefs.current[i] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            autoFocus={i === 0}
                                            className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-indigo-100 bg-white/80 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50 transition-all"
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.join("").length !== 6}
                                className="w-full mt-2 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/40 transition hover:from-blue-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                Verify Code
                            </button>

                            {/* Resend */}
                            <div className="text-center text-xs text-gray-500 dark:text-slate-400">
                                Didn't receive the code?{" "}
                                {resendTimer > 0 ? (
                                    <span className="text-indigo-500 font-medium">
                                        Resend in {resendTimer}s
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={loading}
                                        className="text-indigo-600 font-medium hover:underline disabled:opacity-50"
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </div>
                        </form>
                    )}

                    {/* ========== STEP 3: New Password ========== */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-400">
                                    New Password
                                </label>
                                <div className="relative flex items-center">
                                    <Lock className="absolute left-3 h-4 text-gray-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        required
                                        autoFocus
                                        className="w-full pl-10 py-2.5 pr-10 rounded-xl border border-indigo-100 bg-white/80 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((p) => !p)}
                                        className="absolute right-3 h-7 w-7 flex items-center justify-center rounded-full hover:bg-indigo-50 dark:hover:bg-slate-800"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-gray-400" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-400">
                                    Confirm Password
                                </label>
                                <div className="relative flex items-center">
                                    <Shield className="absolute left-3 h-4 text-gray-400" />
                                    <input
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        required
                                        className="w-full pl-10 py-2.5 pr-10 rounded-xl border border-indigo-100 bg-white/80 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm((p) => !p)}
                                        className="absolute right-3 h-7 w-7 flex items-center justify-center rounded-full hover:bg-indigo-50 dark:hover:bg-slate-800"
                                        tabIndex={-1}
                                    >
                                        {showConfirm ? (
                                            <EyeOff className="h-4 w-4 text-gray-400" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Password requirements */}
                            <div className="text-xs text-gray-400 dark:text-slate-500 space-y-0.5">
                                <p
                                    className={
                                        newPassword.length >= 8
                                            ? "text-green-500"
                                            : ""
                                    }
                                >
                                    • At least 8 characters
                                </p>
                                <p
                                    className={
                                        /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)
                                            ? "text-green-500"
                                            : ""
                                    }
                                >
                                    • Uppercase & lowercase letters
                                </p>
                                <p
                                    className={/\d/.test(newPassword) ? "text-green-500" : ""}
                                >
                                    • At least one number
                                </p>
                                <p
                                    className={
                                        /[@$!%*?&]/.test(newPassword) ? "text-green-500" : ""
                                    }
                                >
                                    • At least one special character (@$!%*?&)
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/40 transition hover:from-blue-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <RefreshCw className="h-4 w-4 animate-spin" /> Resetting...
                                    </span>
                                ) : (
                                    "Reset Password"
                                )}
                            </button>
                        </form>
                    )}

                    {/* Error / Success messages */}
                    {error && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
                            <span className="shrink-0">⚠</span> {error}
                        </div>
                    )}
                    {success && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-xs text-green-600 dark:bg-green-900/20 dark:text-green-400">
                            <CheckCircle className="h-3.5 w-3.5 shrink-0" /> {success}
                        </div>
                    )}

                    {/* Back to login */}
                    <div className="mt-5 text-center">
                        <button
                            onClick={() => navigate("/login")}
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium hover:underline dark:text-indigo-400"
                        >
                            <ArrowLeft className="h-3 w-3" /> Back to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
