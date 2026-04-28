import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import SummaryApi from "../api/SummaryApi";
import socketService from "../services/socket.service";

type ChatListItem = {
  id: string;
  tradeId: string;
  title: string;
  subtitle: string;
  time: string;
  participantIds: string[];
  _raw?: any;
};

export default function AllChats() {
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlineStatusMap, setOnlineStatusMap] = useState<Record<string, "online" | "offline">>({});
  const [socketConnected, setSocketConnected] = useState(false);

  const normalizeUserId = (id: any) => {
    if (!id) return "";
    if (typeof id === "object") return String(id._id ?? id.id ?? "");
    return String(id);
  };

  const extractParticipantIds = (c: any): string[] => {
    try {
      const parts = c.participants ?? c.users ?? c.members ?? [];
      return parts
        .map((p: any) => {
          if (!p) return null;
          if (typeof p === "string") return normalizeUserId(p);
          if (p.userId) return normalizeUserId(p.userId);
          if (p._id) return normalizeUserId(p._id);
          if (p.id) return normalizeUserId(p.id);
          return normalizeUserId(p);
        })
        .filter(Boolean) as string[];
    } catch {
      return [];
    }
  };

  const mapServerChats = useCallback((serverChats: any[]): ChatListItem[] => {
    const currentUserId = typeof window !== "undefined" 
      ? (localStorage.getItem("userId") || localStorage.getItem("user_id")) 
      : undefined;

    return (serverChats || [])
      .map((c: any) => {
        const chatId = c._id || c.id;
        if (!chatId) return null;

        const trade = c.tradeId;
        const tradeId = typeof trade === "string" ? trade : trade?._id || trade?.id || "";
        const tradeNumber = trade?.tradeNumber;
        const createdAt = c.lastMessageAt || c.updatedAt || c.createdAt;

        const otherParticipant = (c.participants || []).find((p: any) => {
          const pid = p.userId?._id || p.userId?.id || p.userId;
          return pid && String(pid) !== String(currentUserId);
        });

        const otherUserName = otherParticipant?.userId?.name || otherParticipant?.userId?.email || "Unknown User";
        const otherUserRole = otherParticipant?.role || "";

        let title = otherUserName;
        if (tradeId && tradeNumber) {
          title = `${otherUserName} - Trade #${tradeNumber}`;
        } else if (tradeId) {
          title = `${otherUserName} - Trade`;
        }

        const listingType = c.listingId?.cryptoType || "";
        let subtitle = otherUserRole ? `${otherUserRole.charAt(0).toUpperCase() + otherUserRole.slice(1)}` : "Chat";
        if (listingType) subtitle += ` • ${listingType.toUpperCase()}`;

        const participantIds = extractParticipantIds(c);

        return {
          id: chatId,
          tradeId: tradeId || chatId,
          title,
          subtitle,
          time: createdAt ? new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
          participantIds,
          _raw: c,
        } as ChatListItem;
      })
      .filter(Boolean) as ChatListItem[];
  }, []);

  const fetchChats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cfg = SummaryApi.getAllChats;
      const res = await api({ url: cfg.url, method: cfg.method });
      const payload = res.data?.data || res.data || {};
      const serverChats = Array.isArray(payload.chats) ? payload.chats : Array.isArray(payload) ? payload : [];
      const mapped = mapServerChats(serverChats);
      setChats(mapped);
    } catch (err: any) {
      console.error("Failed to load chats:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, [mapServerChats]);

  useEffect(() => {
    fetchChats();

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token && !socketService.isConnected()) socketService.connect(token);
    } catch (e) {
      console.warn("Socket connect error:", e);
    }

    const s = socketService.getSocket();
    if (!s) return;

    const handleUserStatus = (payload: any) => {
      if (!payload?.userId) return;
      const uid = normalizeUserId(payload.userId);
      const status = payload.status === "online" ? "online" : "offline";
      setOnlineStatusMap((prev) => (prev[uid] === status ? prev : { ...prev, [uid]: status }));
    };

    const handleNewChat = (data: any) => {
      const chatObj = data?.chat ?? data?.chatData ?? data;
      if (chatObj && (chatObj._id || chatObj.id)) {
        const mapped = mapServerChats([chatObj])[0];
        if (mapped) {
          setChats((prev) => {
            const exists = prev.some((c) => c.id === mapped.id || c.tradeId === mapped.tradeId);
            return exists ? prev : [mapped, ...prev];
          });
        } else {
          fetchChats();
        }
      }
    };

    s.on("user:status", handleUserStatus);
    s.on("chat:request", handleNewChat);
    s.on("chat:created", handleNewChat);
    s.on("order:created", handleNewChat);
    s.on("message:new", () => fetchChats());

    s.on("connect", () => setSocketConnected(true));
    s.on("disconnect", () => setSocketConnected(false));
    setSocketConnected(s.connected);

    return () => {
      s.off("user:status", handleUserStatus);
      s.off("chat:request");
      s.off("chat:created");
      s.off("order:created");
      s.off("message:new");
      s.off("connect");
      s.off("disconnect");
    };
  }, [fetchChats, mapServerChats]);

  const isAnyCounterpartyOnline = (participantIds: string[]) => {
    if (!participantIds.length) return false;
    const me = typeof window !== "undefined" ? (localStorage.getItem("userId") || localStorage.getItem("user_id")) : undefined;
    return participantIds.some((pid) => pid !== me && onlineStatusMap[pid] === "online");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Messages</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                <span className="text-sm text-gray-600 dark:text-slate-400">
                  {socketConnected ? 'Connected' : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => fetchChats()}
              className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-medium text-sm hover:shadow-md dark:hover:bg-slate-700 transition-all"
            >
              Refresh
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-600 dark:to-purple-700 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all"
            >
              Back
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Chat List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-3 text-gray-500 dark:text-slate-400">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading chats...</span>
              </div>
            </div>
          ) : chats.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">No messages yet</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">Start a trade from the marketplace to begin chatting</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {chats.map((chat) => {
                const online = isAnyCounterpartyOnline(chat.participantIds);
                const routeId = chat.tradeId !== chat.id ? chat.tradeId : chat.id;

                return (
                  <button
                    key={chat.id}
                    onClick={() => navigate(`/chat/${routeId}`)}
                    className="w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-slate-700/70 transition-all flex items-center gap-4 group"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {chat.title.charAt(0).toUpperCase()}
                      </div>
                      {online && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full ring-2 ring-white dark:ring-slate-800" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-slate-100 truncate pr-2">
                          {chat.title}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-slate-500 flex-shrink-0">
                          {chat.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 truncate">
                        {chat.subtitle}
                      </p>
                    </div>

                    {/* Online Indicator (text fallback) */}
                    {online && (
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        Online
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}