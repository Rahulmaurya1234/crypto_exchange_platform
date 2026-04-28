import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Bell,
  MessageCircle,
  PlusCircle,
  LogOut as LogOutIcon,
  Menu,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import api from "../api/axios";
import SummaryApi from "../api/SummaryApi";
import socketService from "../services/socket.service";
import { NotificationDropdown } from "./Notifications";
import { logout as logoutAction } from "../features/auth/authSlice";

import logoWithName from "../assets/logoWithName.png";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);

  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [chatRequests, setChatRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const user = (auth.user ?? null) as any;
  const isLoggedIn = !!user;

  // Safe access to user properties with defaults
  const avatarUrl = user?.avatarUrl ?? null;
  const name = user?.name ?? "Guest";
  const email = user?.email ?? "Not logged in";

  // Check if user is logged in AND KYC is NOT approved
  const isKycBlocked = Boolean(user && user.kycStatus !== "approved");

  // Check if current route is profile or subroutes
  const isProfileRoute =
    location.pathname === "/profile" ||
    location.pathname.startsWith("/profile/");

  const safeNavigate = (path: string) => {
    setMobileOpen(false);
    setUserMenuOpen(false);

    // Block navigation to create listing if KYC not approved
    if (path === "/market/create" && isKycBlocked) {
      alert("Please complete your KYC verification to create listings.");
      return;
    }

    navigate(path);
  };

  const safeCreateListing = () => {
    setMobileOpen(false);

    if (isKycBlocked) {
      alert("Please complete your KYC verification to create listings.");
      return;
    }

    navigate("/market/create");
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    // Fetch existing notifications
    const fetchNotifications = async () => {
      try {
        const response = await api({
          url: SummaryApi.getNotifications.url,
          method: SummaryApi.getNotifications.method,
        });
        if (response.data.success) {
          setNotifications(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();

    if (!socketService.isConnected()) {
      socketService.connect(); // cookie-based, no token
    }

    const socket = socketService.getSocket();
    if (socket) {
      socket.on("chat:request", (data: any) => {
        setChatRequests((prev) => {
          if (prev.find((cr) => cr.chatId === data.chatId)) return prev;
          return [data, ...prev];
        });
      });

      // Listen for general notifications
      socket.on("notification", (data: any) => {
        console.log("📢 Header received notification:", data);

        // Show desktop toast
        if (data.type === "kyc_approved") {
          toast.success(data.message || "Your KYC has been approved!");
        } else if (data.type === "kyc_rejected") {
          toast.error(data.message || "Your KYC has been rejected.");
        } else if (data.type === "trade_initiated") {
          toast.success(`🤝 ${data.title || "New Trade"}`);
        } else if (data.type === "escrow_confirmed") {
          toast.success(`🛡️ ${data.title || "Escrow Secured"}`);
        } else if (data.type === "payment_uploaded") {
          toast.info(`💰 ${data.title || "Payment Proof Uploaded"}`);
        } else if (data.type === "payment_confirmed") {
          toast.success(`✅ ${data.title || "Payment Confirmed"}`);
        } else if (data.type === "trade_completed") {
          toast.success(`🎉 ${data.title || "Trade Completed"}`);
        } else if (data.type === "trade_cancelled") {
          toast.error(`❌ ${data.title || "Trade Cancelled"}`);
        } else if (data.type === "trade_appealed") {
          toast.warning(`⚖️ ${data.title || "Trade Appealed"}`);
        } else {
          toast.info(data.message || "New notification received");
        }

        setNotifications((prev) => {
          // Deduplicate
          if (data.id && prev.find((n) => n._id === data.id || n.id === data.id)) return prev;

          // Map to match dropdown expectations if needed
          const newNotif = {
            id: data.id || `notif-${Date.now()}`,
            _id: data.id,
            type: data.type,
            title: data.title,
            message: data.message,
            createdAt: new Date(),
            isRead: false,
          };
          return [newNotif, ...prev];
        });
      });

      socket.on("chat:user-joined", (data: any) => {
        console.log("User joined chat:", data);
      });
    }

    return () => {
      if (socket) {
        socket.off("chat:request");
        socket.off("notification");
        socket.off("chat:user-joined");
      }
    };
  }, [isLoggedIn]);

  const handleOpenChat = async (chatRequest: any) => {
    try {
      const { chatId, listing } = chatRequest;
      const listingId = listing?._id || listing?.id;

      if (!chatId) {
        alert("Chat ID not found");
        return;
      }

      // Check KYC before opening chat
      if (isKycBlocked) {
        alert("Please complete your KYC verification to chat with sellers.");
        return;
      }

      await api({
        url: `/api/v1/platform-a/chat/${chatId}/join`,
        method: "post",
      });

      const socket = socketService.getSocket();
      if (socket) {
        if (listingId) {
          socket.emit("listing:join", listingId);
          console.log("🛒 Seller joined listing room:", listingId);
        }
        socket.emit("chat:join", chatId);
        console.log("💬 Seller joined chat room:", chatId);
      }

      const readConfig = SummaryApi.markChatRead(chatId);
      await api({
        url: readConfig.url,
        method: readConfig.method,
      });

      setChatRequests((prev) => prev.filter((cr) => cr.chatId !== chatId));
      setNotificationsOpen(false);
      navigate(`/chat/${chatId}`);
    } catch (err: any) {
      console.error("Failed to open chat:", err);
      alert("Failed to open chat");
    }
  };

  const handleCloseChatRequest = (chatId: string) => {
    setChatRequests((prev) => prev.filter((cr) => cr.chatId !== chatId));
  };

  const handleMarkAllRead = async () => {
    try {
      await api({
        url: SummaryApi.markAllNotificationsRead.url,
        method: SummaryApi.markAllNotificationsRead.method,
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleClearAll = () => {
    setNotifications([]);
    setChatRequests([]);
  };

  const handleLogout = async () => {
    setMobileOpen(false);
    setUserMenuOpen(false);

    try {
      // hit backend logout (clears cookies)
      const cfg = SummaryApi.logout || {
        url: "/api/v1/platform-a/auth/logout",
        method: "post",
      };
      await api({
        url: cfg.url,
        method: cfg.method,
      });
    } catch (err) {
      console.error("Logout API failed:", err);
    } finally {
      try {
        socketService.disconnect?.();
      } catch (e) {
        console.error("Socket disconnect failed:", e);
      }

      dispatch(logoutAction());
      navigate("/login");
    }
  };

  // Calculate total active/unread notifications
  const unreadGeneralCount = notifications.filter(n => !n.isRead).length;
  const totalNotifications = unreadGeneralCount + chatRequests.length;

  // Check if we should hide search and create listing button (only hide on profile pages)
  const shouldHideControls = isProfileRoute;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-md shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileOpen((s) => !s)}
            className="lg:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            ) : (
              <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            )}
          </button>

          <div
            className="flex items-center cursor-pointer"
            onClick={() => safeNavigate("/market")}
            role="button"
            aria-label="Go to marketplace"
          >
            <img
              src={logoWithName}
              alt="Cryptians"
              className="h-8 w-auto object-contain"
            />
          </div>

          <nav className="hidden lg:flex items-center gap-4 ml-6 text-sm">
            <button
              onClick={() => safeNavigate("/market")}
              className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Marketplace
            </button>
            {isLoggedIn && (
              <>
                <button
                  onClick={() => safeNavigate("/market/my-listings")}
                  className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Offers
                </button>
                <button
                  onClick={() => safeNavigate("/trades")}
                  className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Trades
                </button>
              </>
            )}
            <button
              onClick={() => safeNavigate("/help")}
              className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Help
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {!shouldHideControls && (
            <div className="hidden md:flex items-center bg-slate-50 dark:bg-slate-800 rounded-full px-3 py-1 gap-2 border border-slate-200 dark:border-slate-700">
              <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  navigate(`/market?search=${encodeURIComponent(query)}`)
                }
                placeholder="Search listings..."
                className="bg-transparent outline-none text-sm w-48 text-slate-800 placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                aria-label="Search listings"
              />
            </div>
          )}

          {!isLoggedIn ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate("/login")}
                className="px-2 sm:px-3 py-1.5 rounded-md border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-2 sm:px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Sign Up
              </button>
            </div>
          ) : (
            <>
              {!shouldHideControls && (
                <button
                  onClick={safeCreateListing}
                  disabled={isKycBlocked}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusCircle className="w-4 h-4" /> Create
                </button>
              )}

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => navigate("/chats")}
                    className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Open chats"
                    title="Chats"
                  >
                    <MessageCircle className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                  </button>
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                      {totalNotifications > 9 ? "9+" : totalNotifications}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen((prev) => !prev)}
                    className={`p-2 rounded-lg transition-all duration-200 ${notificationsOpen
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    aria-label="Notifications"
                  >
                    <Bell className={`w-5 h-5 ${notificationsOpen ? 'animate-bounce-short' : ''}`} />
                  </button>

                  <style>{`
                    @keyframes bounce-short {
                      0%, 100% { transform: translateY(0); }
                      50% { transform: translateY(-2px); }
                    }
                    .animate-bounce-short {
                      animation: bounce-short 0.5s ease-in-out infinite;
                    }
                  `}</style>

                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                      {totalNotifications > 9 ? "9+" : totalNotifications}
                    </span>
                  )}

                  <NotificationDropdown
                    chatRequests={chatRequests}
                    notifications={notifications}
                    unreadCount={totalNotifications}
                    open={notificationsOpen}
                    onClose={() => setNotificationsOpen(false)}
                    onOpenChat={handleOpenChat}
                    onDismiss={handleCloseChatRequest}
                    onMarkAllRead={handleMarkAllRead}
                    onClearAll={handleClearAll}
                    onViewAll={() => navigate("/trades")}
                  />
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((s) => !s)}
                  className="flex items-center gap-2 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-haspopup="true"
                  aria-expanded={userMenuOpen}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      className="w-8 h-8 rounded-full object-cover"
                      alt="user avatar"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 rounded-full font-medium">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="hidden sm:block text-left max-w-xs">
                    <div className="text-sm font-medium truncate text-slate-900 dark:text-slate-50">
                      {name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {email}
                    </div>
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white dark:bg-slate-800 shadow-2xl border border-gray-200 dark:border-slate-700 py-2 z-50 ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                        {name}
                        {isKycBlocked && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded">
                            KYC Pending
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{email}</p>
                    </div>

                    <div className="space-y-1 px-2 py-2">
                      <button
                        onClick={() => safeNavigate("/profile")}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        My Profile
                      </button>
                      <button
                        onClick={() => safeNavigate("/wallet")}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        Wallet
                      </button>
                      <button
                        onClick={() => safeNavigate("/market/my-listings")}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        My Listings
                      </button>
                      <button
                        onClick={() => safeNavigate("/trades")}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        My Trades
                      </button>
                      <button
                        onClick={() => safeNavigate("/settings")}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        Settings
                      </button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-slate-700 px-2 py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 transition-colors"
                      >
                        <LogOutIcon className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="px-4 py-4 space-y-1">
            <button
              onClick={() => safeNavigate("/market")}
              className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              Marketplace
            </button>
            {isLoggedIn && (
              <>
                <button
                  onClick={() => safeNavigate("/market/my-listings")}
                  className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  My Listings
                </button>
                <button
                  onClick={() => safeNavigate("/trades")}
                  className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  My Trades
                </button>
                <button
                  onClick={() => safeNavigate("/profile")}
                  className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  My Profile
                </button>
                <button
                  onClick={() => safeNavigate("/settings")}
                  className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  Settings
                </button>
              </>
            )}
            <button
              onClick={() => safeNavigate("/help")}
              className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              Help
            </button>

            {isLoggedIn && (
              <button
                onClick={safeCreateListing}
                disabled={isKycBlocked}
                className="mt-4 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Create Listing
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}