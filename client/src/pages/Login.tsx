import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { loginWithOTP } from "../features/auth/authSlice"; // your Redux OTP login
import api from "../api/axios";
import SummaryApi from "../api/SummaryApi";
import { Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import logoWithName from "../assets/logoWithName.png";

export default function Login() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);
  const navigate = useNavigate();
  const navigatingAway = useRef(false);

  // UI State
  const [step, setStep] = useState<1 | 2>(1); // 1: credentials, 2: OTP
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (auth.user && !navigatingAway.current) navigate("/market");
  }, [auth.user, navigate]);

  // Determine type from identifier
  const getType = (value: string) => (value.includes("@") ? "email" : "phone");

  // STEP 1 — Send OTP
  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Please enter identifier and password");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const type = getType(identifier);

      await api.post(SummaryApi.sendLoginOTP.url, {
        identifier,
        password,
        type,
      });

      setStep(2);
    } catch (err: any) {
      setFailedAttempts((prev) => prev + 1);
      setError(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 — Verify OTP
  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter OTP");
      return;
    }

    setLoading(true);
    setError(null);
    console.log("Sending OTP verification:", {
      identifier: identifier,
      otp: otp,
    });
    try {
      await dispatch(
        loginWithOTP({
          identifier: identifier,
          otp: otp,
        })
      ).unwrap();
    } catch (err: any) {
      setError(err?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-50 transition-colors">
      <div className="w-full max-w-md px-6 sm:px-8">
        <div className="rounded-3xl border border-indigo-100/60 bg-white/95 p-8 shadow-2xl shadow-indigo-500/20 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-8 text-center">
            <img src={logoWithName} className="h-12 mx-auto mb-2" alt="Logo" />
            <h1 className="text-2xl font-bold">
              {step === 1 ? "Welcome Back" : "Verify OTP"}
            </h1>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              {step === 1
                ? "Login using your email or phone and password."
                : "Enter the OTP sent to your email/phone."}
            </p>
          </div>

          {/* STEP 1 — Email/Phone + Password */}
          {step === 1 && (
            <form onSubmit={sendOTP} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-400">
                  Email or Phone
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter email or phone"
                    required
                    className="w-full pl-10 py-2.5 rounded-xl border border-indigo-100 bg-white/80 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-400">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
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

              {/* Forgot Password — appears after 1+ failed attempt */}
              {failedAttempts >= 1 && (
                <div className="text-right -mt-1">
                  <a
                    href="/forgot-password"
                    className="text-xs text-indigo-600 font-medium hover:underline dark:text-indigo-400"
                  >
                    Forgot Password?
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/40 transition hover:from-blue-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Sending OTP..." : "Send Login OTP"}
              </button>
            </form>
          )}

          {/* STEP 2 — OTP */}
          {step === 2 && (
            <form onSubmit={verifyOTP} className="space-y-4">
              <div className="text-xs text-gray-500">
                OTP sent to <strong>{identifier}</strong>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-400">
                  OTP
                </label>
                <div className="relative flex items-center">
                  <Shield className="absolute left-3 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                    className="w-full pl-10 py-2.5 rounded-xl border border-indigo-100 bg-white/80 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || auth.loading}
                className="w-full mt-2 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/40 transition hover:from-blue-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading || auth.loading ? "Verifying..." : "Login"}
              </button>
            </form>
          )}

          {(error || auth.error) && (
            <div className="mt-3 text-xs text-red-500">
              {error || auth.error}
            </div>
          )}

          {step === 1 && (
            <p className="mt-4 text-center text-xs">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-indigo-600 font-medium"
              >
                Register
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
