// src/react-app/pages/AdminAds.tsx
import { useEffect, useState } from "react";
import Header from "../components/Header";
import {
    Loader2,
    PauseCircle,
    PlayCircle,
    Trash2,
    Tag,
    ShoppingBag,
    Flag,
} from "lucide-react";

type AdStatus = "active" | "paused" | "removed" | "sold" | "flagged";

interface Ad {
    _id: string;
    title: string;
    tokenName: string;
    pricePerUnit: number;
    status: AdStatus;
    createdAt: string;
    user: {
        _id: string;
        name: string;
        email: string;
    };
}

const PLACEHOLDER_ADS: Ad[] = [
    {
        _id: "ad_001",
        title: "Selling 0.5 BTC - Quick transfer",
        tokenName: "BTC",
        pricePerUnit: 3200000,
        status: "active",
        createdAt: new Date().toISOString(),
        user: { _id: "u1", name: "Govind Ghosh", email: "govind@example.com" },
    },
    {
        _id: "ad_002",
        title: "Buy 100 USDT - Bank transfer",
        tokenName: "USDT",
        pricePerUnit: 83,
        status: "paused",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        user: { _id: "u2", name: "Rekha Sharma", email: "rekha@example.com" },
    },
    {
        _id: "ad_003",
        title: "Selling 2 ETH - instant KYC only",
        tokenName: "ETH",
        pricePerUnit: 210000,
        status: "flagged",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        user: { _id: "u3", name: "Ramesh Kumar", email: "ramesh@example.com" },
    },
];

export default function AdminAdsUI() {
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    // NEW: state for flag modal
    const [flagModalAd, setFlagModalAd] = useState<Ad | null>(null);
    const [flagReason, setFlagReason] = useState("");

    // Simulated fetch
    const fetchAds = () => {
        setLoading(true);
        setError("");
        // simulate network latency
        setTimeout(() => {
            setAds(PLACEHOLDER_ADS);
            setLoading(false);
        }, 300);
    };

    useEffect(() => {
        fetchAds();
    }, []);

    // Local-only status update (no API)
    const handleStatusChange = (id: string, newStatus: AdStatus) => {
        const verb =
            newStatus === "removed" ? "delete" : newStatus === "paused" ? "pause" : "activate";
        if (!confirm(`Are you sure you want to ${verb} this ad?`)) return;

        setProcessingId(id);
        // simulate async work
        setTimeout(() => {
            setAds((prev) => prev.map((a) => (a._id === id ? { ...a, status: newStatus } : a)));
            setProcessingId(null);
        }, 500);
    };

    // Local-only flag handling (updates status to "flagged" and stores reason in ad object via user email field note)
    const handleFlagAd = () => {
        if (!flagModalAd) return;
        setProcessingId(flagModalAd._id);

        const reason = flagReason.trim() || "(no reason provided)";
        setTimeout(() => {
            setAds((prev) =>
                prev.map((a) =>
                    a._id === flagModalAd._id
                        ? {
                            ...a,
                            status: "flagged",
                            // store flag reason in user.email temporarily for demo — replace with real log later
                            user: { ...a.user, email: `${a.user.email} • flag:${reason}` },
                        }
                        : a
                )
            );
            setFlagModalAd(null);
            setFlagReason("");
            setProcessingId(null);
        }, 700);
    };

    // Apply client-side filter
    const visibleAds = ads.filter((a) => (statusFilter ? a.status === statusFilter : true));

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <Header />
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <ShoppingBag className="w-8 h-8 text-indigo-600" />
                            Manage Ads
                        </h1>
                        <p className="text-gray-600 mt-1">Monitor and moderate user listings</p>
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="removed">Removed</option>
                        <option value="sold">Sold</option>
                        <option value="flagged">Flagged</option>
                    </select>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-200 mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-gray-700">Ad Details</th>
                                        <th className="px-6 py-4 font-semibold text-gray-700">User</th>
                                        <th className="px-6 py-4 font-semibold text-gray-700">Price</th>
                                        <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                        <th className="px-6 py-4 font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {visibleAds.map((ad) => (
                                        <tr key={ad._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">{ad.title}</p>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                    <Tag className="w-3 h-3" />
                                                    {ad.tokenName}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">ID: {ad._id}</div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <p className="font-medium text-gray-900">{ad.user?.name || "Unknown"}</p>
                                                    <p className="text-gray-500">{ad.user?.email || "No email"}</p>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">₹{ad.pricePerUnit.toLocaleString()}</td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ad.status === "active"
                                                            ? "bg-green-100 text-green-800"
                                                            : ad.status === "paused"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : ad.status === "flagged"
                                                                    ? "bg-orange-100 text-orange-800"
                                                                    : "bg-red-100 text-red-800"
                                                        }`}
                                                >
                                                    {ad.status.toUpperCase()}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    {ad.status !== "active" && ad.status !== "removed" && (
                                                        <button
                                                            onClick={() => handleStatusChange(ad._id, "active")}
                                                            disabled={processingId === ad._id}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Activate"
                                                        >
                                                            <PlayCircle className="w-5 h-5" />
                                                        </button>
                                                    )}

                                                    {ad.status !== "paused" && ad.status !== "removed" && (
                                                        <button
                                                            onClick={() => handleStatusChange(ad._id, "paused")}
                                                            disabled={processingId === ad._id}
                                                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                                            title="Pause"
                                                        >
                                                            <PauseCircle className="w-5 h-5" />
                                                        </button>
                                                    )}

                                                    {ad.status !== "removed" && (
                                                        <button
                                                            onClick={() => {
                                                                setFlagModalAd(ad);
                                                                setFlagReason("");
                                                            }}
                                                            disabled={processingId === ad._id}
                                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                            title="Flag"
                                                        >
                                                            <Flag className="w-5 h-5" />
                                                        </button>
                                                    )}

                                                    {ad.status !== "removed" && (
                                                        <button
                                                            onClick={() => handleStatusChange(ad._id, "removed")}
                                                            disabled={processingId === ad._id}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {visibleAds.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p>No ads found matching your criteria</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Flag modal (UI-only) */}
                {flagModalAd && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Flag Ad</h3>
                            <p className="text-gray-600 mb-3">
                                You are flagging <strong>{flagModalAd.title}</strong>. You can optionally add a reason for internal logs.
                            </p>

                            <textarea
                                value={flagReason}
                                onChange={(e) => setFlagReason(e.target.value)}
                                placeholder="Enter optional reason (for moderation logs)"
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-4"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setFlagModalAd(null);
                                        setFlagReason("");
                                    }}
                                    disabled={processingId === flagModalAd._id}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleFlagAd}
                                    disabled={processingId === flagModalAd._id}
                                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processingId === flagModalAd._id ? "Flagging..." : "Confirm Flag"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
