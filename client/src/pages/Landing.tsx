// client/src/pages/Landing.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Shield,
  Zap,
  Wallet,
  MessageCircle,
  Lock,
  Users,
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/register");
  };

  const handleBrowseMarket = () => {
    navigate("/market");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* background glow */}
        <div className="pointer-events-none absolute inset-0 opacity-50 dark:opacity-60">
          <div className="absolute -top-40 -left-10 h-72 w-72 rounded-full bg-cyan-400/20 dark:bg-cyan-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-10 h-72 w-72 rounded-full bg-purple-400/20 dark:bg-purple-500/20 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-16 pt-14 md:flex-row md:items-center md:pb-24 md:pt-20">
          {/* Left: text */}
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Live P2P Crypto Marketplace
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-500 bg-clip-text text-transparent">
                  Cryptians
                </span>
                .
                <br className="hidden sm:block" />
                Trade crypto P2P. Fast. Secure. Transparent.
              </h1>
              <p className="max-w-xl text-sm text-slate-600 sm:text-base dark:text-slate-300">
                A dedicated peer-to-peer platform where buyers and sellers
                connect directly, with escrow-backed protection, real-time chat,
                and instant settlement flows.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-950"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={handleBrowseMarket}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-900"
              >
                Browse marketplace
              </button>

              <span className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                No trading yet? Create your first listing in minutes.
              </span>
            </div>

            <div className="flex flex-wrap gap-6 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                Escrow-style protection
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-500" />
                Fast trade flow
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                P2P + live chat
              </div>
            </div>
          </div>

          {/* Right: card */}
          <div className="flex-1">
            <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-300/50 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-cyan-900/30">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Live snapshot
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Marketplace preview
                  </p>
                </div>
                <div className="rounded-xl bg-slate-100 px-3 py-1 text-[11px] text-emerald-600 dark:bg-slate-800 dark:text-emerald-300">
                  Demo view
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/60">
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Top Seller
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      USDT · Instant Release
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Rate
                    </p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹88.12
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950/40">
                    <p className="text-slate-500 dark:text-slate-400">
                      Avg. Release
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                      &lt; 3 min
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950/40">
                    <p className="text-slate-500 dark:text-slate-400">
                      Completed
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      1,245+
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950/40">
                    <p className="text-slate-500 dark:text-slate-400">
                      Disputes
                    </p>
                    <p className="mt-1 text-sm font-semibold text-red-500 dark:text-red-400/80">
                      &lt; 0.5%
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-3 py-2.5 dark:border-slate-800 dark:from-slate-900/80 dark:via-slate-900/40 dark:to-slate-900/80">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <MessageCircle className="h-4 w-4 text-cyan-500 dark:text-cyan-300" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Trade communication
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-100">
                        In-chat payment proofs & admin support
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleBrowseMarket}
                    className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-cyan-500"
                  >
                    View trades
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span>Real-time listings • Crypto only</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>System online</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12">
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl dark:text-slate-50">
              Built for serious P2P traders
            </h2>
            <p className="text-sm text-slate-600 sm:text-base dark:text-slate-400">
              Everything you actually need to run high-volume, low-friction
              trades. No casino noise.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <FeatureCard
              icon={<Shield className="h-5 w-5" />}
              title="Protected trades"
              description="Admin-verified deposits, proof-of-payment flows, and dispute visibility designed for real counterparty risk."
            />
            <FeatureCard
              icon={<Wallet className="h-5 w-5" />}
              title="Wallet-aware flows"
              description="USDT and other pairs with clear min/max limits, live rate indicators, and clean settlement status."
            />
            <FeatureCard
              icon={<Lock className="h-5 w-5" />}
              title="KYC & trust layers"
              description="KYC upload, profile verification, and transparent credibility signals baked into every trade."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl dark:text-slate-50">
                How Cryptians works
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-600 sm:text-base dark:text-slate-400">
                Simple 3-step flow for both buyers and sellers. No bullshit,
                just a clean trade pipeline.
              </p>
            </div>
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-800 hover:border-cyan-500 hover:text-cyan-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
            >
              Create your first trade
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StepCard
              step="01"
              title="Create / pick a listing"
              description="Post a listing with your limits, rate, and payment methods — or pick a verified seller from the marketplace."
            />
            <StepCard
              step="02"
              title="Lock terms & chat"
              description="A trade room opens with live chat. Share proofs, confirm payment, and track each update in the chat timeline."
            />
            <StepCard
              step="03"
              title="Admin-verified release"
              description="Once payment is confirmed, funds are released. If something breaks, admin sees the full context."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 md:flex-row md:items-center">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">
                Ready to trade
              </p>
              <h3 className="text-lg font-semibold text-slate-900 sm:text-xl dark:text-slate-50">
                Spin up your first P2P trade on Cryptians today.
              </h3>
              <p className="max-w-xl text-sm text-slate-600 dark:text-slate-400">
                Register, complete KYC, and start creating or accepting
                listings. The flow is the same whether you&apos;re trading
                small or scaling volume.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
              >
                Create account
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={handleBrowseMarket}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-slate-500"
              >
                View marketplace
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---- small presentational components ----

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900">
        <span className="text-cyan-600 dark:text-cyan-300">{icon}</span>
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          {title}
        </h3>
        <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

interface StepCardProps {
  step: string;
  title: string;
  description: string;
}

function StepCard({ step, title, description }: StepCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
      <div className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-600 dark:bg-slate-900 dark:text-cyan-300">
          Step {step}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
        {title}
      </h3>
      <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}
