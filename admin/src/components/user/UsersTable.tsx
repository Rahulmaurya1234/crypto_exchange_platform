import React from "react";
import {
  Eye,
  UserX,
  UserCheck,
  Ban,
  ShieldCheck,
  Mail,
  Award,
  CheckCircle,
  Shield,
  XCircle,
  UsersIcon,
  MailCheck,
} from "lucide-react";
import { User } from "../Users";

/* ---------------------------------- Styles --------------------------------- */

const roleColors: Record<string, string> = {
  buyer: "bg-blue-100 text-blue-700 border-blue-200",
  seller: "bg-purple-100 text-purple-700 border-purple-200",
  instant_seller: "bg-emerald-100 text-emerald-700 border-emerald-200",
  support: "bg-orange-100 text-orange-700 border-orange-200",
  admin: "bg-indigo-100 text-indigo-700 border-indigo-200",
  super_admin: "bg-red-100 text-red-700 border-red-200",
};

const statusColors: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  suspended: "bg-yellow-50 text-yellow-700 border-yellow-200",
  banned: "bg-red-50 text-red-700 border-red-200",
};

const kycColors: Record<string, string> = {
  not_submitted: "bg-gray-50 text-gray-600 border-gray-200",
  pending: "bg-blue-50 text-blue-700 border-blue-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const kycLevelColors: Record<string, string> = {
  level_0: "bg-gray-100 text-gray-600",
  level_1: "bg-blue-100 text-blue-700",
  level_2: "bg-purple-100 text-purple-700",
  level_3: "bg-emerald-100 text-emerald-700",
};

/* ---------------------------------- Types ---------------------------------- */

export type UserActionType =
  | "suspend"
  | "unsuspend"
  | "ban"
  | "approve-seller"
  | "approve-email";

interface UsersTableProps {
  users: User[];
  onViewDetails: (user: User) => void;
  onAction: (type: UserActionType, user: User) => void;
  onUnsuspend: (user: User) => void;

  /* 🔐 Permissions */
  canApproveEmail: boolean;
  canBanOrSuspend: boolean;
  canApproveInstantSeller: boolean;
}

/* -------------------------------- Component -------------------------------- */

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  onViewDetails,
  onAction,
  onUnsuspend,
  canApproveEmail,
  canBanOrSuspend,
  canApproveInstantSeller,
}) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <UsersIcon className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-lg font-medium text-gray-900">No users found</p>
        <p className="text-sm text-gray-500 mt-1">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                User
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Role
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Account
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                KYC
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                Verification
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                Stats
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr
                key={user._id}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* ------------------------------ User ------------------------------ */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {(user.name || user.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {user.name || "Unknown User"}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>

                {/* ------------------------------ Role ------------------------------ */}
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      roleColors[user.role] ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {user.role.replace("_", " ").toUpperCase()}
                  </span>
                </td>

                {/* ----------------------------- Account ---------------------------- */}
                <td className="px-6 py-4 space-y-2">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                      statusColors[user.accountStatus]
                    }`}
                  >
                    {user.accountStatus.toUpperCase()}
                  </span>

                  {user.isInstantSeller && (
                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <ShieldCheck className="w-4 h-4" />
                      Instant Seller
                    </div>
                  )}
                </td>

                {/* ------------------------------- KYC ------------------------------ */}
                <td className="px-6 py-4 space-y-2">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                      kycColors[user.kycStatus]
                    }`}
                  >
                    {user.kycStatus.replace("_", " ").toUpperCase()}
                  </span>

                  {user.kycLevel && (
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        kycLevelColors[user.kycLevel]
                      }`}
                    >
                      {user.kycLevel.replace("_", " ").toUpperCase()}
                    </div>
                  )}
                </td>

                {/* --------------------------- Verification ------------------------- */}
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-3">
                    {user.emailVerified ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-300" />
                    )}
                    {user.phoneVerified ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-300" />
                    )}
                    {user.twoFactorEnabled && (
                      <Shield className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </td>

                {/* ------------------------------- Stats ----------------------------- */}
                <td className="px-6 py-4 text-center space-y-1">
                  <p className="text-sm font-semibold">
                    {user.completedTrades}/{user.totalTrades}
                  </p>
                  {user.averageRating > 0 && (
                    <div className="flex items-center justify-center gap-1 text-yellow-600">
                      <Award className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {user.averageRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </td>

                {/* ------------------------------ Actions --------------------------- */}
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onViewDetails(user)}
                      className="p-2 hover:bg-indigo-50 rounded-lg"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-indigo-600" />
                    </button>

                    {!user.emailVerified && canApproveEmail && (
                      <button
                        onClick={() => onAction("approve-email", user)}
                        className="p-2 hover:bg-blue-50 rounded-lg"
                        title="Approve Email"
                      >
                        <MailCheck className="w-4 h-4 text-blue-600" />
                      </button>
                    )}

                    {user.accountStatus === "active" &&
                      canBanOrSuspend && (
                        <button
                          onClick={() => onAction("suspend", user)}
                          className="p-2 hover:bg-yellow-50 rounded-lg"
                          title="Suspend"
                        >
                          <UserX className="w-4 h-4 text-yellow-600" />
                        </button>
                      )}

                    {user.accountStatus === "suspended" &&
                      canBanOrSuspend && (
                        <button
                          onClick={() => onUnsuspend(user)}
                          className="p-2 hover:bg-green-50 rounded-lg"
                          title="Unsuspend"
                        >
                          <UserCheck className="w-4 h-4 text-green-600" />
                        </button>
                      )}

                    {user.accountStatus !== "banned" &&
                      canBanOrSuspend && (
                        <button
                          onClick={() => onAction("ban", user)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                          title="Ban User"
                        >
                          <Ban className="w-4 h-4 text-red-600" />
                        </button>
                      )}

                    {!user.isInstantSeller &&
                      user.role === "seller" &&
                      user.kycStatus === "approved" &&
                      canApproveInstantSeller && (
                        <button
                          onClick={() =>
                            onAction("approve-seller", user)
                          }
                          className="p-2 hover:bg-emerald-50 rounded-lg"
                          title="Approve Instant Seller"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        </button>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTable;
