import { useAuth } from "../context/AuthContext";
import { useProfile } from "../hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import {
    Loader2,
    User,
    CheckCircle,
    XCircle,
    Ban,
    Users,
    Filter,
    Search,
} from "lucide-react";
import { usersApi } from "../utils/api";

interface UserData {
    _id: string;
    name: string;
    email: string;
    kycStatus: string; // "not_submitted" | "submitted" | "approved" | "rejected"
    accountStatus: "active" | "suspended" | "deleted";
    createdAt: string;
}

export default function AdminUsers() {
    const { user, initializing } = useAuth();
    const { profile, isLoading } = useProfile();
    const navigate = useNavigate();

    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [kycFilter, setKycFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Basic access control
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

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await usersApi.getAll();
            setUsers(response.data?.data?.users || []);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profile?.role === "admin") {
            fetchUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile]);

    const handleStatusChange = async (id: string, newStatus: string) => {
        const readable =
            newStatus === "deleted"
                ? "delete"
                : newStatus === "suspended"
                    ? "suspend"
                    : "activate";

        if (!confirm(`Are you sure you want to ${readable} this user?`)) return;

        setProcessingId(id);
        try {
            await usersApi.updateStatus(id, newStatus);
            await fetchUsers();
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to update status");
        } finally {
            setProcessingId(null);
        }
    };

    // Derived stats for quick overview
    const stats = useMemo(() => {
        const total = users.length;
        const active = users.filter((u) => u.accountStatus === "active").length;
        const suspended = users.filter((u) => u.accountStatus === "suspended")
            .length;
        const deleted = users.filter((u) => u.accountStatus === "deleted").length;
        const kycPending = users.filter((u) => u.kycStatus === "submitted").length;

        return { total, active, suspended, deleted, kycPending };
    }, [users]);

    // Filtered + searched list
    const filteredUsers = useMemo(() => {
        return users
            .filter((u) => {
                if (kycFilter !== "all" && u.kycStatus !== kycFilter) return false;
                if (statusFilter !== "all" && u.accountStatus !== statusFilter)
                    return false;
                return true;
            })
            .filter((u) => {
                if (!searchTerm.trim()) return true;
                const q = searchTerm.toLowerCase();
                return (
                    u.name.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q) ||
                    u._id.toLowerCase().includes(q)
                );
            });
    }, [users, kycFilter, statusFilter, searchTerm]);

    if (initializing || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!profile || profile.role !== "admin") {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <Header />
            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Users className="w-8 h-8 text-indigo-600" />
                            Manage Users
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Search, filter, and moderate user accounts.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs md:text-sm">
                        <div className="px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                            <span>Total: {stats.total}</span>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-white border border-green-200 text-green-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span>Active: {stats.active}</span>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-white border border-orange-200 text-orange-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                            <span>Suspended: {stats.suspended}</span>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-white border border-red-200 text-red-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            <span>Deleted: {stats.deleted}</span>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-white border border-yellow-200 text-yellow-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-400" />
                            <span>KYC Pending: {stats.kycPending}</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-200 mb-6 text-sm">
                        {error}
                    </div>
                )}

                {/* Filters + search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                            <Filter className="w-4 h-4" />
                            <span>Filters</span>
                        </div>

                        {/* Account status filter */}
                        <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 text-xs md:text-sm">
                            {[
                                { value: "all", label: "All" },
                                { value: "active", label: "Active" },
                                { value: "suspended", label: "Suspended" },
                                { value: "deleted", label: "Deleted" },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setStatusFilter(opt.value)}
                                    className={`px-3 py-1.5 border-r last:border-r-0 ${statusFilter === opt.value
                                        ? "bg-indigo-600 text-white"
                                        : "bg-white text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* KYC filter */}
                        <select
                            value={kycFilter}
                            onChange={(e) => setKycFilter(e.target.value)}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs md:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All KYC</option>
                            <option value="approved">KYC Approved</option>
                            <option value="submitted">KYC Pending</option>
                            <option value="rejected">KYC Rejected</option>
                            <option value="not_submitted">KYC Not Submitted</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <span className="absolute inset-y-0 left-3 flex items-center">
                            <Search className="w-4 h-4 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search by name, email, or ID"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

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
                                        <th className="px-6 py-4 font-semibold text-gray-700">
                                            User
                                        </th>
                                        <th className="px-6 py-4 font-semibold text-gray-700">
                                            KYC Status
                                        </th>
                                        <th className="px-6 py-4 font-semibold text-gray-700">
                                            Account Status
                                        </th>
                                        <th className="px-6 py-4 font-semibold text-gray-700">
                                            Created At
                                        </th>
                                        <th className="px-6 py-4 font-semibold text-gray-700">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.map((u) => (
                                        <tr key={u._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                                        <User className="w-4 h-4 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {u.name || "-"}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {u.email || "No email"}
                                                        </p>
                                                        <p className="text-xs text-gray-400 truncate max-w-xs">
                                                            ID: {u._id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.kycStatus === "approved"
                                                        ? "bg-green-100 text-green-800"
                                                        : u.kycStatus === "submitted"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : u.kycStatus === "rejected"
                                                                ? "bg-red-100 text-red-800"
                                                                : "bg-gray-100 text-gray-800"
                                                        }`}
                                                >
                                                    {u.kycStatus
                                                        ? u.kycStatus.replace("_", " ").toUpperCase()
                                                        : "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.accountStatus === "active"
                                                        ? "bg-green-100 text-green-800"
                                                        : u.accountStatus === "suspended"
                                                            ? "bg-orange-100 text-orange-800"
                                                            : "bg-red-100 text-red-800"
                                                        }`}
                                                >
                                                    {u.accountStatus.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {u.createdAt
                                                    ? new Date(u.createdAt).toLocaleDateString()
                                                    : "-"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    {u.accountStatus !== "active" && (
                                                        <button
                                                            onClick={() =>
                                                                handleStatusChange(u._id, "active")
                                                            }
                                                            disabled={processingId === u._id}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Activate"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {u.accountStatus !== "suspended" && (
                                                        <button
                                                            onClick={() =>
                                                                handleStatusChange(u._id, "suspended")
                                                            }
                                                            disabled={processingId === u._id}
                                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                            title="Suspend"
                                                        >
                                                            <Ban className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {u.accountStatus !== "deleted" && (
                                                        <button
                                                            onClick={() =>
                                                                handleStatusChange(u._id, "deleted")
                                                            }
                                                            disabled={processingId === u._id}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredUsers.length === 0 && (
                            <div className="p-12 text-center text-gray-500 text-sm">
                                <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="font-medium mb-1">No users match your filters</p>
                                <p>Try clearing search or changing the filter selection.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
