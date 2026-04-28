// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Coins,
  AlertCircle,
  AlertTriangle,
  Shield,
  ShieldCheck,
  LifeBuoy,
  Settings,
  FileText,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Users', path: '/users', icon: Users },
  { name: 'KYC', path: '/kyc', icon: FileCheck },
  { name: 'Trades', path: '/trades', icon: Coins },
  { name: 'Disputes', path: '/disputes', icon: AlertCircle },
  { name: 'Appeals', path: '/appeals', icon: AlertTriangle },
  { name: 'Escrow', path: '/escrow', icon: Shield },
  { name: 'Instant Seller Escrow', path: '/instant-seller-escrow', icon: ShieldCheck },
  { name: 'Support', path: '/support', icon: LifeBuoy },
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Audit Logs', path: '/logs', icon: FileText },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-gray-900/90 backdrop-blur-2xl border-r border-gray-800 z-50 flex flex-col">
      {/* Logo */}
      <div className="p-8 border-b border-gray-800">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Cryptians
        </h1>
        <p className="text-xs text-gray-400 mt-1 tracking-wider">ADMIN PANEL</p>
      </div>

      {/* Navigation with Custom Scrollbar */}
      <nav className="flex-1 px-6 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl shadow-purple-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 hover:shadow-lg'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/50 to-purple-600/50 blur-xl -z-10" />
                  )}
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-400'
                      }`}
                  />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-full" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-gray-800">
        <div className="text-xs text-gray-500 text-center">
          © 2025 Cryptians Admin
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          transition: all 0.3s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }

        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.35);
        }

        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }
      `}</style>
    </aside>
  );
};