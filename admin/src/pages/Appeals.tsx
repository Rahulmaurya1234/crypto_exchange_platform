import React, { useState } from "react";
import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    Shield,
    RefreshCw,
    Eye,
    MessageSquare,
} from "lucide-react";
import {
    useResolveAppealMutation,
} from "../store/api/disputesApi";
// We need a query for appealed trades. I'll define it in a new slice or update disputesApi.
import { baseApi } from "../store/api/baseApi";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { toast } from "react-toastify";

// Extend disputeApi with getAppealedTrades
const appealsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAppealedTrades: builder.query<any, void>({
            query: () => "/api/v1/platform-b/trades/appealed",
            providesTags: ["Trade" as any],
        }),
    }),
});

const { useGetAppealedTradesQuery } = appealsApi;

export const Appeals: React.FC = () => {
    const { data, isLoading, refetch } = useGetAppealedTradesQuery();
    const [resolveAppeal] = useResolveAppealMutation();

    const [selectedTrade, setSelectedTrade] = useState<any>(null);
    const [remarks, setRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const appealedTrades = data?.data || [];

    const handleResolve = async (decision: "approved" | "rejected") => {
        if (!selectedTrade || !remarks.trim()) {
            toast.error("Please provide remarks");
            return;
        }

        setSubmitting(true);
        try {
            await resolveAppeal({
                id: selectedTrade._id,
                decision,
                remarks,
            }).unwrap();

            toast.success(`Appeal ${decision} successfully`);
            setSelectedTrade(null);
            setRemarks("");
            refetch();
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to resolve appeal");
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner text="Loading appeals..." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">Trade Appeals</h1>
                    <p className="text-gray-600 mt-2 text-lg">
                        Review and resolve user appeals for trades
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="px-5 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2"
                >
                    <RefreshCw className="w-5 h-5" />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {appealedTrades.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                        <Shield className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <p className="text-xl text-gray-500">No active appeals</p>
                    </div>
                ) : (
                    appealedTrades.map((trade: any) => (
                        <div
                            key={trade._id}
                            onClick={() => setSelectedTrade(trade)}
                            className="bg-white rounded-2xl shadow-lg border-2 border-orange-200 hover:border-orange-400 transition-all duration-300 cursor-pointer p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                                    <div>
                                        <p className="font-mono font-bold text-gray-900">
                                            #{trade._id.slice(-8)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Appealed on {new Date(trade.appealedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase">
                                    Appealed
                                </span>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-500">Buyer</p>
                                        <p className="font-semibold">{trade.buyerId?.name || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Seller</p>
                                        <p className="font-semibold">{trade.sellerId?.name || "N/A"}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-gray-500">Amount</p>
                                    <p className="font-bold text-indigo-600">
                                        {trade.cryptoAmount} {trade.cryptoType || "USDT"} (₹{trade.totalINRAmount?.toLocaleString()})
                                    </p>
                                </div>
                                <div className="pt-3 border-t border-gray-100">
                                    <p className="text-gray-500">Appeal Reason</p>
                                    <p className="italic text-gray-700 line-clamp-2">
                                        "{trade.appealReason}"
                                    </p>
                                </div>
                            </div>

                            <button className="mt-4 w-full py-2 bg-orange-50 text-orange-600 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-100 transition">
                                <Eye className="w-4 h-4" />
                                Review Appeal
                            </button>
                        </div>
                    ))
                )}
            </div>

            {selectedTrade && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
                        <div className="bg-orange-600 p-6 flex justify-between items-center text-white">
                            <div className="flex items-center gap-3">
                                <Shield className="w-8 h-8" />
                                <h3 className="text-2xl font-bold">Review Trade Appeal</h3>
                            </div>
                            <button
                                onClick={() => setSelectedTrade(null)}
                                className="p-2 hover:bg-white/20 rounded-full transition"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Buyer Details</p>
                                    <p className="font-bold text-gray-900">{selectedTrade.buyerId?.name}</p>
                                    <p className="text-sm text-gray-600">{selectedTrade.buyerId?.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Seller Details</p>
                                    <p className="font-bold text-gray-900">{selectedTrade.sellerId?.name}</p>
                                    <p className="text-sm text-gray-600">{selectedTrade.sellerId?.email}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs text-orange-600 uppercase font-bold">The Appeal</p>
                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                    <div className="flex items-start gap-3">
                                        <MessageSquare className="w-5 h-5 text-orange-600 mt-1 shrink-0" />
                                        <p className="text-gray-800 italic leading-relaxed">
                                            "{selectedTrade.appealReason}"
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Admin Remarks</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Explain your decision..."
                                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition outline-none"
                                    rows={4}
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    disabled={submitting}
                                    onClick={() => handleResolve("rejected")}
                                    className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition flex items-center justify-center gap-2"
                                >
                                    <XCircle className="w-5 h-5" />
                                    Reject Appeal
                                </button>
                                <button
                                    disabled={submitting}
                                    onClick={() => handleResolve("approved")}
                                    className="flex-1 py-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Approve Appeal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
