// src/pages/VerifyOtp.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import SummaryApi from "../api/SummaryApi";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const pending = localStorage.getItem("pending_email");
    setEmail(pending);
    // if no pending email — redirect to register
    if (!pending) {
      navigate("/register");
    }
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await api({
        url: SummaryApi.verifyOtp.url,
        method: SummaryApi.verifyOtp.method,
        data: {
          email,
          otp,
        },
      });

      // backend should respond with success -> we can remove pending_email
      localStorage.removeItem("pending_email");

      // redirect to login
      navigate("/login");
    } catch (error: any) {
      setErr(
        error?.response?.data?.message ||
          error?.message ||
          "OTP verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!email) return;
    try {
      await api({
        url: SummaryApi.resendOtp.url,
        method: SummaryApi.resendOtp.method,
        data: { email },
      });
      alert("OTP resent to your email.");
    } catch {
      alert("Failed to resend OTP.");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl mb-4 font-semibold">Verify OTP</h2>
      <p className="text-sm text-gray-600 mb-3">We sent an OTP to <strong>{email}</strong></p>
      <form onSubmit={submit} className="space-y-3">
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          required
          className="w-full px-3 py-2 border rounded"
        />
        <button type="submit" disabled={loading} className="w-full py-2 rounded bg-green-600 text-white">
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
        <div className="flex justify-between mt-2">
          <button type="button" onClick={resendOtp} className="text-sm text-blue-600">Resend OTP</button>
          <button type="button" onClick={() => { localStorage.removeItem("pending_email"); navigate("/register"); }} className="text-sm text-gray-600">Change Email</button>
        </div>
        {err && <div className="text-red-600 mt-2">{err}</div>}
      </form>
    </div>
  );
}
