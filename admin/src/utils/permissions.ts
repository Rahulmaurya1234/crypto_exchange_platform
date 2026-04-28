import type { UserRole } from '../types';

export const PERMISSIONS = {
  MANAGE_ADMINS: ['super_admin'],
  MANAGE_USERS: ['super_admin', 'admin'],
  APPROVE_KYC: ['super_admin', 'admin'],
  MANAGE_DISPUTES: ['super_admin', 'admin', 'support_manager'],
  MANAGE_ESCROW: ['super_admin', 'admin'],
  VIEW_ANALYTICS: ['super_admin', 'admin'],
  MANAGE_SUPPORT: ['super_admin', 'admin', 'support_manager', 'support'],
} as const;

export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    Super_Admin: 'Super Admin',
    Admin: 'Admin',
    Support_Manager: 'Support Manager',
    Support: 'Support',
  };
  return labels[role];
};

export const getRoleBadgeColor = (role: UserRole | string): string => {
  const colors: Record<string, string> = {
    Super_Admin: 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/30',
    Admin: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/30',
    Support_Manager: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30',
    Support: 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30',
  };

  return colors[role] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/30';
};
