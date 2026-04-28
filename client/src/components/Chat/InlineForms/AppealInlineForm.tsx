import { useState } from "react";
import { AlertTriangle, Send, CheckCircle } from "lucide-react";
import SummaryApi from "../../../api/SummaryApi";
import api from "../../../api/axios";

interface AppealInlineFormProps {
    tradeId: string;
    onSuccess?: (reason: string) => void;
    onCancel?: () => void;
}

export default function AppealInlineForm({
    tradeId,
    onSuccess,
    onCancel,
}: AppealInlineFormProps) {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            setError("Please provide a reason for the appeal");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const config = SummaryApi.appealTrade(tradeId);
            await api({
                url: config.url,
                method: config.method,
                data: { reason: reason.trim() },
            });

            setSuccess(true);
            onSuccess?.(reason.trim());
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-orange-500 mx-auto" />
                <h3 className="text-white font-bold text-lg">Appeal Submitted</h3>
                <p className="text-white/70 text-sm">
                    Admin will review your appeal and update the trade status soon.
                </p>
                <button
                    onClick={onCancel}
                    className="mt-2 text-white/60 hover:text-white text-xs underline"
                >
                    Close
                </button>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-orange-500/30 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-orange-600 px-4 py-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h3 className="font-bold text-white uppercase tracking-wider text-sm">
                    Trade Appeal
                </h3>
            </div>

            <div className="p-4 space-y-4">
                <p className="text-white/80 text-sm leading-relaxed">
                    If you believe there is an issue with this trade, you can appeal to our admin team. Please provide a clear reason for your appeal.
                </p>

                <div className="space-y-2">
                    <label className="text-white/60 text-xs font-semibold uppercase tracking-widest">
                        Reason for Appeal
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Describe the issue in detail..."
                        rows={4}
                        disabled={submitting}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 transition-colors resize-none text-sm"
                    />
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                        <p className="text-red-400 text-xs">{error}</p>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={submitting}
                        className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white/60 hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !reason.trim()}
                        className="flex-[2] bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 transition-all active:scale-95"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Submit Appeal
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
