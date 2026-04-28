// src/hooks/useAuth.ts
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import type { UserRole } from '../types';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, isInitialized } = useSelector(
    (state: RootState) => state.auth
  );

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user || !isAuthenticated) return false;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return allowedRoles.includes(user.role as UserRole);
  };

  const isSuperAdmin = hasRole('Super_Admin');
  const isAdmin = hasRole(['Super_Admin', 'Admin']);
  const isSupport = hasRole(['Support_Manager', 'Support']);

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    hasRole,
    isSuperAdmin,
    isAdmin,
    isSupport,
  };
};