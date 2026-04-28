// src/pages/users/UsersPage.tsx
import React, { useState, useMemo } from "react";
import { toast } from "react-toastify";
import {
  useGetAllUsersQuery,
  useSuspendUserMutation,
  useUnsuspendUserMutation,
  useBanUserMutation,
  useApproveInstantSellerMutation,
  useApproveUserEmailMutation,
  useGetOwnRoleQuery
} from "../store/api/userApi";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

import UserStatsCards from "../components/user/UserStatsCards";
import UserFilters from "../components/user/UserFilters";
import UsersTable from "../components/user/UsersTable";
import UserDetailsModal from "../components/user/UserDetailsModal";
import ActionModal from "../components/user/ActionModal";

export interface User {
  _id: string;
  id: string;
  name?: string;
  email: string;
  role: string;
  accountStatus: "active" | "suspended" | "banned";
  kycStatus: "not_submitted" | "pending" | "approved" | "rejected";
  kycLevel?: string;
  isInstantSeller: boolean;
  createdAt: string;
  lastLoginAt?: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  emailApprovedBy?: string;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  completedTrades: number;
  totalTrades: number;
  averageRating: number;
  badges?: Array<{ type: string; earnedAt: string }>;
  escrowDepositAmount?: number;
}

export const Users: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kycFilter, setKycFilter] = useState("all");

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    type: 'suspend' | 'ban' | 'approve-seller' | 'approve-email';
    user: User | null;
  }>({ open: false, type: "suspend", user: null });

  // ✅ Get current user's role and permissions
  const { data: ownRoleData } = useGetOwnRoleQuery();

  const { data, isLoading, isFetching, refetch } = useGetAllUsersQuery({
    search: searchTerm || undefined,
    role: roleFilter === "all" ? undefined : roleFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    kycStatus: kycFilter === "all" ? undefined : kycFilter,
    page: 1,
    limit: 100,
  });

  const [suspendUser] = useSuspendUserMutation();
  const [unsuspendUser] = useUnsuspendUserMutation();
  const [banUser] = useBanUserMutation();
  const [approveInstantSeller] = useApproveInstantSellerMutation();
  const [approveUserEmail] = useApproveUserEmailMutation();

  const users: User[] = useMemo(() => data?.data?.users || [], [data]);
  const pagination = useMemo(
    () => data?.data?.pagination || { total: 0 },
    [data]
  );

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) => kycFilter === "all" || user.kycStatus === kycFilter
    );
  }, [users, kycFilter]);

  const stats = useMemo(
    () => ({
      total: pagination.total,
      active: users.filter((u) => u.accountStatus === "active").length,
      suspended: users.filter((u) => u.accountStatus === "suspended").length,
      banned: users.filter((u) => u.accountStatus === "banned").length,
      instantSellers: users.filter((u) => u.isInstantSeller).length,
      kycApproved: users.filter((u) => u.kycStatus === "approved").length,
    }),
    [users, pagination]
  );

  // ✅ Permission checks
  const canApproveEmail = useMemo(() => {
    return ownRoleData?.role === 'super_admin' || ownRoleData?.role === 'admin';
  }, [ownRoleData]);

  const canBanOrSuspend = useMemo(() => {
    return ownRoleData?.role === 'super_admin' || ownRoleData?.role === 'admin';
  }, [ownRoleData]);

  const canApproveInstantSeller = useMemo(() => {
    return ownRoleData?.role === 'super_admin' ||
      ownRoleData?.role === 'admin' ||
      ownRoleData?.role === 'support_manager';
  }, [ownRoleData]);

  const handleUserAction = async (action: string, user: User) => {
    try {
      // ✅ Frontend permission check
      if (action === 'approve-email' && !canApproveEmail) {
        toast.error("You don't have permission to approve emails");
        return;
      }

      if ((action === 'ban' || action === 'suspend') && !canBanOrSuspend) {
        toast.error("You don't have permission to ban/suspend users");
        return;
      }

      if (action === 'approve-seller' && !canApproveInstantSeller) {
        toast.error("You don't have permission to approve instant sellers");
        return;
      }

      switch (action) {
        case "suspend":
          await suspendUser({
            userId: user._id,
            reason: "Suspicious activity",
          }).unwrap();
          toast.success("User suspended successfully");
          break;
        case "unsuspend":
          await unsuspendUser(user._id).unwrap();
          toast.success("User unsuspended successfully");
          break;
        case "ban":
          await banUser({
            userId: user._id,
            reason: "Terms violation",
          }).unwrap();
          toast.success("User banned successfully");
          break;
        case "approve-seller":
          await approveInstantSeller(user._id).unwrap();
          toast.success("Approved as Instant Seller successfully");
          break;
        case "approve-email":
          await approveUserEmail(user._id).unwrap();
          toast.success("User email approved successfully");
          break;
        default:
          toast.error("Unknown action");
      }
      setActionModal({ open: false, type: "suspend", user: null });
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Action failed");
      console.error("Action error:", err);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Role",
      "Status",
      "KYC",
      "Instant Seller",
      "Email Verified",
      "Trades",
      "Rating",
      "Joined",
    ];
    const rows = filteredUsers.map((u) => [
      u.name || "N/A",
      u.email,
      u.role,
      u.accountStatus,
      u.kycStatus,
      u.isInstantSeller ? "Yes" : "No",
      u.emailVerified ? "Yes" : "No",
      `${u.completedTrades}/${u.totalTrades}`,
      u.averageRating.toFixed(1),
      new Date(u.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success("Exported successfully");
  };

  if (isLoading) return <LoadingSpinner text="Loading users..." />;

  return (
    <div className="space-y-6 p-6 max-w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">
            Manage and monitor all platform users
          </p>
          {/* ✅ Show current role */}
          {ownRoleData?.role && (
            <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
              Role: {ownRoleData.role.replace('_', ' ').toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-4 py-2.5 bg-white border rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            <svg
              className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <UserStatsCards stats={stats} />

      <UserFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        kycFilter={kycFilter}
        setKycFilter={setKycFilter}
      />

      {/* ✅ Pass permissions to table */}
      <UsersTable
        users={filteredUsers}
        onViewDetails={setSelectedUser}
        onAction={(type, user) => {
          // Check permission before opening modal
          if (type === 'approve-email' && !canApproveEmail) {
            toast.error("You don't have permission to approve emails");
            return;
          }
          if ((type === 'ban' || type === 'suspend') && !canBanOrSuspend) {
            toast.error("You don't have permission to ban/suspend users");
            return;
          }
          setActionModal({ open: true, type, user });
        }}
        onApproveSeller={(user) => {
          if (!canApproveInstantSeller) {
            toast.error("You don't have permission to approve instant sellers");
            return;
          }
          handleUserAction("approve-seller", user);
        }}
        onApproveEmail={(user) => {
          if (!canApproveEmail) {
            toast.error("Only Admin and Super Admin can approve emails");
            return;
          }
          handleUserAction('approve-email', user);
        }}
        onUnsuspend={(user) => {
          if (!canBanOrSuspend) {
            toast.error("You don't have permission to unsuspend users");
            return;
          }
          handleUserAction("unsuspend", user);
        }}
        // ✅ Pass permission flags to table component
        canApproveEmail={canApproveEmail}
        canBanOrSuspend={canBanOrSuspend}
        canApproveInstantSeller={canApproveInstantSeller}
      />

      {pagination.total > filteredUsers.length && (
        <div className="text-center text-sm text-gray-600 py-4">
          Showing {filteredUsers.length} of {pagination.total} users
        </div>
      )}

      <UserDetailsModal
        user={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />

      <ActionModal
        open={actionModal.open}
        type={actionModal.type}
        user={actionModal.user}
        onClose={() => setActionModal({ ...actionModal, open: false })}
        onConfirm={() =>
          actionModal.user &&
          handleUserAction(actionModal.type, actionModal.user)
        }
      />
    </div>
  );
};