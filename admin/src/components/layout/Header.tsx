// src/components/layout/Header.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLogoutMutation } from '../../store/api/authApi';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { clearNotifications } from '../../store/slices/notificationSlice';
import { toast } from 'react-toastify';
import { getRoleLabel, getRoleBadgeColor } from '../../utils/permissions';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [logoutMutation] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
      toast.success('Logged out successfully');
    } catch {
      // still logout locally
    } finally {
      dispatch(logout());
      dispatch(clearNotifications());
      navigate('/login');
    }
  };

  return (
    <header className="fixed top-0 left-64 right-0 h-18 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 z-50 shadow-lg">
      <div className="h-full px-8 flex items-center justify-between">
        {/* Left - Title */}
        <div className="flex items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Admin Panel
          </h1>
        </div>

        {/* Right - User Menu */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <NotificationDropdown />

          <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-2xl px-5 py-3 shadow-sm hover:shadow-md transition-all">
            <div className="text-right">
              <p className="font-semibold text-gray-900 text-sm leading-tight">
                {user?.name || 'Admin User'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full text-white shadow-sm ${getRoleBadgeColor(user?.role || 'Admin')}`}>
                  {getRoleLabel(user?.role || 'Admin')}
                </span>
              </div>
            </div>

            {/* Avatar */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <User className="w-7 h-7 text-indigo-600" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="ml-3 p-2.5 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 group"
              title="Logout"
            >
              <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};