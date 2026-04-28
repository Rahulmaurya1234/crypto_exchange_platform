import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, User, ShoppingBag, Shield } from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Left Section - Branding */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Cryptians</h1>

            {/* Static placeholder (No auth/profile) */}
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-sm text-gray-600">Guest User</span>
              <span className="text-xs px-2 py-1 rounded-full border bg-gray-100 text-gray-800 border-gray-300">
                KYC Status: N/A
              </span>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">

            <button
              onClick={() => navigate("/ads")}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Browse Ads</span>
            </button>

            {/* Admin shortcuts (pure UI placeholders) */}
            <>
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2 text-sm text-indigo-700 hover:text-indigo-800 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 text-sm text-purple-700 hover:text-purple-800 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <span className="hidden sm:inline">More</span>
                  <span className="sm:hidden">⋮</span>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
                    <Link
                      to="/admin/kyc-queue"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      KYC Queue
                    </Link>
                    <Link
                      to="/admin/ads"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Manage Ads
                    </Link>
                    <Link
                      to="/admin/users"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Manage Users
                    </Link>
                    <Link
                      to="/admin/mod-logs"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Moderation Logs
                    </Link>
                  </div>
                )}
              </div>
            </>

            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </button>

            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
