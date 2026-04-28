// src/pages/Register.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import SummaryApi from "../api/SummaryApi";
import { Eye, EyeOff, Mail, Lock, Phone, Shield } from "lucide-react";
import logoWithName from "../assets/logoWithName.png";

export default function Register() {
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Email/Phone, Step 2: OTP/Password
  
  // Step 1 fields
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // Step 2 fields
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  // Step 1: Send OTP
  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const response = await api({
        url: SummaryApi.sendRegistrationOTP.url,
        method: SummaryApi.sendRegistrationOTP.method,
        data: { email, phone },
      });

      console.log("OTP sent:", response.data);
      setStep(2); // Move to step 2
    } catch (error: any) {
      setErr(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to send OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Register
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const response = await api({
        url: SummaryApi.register.url,
        method: SummaryApi.register.method,
        data: { email, phone, otp, password },
      });

      console.log("Registration successful:", response.data);
      
      // Navigate to dashboard or home after successful registration
      navigate("/dashboard");
    } catch (error: any) {
      setErr(
        error?.response?.data?.message ||
          error?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        min-h-screen flex items-center justify-center
        bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
        text-gray-900
        dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950
        dark:text-slate-50
        transition-colors
      "
    >
      <div className="w-full max-w-md px-6 sm:px-8">
        <div
          className="
            rounded-3xl border
            border-indigo-100/60
            bg-white/95
            p-8
            shadow-2xl shadow-indigo-500/20
            backdrop-blur-lg
            dark:border-slate-800
            dark:bg-slate-900/90
          "
        >
          {/* logo + heading */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex items-center justify-center">
              <img
                src={logoWithName}
                alt="Cryptians"
                className="h-10 sm:h-12 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Create account
            </h1>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              {step === 1
                ? "Enter your email and phone to get started"
                : "Verify OTP and set your password"}
            </p>
          </div>

          {/* Step 1: Email and Phone */}
          {step === 1 && (
            <form onSubmit={sendOTP} className="space-y-4">
              {/* email */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-400">
                  Email
                </label>
                <div className="relative flex items-center">
                  <span className="pointer-events-none absolute left-3 inline-flex items-center justify-center">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    type="email"
                    required
                    className="
                      w-full rounded-xl
                      border border-indigo-100
                      bg-white/80
                      px-10 py-2.5
                      text-sm
                      outline-none
                      ring-0
                      placeholder:text-gray-400
                      focus:border-indigo-500
                      focus:ring-2 focus:ring-indigo-500/40
                      dark:border-slate-700
                      dark:bg-slate-900/70
                      dark:text-slate-50
                    "
                  />
                </div>
              </div>

              {/* phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-400">
                  Phone Number
                </label>
                <div className="relative flex items-center">
                  <span className="pointer-events-none absolute left-3 inline-flex items-center justify-center">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    type="tel"
                    required
                    pattern="^\+[1-9]\d{1,14}$"
                    title="Please enter phone with country code (e.g., +919876543210)"
                    className="
                      w-full rounded-xl
                      border border-indigo-100
                      bg-white/80
                      px-10 py-2.5
                      text-sm
                      outline-none
                      ring-0
                      placeholder:text-gray-400
                      focus:border-indigo-500
                      focus:ring-2 focus:ring-indigo-500/40
                      dark:border-slate-700
                      dark:bg-slate-900/70
                      dark:text-slate-50
                    "
                  />
                </div>
                <p className="text-[10px] text-gray-400 dark:text-slate-500">
                  Include country code (e.g., +91 for India)
                </p>
              </div>

              {/* submit */}
              <button
                type="submit"
                disabled={loading}
                className="
                  mt-1 inline-flex w-full items-center justify-center
                  rounded-2xl
                  bg-gradient-to-r from-blue-600 to-purple-600
                  py-2.5 text-sm font-semibold
                  text-white
                  shadow-lg shadow-indigo-500/40
                  transition
                  hover:from-blue-500 hover:to-purple-500
                  disabled:cursor-not-allowed disabled:opacity-70
                "
              >
                {loading ? "Sending OTP..." : "Send Verification Code"}
              </button>

              {err && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                  {err}
                </div>
              )}
            </form>
          )}

          {/* Step 2: OTP and Password */}
          {step === 2 && (
            <form onSubmit={submit} className="space-y-4">
              {/* Show email and phone (read-only) */}
              <div className="rounded-xl bg-indigo-50/50 px-4 py-3 dark:bg-slate-800/50">
                <p className="text-xs text-gray-600 dark:text-slate-400">
                  <strong>Email:</strong> {email}
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-400">
                  <strong>Phone:</strong> {phone}
                </p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-1 text-[10px] text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Change email or phone
                </button>
              </div>

              {/* OTP */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-400">
                  Verification Code
                </label>
                <div className="relative flex items-center">
                  <span className="pointer-events-none absolute left-3 inline-flex items-center justify-center">
                    <Shield className="h-4 w-4 text-gray-400" />
                  </span>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    type="text"
                    required
                    maxLength={6}
                    pattern="\d{6}"
                    className="
                      w-full rounded-xl
                      border border-indigo-100
                      bg-white/80
                      px-10 py-2.5
                      text-sm
                      outline-none
                      ring-0
                      placeholder:text-gray-400
                      focus:border-indigo-500
                      focus:ring-2 focus:ring-indigo-500/40
                      dark:border-slate-700
                      dark:bg-slate-900/70
                      dark:text-slate-50
                    "
                  />
                </div>
                <p className="text-[10px] text-gray-400 dark:text-slate-500">
                  Check your email and phone for the verification code
                </p>
              </div>

              {/* password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-400">
                  Password
                </label>
                <div className="relative flex items-center">
                  <span className="pointer-events-none absolute left-3 inline-flex items-center justify-center">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </span>

                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create your password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    className="
                      w-full rounded-xl
                      border border-indigo-100
                      bg-white/80
                      px-10 py-2.5 pr-10
                      text-sm
                      outline-none
                      ring-0
                      placeholder:text-gray-400
                      focus:border-indigo-500
                      focus:ring-2 focus:ring-indigo-500/40
                      dark:border-slate-700
                      dark:bg-slate-900/70
                      dark:text-slate-50
                    "
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="
                      absolute right-3 inline-flex h-7 w-7 items-center justify-center
                      rounded-full
                      hover:bg-indigo-50
                      dark:hover:bg-slate-800
                    "
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

              {/* accept terms */}
              <div className="flex items-center justify-between pt-1 text-xs text-gray-500 dark:text-slate-400">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="
                      h-3.5 w-3.5 rounded
                      border-indigo-300
                      text-indigo-600
                      focus:ring-indigo-500
                      dark:border-slate-600
                    "
                    required
                  />
                  <span>
                    I accept{" "}
                    <button
                      type="button"
                      className="underline underline-offset-2 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      Privacy Policy
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      className="underline underline-offset-2 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      Terms
                    </button>
                    .
                  </span>
                </label>
              </div>

              {/* submit */}
              <button
                type="submit"
                disabled={loading}
                className="
                  mt-1 inline-flex w-full items-center justify-center
                  rounded-2xl
                  bg-gradient-to-r from-blue-600 to-purple-600
                  py-2.5 text-sm font-semibold
                  text-white
                  shadow-lg shadow-indigo-500/40
                  transition
                  hover:from-blue-500 hover:to-purple-500
                  disabled:cursor-not-allowed disabled:opacity-70
                "
              >
                {loading ? "Registering..." : "Complete Registration"}
              </button>

              {err && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                  {err}
                </div>
              )}
            </form>
          )}

          {/* Only show social buttons and login link on step 1 */}
          {step === 1 && (
            <>
              {/* divider */}
              <div className="mt-4 flex items-center gap-3 text-[11px] text-gray-500 dark:text-slate-400">
                <div className="h-px flex-1 bg-indigo-100 dark:bg-slate-700" />
                OR
                <div className="h-px flex-1 bg-indigo-100 dark:bg-slate-700" />
              </div>

              {/* social buttons */}
              <div className="flex items-center justify-center gap-4 pt-1">
                <button
                  type="button"
                  className="
                    flex h-10 w-10 items-center justify-center
                    rounded-full
                    border border-indigo-100
                    bg-white
                    shadow-sm
                    hover:bg-indigo-50
                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:hover:bg-slate-800
                  "
                >
                  <span className="text-xs font-semibold">G</span>
                </button>
                <button
                  type="button"
                  className="
                    flex h-10 w-10 items-center justify-center
                    rounded-full
                    border border-indigo-100
                    bg-white
                    shadow-sm
                    hover:bg-indigo-50
                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:hover:bg-slate-800
                  "
                >
                  <span className="text-xs font-semibold">f</span>
                </button>
                <button
                  type="button"
                  className="
                    flex h-10 w-10 items-center justify-center
                    rounded-full
                    border border-indigo-100
                    bg-white
                    shadow-sm
                    hover:bg-indigo-50
                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:hover:bg-slate-800
                  "
                >
                  <span className="text-xs font-semibold">𝕏</span>
                </button>
              </div>

              {/* login link */}
              <p className="pt-2 text-center text-xs text-gray-500 dark:text-slate-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}