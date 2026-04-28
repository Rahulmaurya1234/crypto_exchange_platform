import { useAuth } from "../context/AuthContext";
import { useProfile } from "../hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import {
    Loader2,
    FileText,
    Clock,
    Shield,
    Filter,
    Search,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useGetAuditLogsQuery } from "../store/api/adminApi";
import { AuditLog } from "../types";

export default function AdminLogs() {
    const { user, initializing } = useAuth();
    const { profile, isLoading: profileLoading } = useProfile();
    const navigate = useNavigate();

    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [targetFilter, setTargetFilter] = useState<string>("all");
    const [actionFilter, setActionFilter] = useState<string>("all");

    useEffect(() => {
        if (!initializing && !user) {
            navigate("/");
        }
    }, [user, initializing, navigate]);

    useEffect(() => {
        if (profile && profile.role !== "admin") {
            navigate("/profile");
        }
    }, [profile, navigate]);

    const { data: response, isLoading, error, refetch } = useGetAuditLogsQuery({
        page,
        limit: 20,
        type: targetFilter !== "all" ? targetFilter : undefined,
        action: actionFilter !== "all" ? actionFilter : undefined,
    });

    const logs = response?.data?.logs || [];
    const pagination = response?.data?.pagination;

    // Build action options from data (or predefined list)
    // For now, extract from the logs being shown or keep all unique
    const actionOptions = useMemo(() => {
        const actions = ["listing_create", "listing_update", "listing_delete", "dispute_create", "dispute_resolve", "dispute_update", "user_login", "user_logout", "kyc_approve", "kyc_reject", "kyc_submit", "trade_create", "payment_confirm", "trade_complete", "trade_cancel", "escrow_deposit", "escrow_verify"];
        return actions.sort();
    }, []);

    // Local search filter (since API might not supports search yet, or for better UX)
    const filteredLogs = useMemo(() => {
        if (!searchTerm.trim()) return logs;
        const q = searchTerm.toLowerCase();
        return logs.filter((log: AuditLog) => {
            return (
                log.targetId.toLowerCase().includes(q) ||
                (log.actorId?.name || "").toLowerCase().includes(q) ||
                (log.actorId?.email || "").toLowerCase().includes(q) ||
                (typeof log.details === 'string' ? log.details : JSON.stringify(log.details)).toLowerCase().includes(q)
            );
        });
    }, [logs, searchTerm]);

    if (initializing || profileLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!profile || profile.role !== "admin") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <Header />
                <div className="max-w-2xl mx-auto px-4 py-12">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-red-800 mb-2">
                            Admin access required
                        </h2>
                        <p className="text-sm text-red-700 mb-4">
                            You don&apos;t have permission to view moderation logs.
                        </p>
                        <button
                            onClick={() => navigate("/ads")}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                            Go to marketplace
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <Header />
            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Shield className="w-8 h-8 text-indigo-600" />
                            Security Audit Logs
                        </h1>
                        <p className="text-gray-600 mt-1">
                            A comprehensive trail of critical platform actions and actor records.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-200 mb-6 text-sm">
                        Failed to fetch logs. Please try again.
                    </div>
                )}

                {/* Filters + search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                            <Filter className="w-4 h-4" />
                            <span>Filters</span>
                        </div>

                        {/* Target Model filter */}
                        <select
                            value={targetFilter}
                            onChange={(e) => {
                                setTargetFilter(e.target.value);
                                setPage(1);
                            }}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs md:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                             <option value="all">All Targets</option>
                            <option value="Listing">Listings</option>
                            <option value="Trade">Trades</option>
                            <option value="EscrowTransaction">Escrow</option>
                            <option value="Dispute">Disputes</option>
                            <option value="KYC">KYC</option>
                            <option value="User">Users</option>
                        </select>

                        {/* Action type filter */}
                        <select
                            value={actionFilter}
                            onChange={(e) => {
                                setActionFilter(e.target.value);
                                setPage(1);
                            }}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs md:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Actions</option>
                            {actionOptions.map((act) => (
                                <option key={act} value={act}>
                                    {act.replace(/_/g, " ")}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-72">
                        <span className="absolute inset-y-0 left-3 flex items-center">
                            <Search className="w-4 h-4 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search in view..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-gray-700">Action</th>
                                            <th className="px-6 py-4 font-semibold text-gray-700">Target</th>
                                            <th className="px-6 py-4 font-semibold text-gray-700">Actor</th>
                                            <th className="px-6 py-4 font-semibold text-gray-700">Details</th>
                                            <th className="px-6 py-4 font-semibold text-gray-700">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredLogs.map((log: AuditLog) => (
                                            <tr key={log._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 align-top">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        log.action.includes("create") ? "bg-green-50 text-green-700" :
                                                        log.action.includes("resolve") ? "bg-blue-50 text-blue-700" :
                                                        log.action.includes("delete") ? "bg-red-50 text-red-700" :
                                                        "bg-indigo-50 text-indigo-700"
                                                    }`}>
                                                        {log.action.replace(/_/g, " ")}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="uppercase text-[10px] font-bold text-gray-400 tracking-wider">
                                                            {log.targetModel}
                                                        </span>
                                                        <span className="text-xs text-gray-600 font-mono">
                                                            {log.targetId}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="font-medium text-gray-900 text-sm">
                                                        {log.actorId?.name || "System"}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-semibold">
                                                        {log.actorRole}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-top text-xs text-gray-600 max-w-xs">
                                                    <pre className="whitespace-pre-wrap font-sans">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                </td>
                                                <td className="px-6 py-4 align-top text-sm text-gray-500">
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </div>
                                                    {log.ipAddress && (
                                                        <div className="text-[10px] text-gray-400 mt-1">
                                                            IP: {log.ipAddress}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredLogs.length === 0 && (
                                <div className="p-12 text-center text-gray-500 text-sm">
                                    <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    <p className="font-medium mb-1">
                                        No audit logs found
                                    </p>
                                    <p>Try adjusting your search or filters.</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.pages > 1 && (
                            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200">
                                <div className="text-sm text-gray-600">
                                    Showing page {pagination.page} of {pagination.pages} ({pagination.total} total logs)
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                        disabled={page === pagination.pages}
                                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
