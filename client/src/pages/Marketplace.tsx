import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MessageCircle, Star, ShieldCheck, Zap, MessageSquare } from "lucide-react";
import axios from "../api/axios";
import ChatApi from "../api/ChatApi";
import socketService from "../services/socket.service";
import { useAppSelector } from "../app/hooks";

type Listing = {
  id: string;
  seller: string;
  sellerId: string;
  crypto: string;
  price: number;
  available: number;
  min: number;
  max: number;
  methods: string[];
  timeLimit: number;
  isInstantSeller: boolean;
  createdBy?: string;
  status?: string;
  rating: number;
  completionRate: number;
  networkName?: string;
  rawData?: any;
};

export default function Marketplace() {
  const navigate = useNavigate();
  const auth = useAppSelector((s) => s.auth);
  const user = auth.user as any;
  const authReady = auth.checked && !auth.loading;
  
  const PAYMENT_METHODS = ["UPI", "IMPS", "Bank Transfer", "Paytm", "NEFT", "RTGS"];
  const CRYPTO_OPTIONS = ["USDT"];
  
  const [crypto, setCrypto] = useState<string>("USDT");
  const [method, setMethod] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [networkFilter, setNetworkFilter] = useState<string>("");
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showKycWarning, setShowKycWarning] = useState(false);
  
  // Check if user is logged in AND KYC is NOT approved
  const isKycBlocked = Boolean(user && user.kycStatus !== "approved");

  useEffect(() => {
    if (!authReady) return;

    if (isKycBlocked) {
      setShowKycWarning(true);

      const timer = setTimeout(() => {
        setShowKycWarning(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [authReady, isKycBlocked]);

  const mapServerListing = (item: any): Listing => {
    const id = item._id ?? item.id;
    const sellerObj = item.sellerId ?? {};
    const seller = sellerObj.name ?? sellerObj.email ?? sellerObj.username ?? "Anonymous Seller";
    const sellerId = sellerObj._id ?? sellerObj.id ?? "";
    const crypto = (item.cryptoType ?? "USDT").toString().toUpperCase();
    const price = Number(item.pricePerUnit ?? 0);
    const available = Number(item.availableAmount ?? 0);
    const min = Number(item.minTradeLimit ?? 0);
    const max = Number(item.maxTradeLimit ?? available);
    const methods = Array.isArray(item.paymentMethods)
      ? item.paymentMethods.map((m: string) => m.toUpperCase().replace(/_/g, " "))
      : [];
    const timeLimit = Number(item.timeLimit ?? 30);
    const isInstantSeller = Boolean(sellerObj.isInstantSeller ?? item.isInstantSeller);
    const createdBy = item.createdBy ?? "";
    const status = item.status ?? "";
    const rating = Number(sellerObj.averageRating ?? 0);
    const completionRate = Number(sellerObj.completionRate ?? 0);

    return {
      id,
      seller,
      sellerId,
      crypto,
      price,
      available,
      min,
      max,
      methods,
      timeLimit,
      isInstantSeller,
      createdBy,
      status,
      rating,
      completionRate,
      networkName: item.networkName || "Ethereum",
      rawData: item,
    };
  };

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: any = {};
      if (crypto) params.cryptoType = crypto;
      if (method) params.paymentMethod = method.toLowerCase().replace(/ /g, "_");
      if (search) params.search = search;
      const response = await axios.get("/api/v1/platform-a/listings", { params });
      const data = response.data?.data?.listings ?? response.data?.data ?? response.data ?? [];

      console.log("Fetched listings:", data);
      const listingsArray = Array.isArray(data) ? data : [];
      const mapped = listingsArray.map(mapServerListing);
      setListings(mapped);
    } catch (err: any) {
      console.error("Failed to load listings:", err);
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to load listings");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [crypto, method, search]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Keep socket connected while visiting marketplace
  useEffect(() => {
    if (!authReady || !user) return;

    if (!socketService.isConnected()) {
      socketService.connect(); // cookie-based, no token
    }
    // don't disconnect on unmount (other pages rely on it)
  }, [authReady, user]);

  // Helper function to check if listing is truly an instant seller
  // Helper function to check if listing is truly an instant seller
  const isListingInstantSeller = (listing: Listing): boolean => {
    return listing.createdBy === "InstantSeller";
  };

  const filtered = listings
    .filter((listing) => {
      const matchesCrypto = listing.crypto === crypto;
      const matchesMethod = !method || listing.methods.some((m) => m.toLowerCase().includes(method.toLowerCase()));
      const matchesSearch = !search || listing.seller.toLowerCase().includes(search.toLowerCase());
      const matchesNetwork = !networkFilter || listing.networkName === networkFilter;
      return matchesCrypto && matchesMethod && matchesSearch && matchesNetwork;
    })
    .sort((a, b) => {
      // Sort instant sellers to the top
      const aIsInstant = isListingInstantSeller(a);
      const bIsInstant = isListingInstantSeller(b);
      if (aIsInstant && !bIsInstant) return -1;
      if (!aIsInstant && bIsInstant) return 1;
      return 0;
    });

  function resetFilters() {
    setCrypto("USDT");
    setMethod("");
    setSearch("");
    setNetworkFilter("");
  }

  const handleStartChat = async (listing: Listing) => {
    try {
      const listingId = listing.id;
      if (!listingId) {
        alert("Listing ID not found.");
        return;
      }

      if (!authReady) return;

      // Not logged in → redirect to login
      if (!user) {
        navigate("/login");
        return;
      }

      // Logged in but KYC not approved → block with persistent warning
      if (isKycBlocked) {
        setShowKycWarning(true);
        // Do NOT auto-hide this warning when user tries to access chat
        // Keep it visible until they complete KYC
        return;
      }

      // Ensure socket active first (so join events reach server)
      if (!socketService.isConnected()) socketService.connect();

      // Create or retrieve chat for the listing
      const res = await ChatApi.openChatWithListing(listingId);
      const chat = res.data?.data?.chat || res.data?.chat || res.data;

      // Extract IDs as strings
      const chatIdRaw = chat?._id ?? chat?.id;
      const chatId = chatIdRaw ? (typeof chatIdRaw === 'string' ? chatIdRaw : String(chatIdRaw)) : null;

      const tradeIdRaw = chat?.tradeId ?? chat?.trade;
      const tradeId = tradeIdRaw
        ? (typeof tradeIdRaw === 'string' ? tradeIdRaw : String(tradeIdRaw._id ?? tradeIdRaw))
        : undefined;

      if (!chatId) {
        alert("Failed to create/open chat");
        return;
      }

      // Join chat room (chat:{chatId}) if we have it
      if (chatId) {
        try {
          socketService.joinChat(chatId);
        } catch {
          // fallback to raw emit
          socketService.getSocket()?.emit("chat:join", chatId);
        }
      }

      // Also join the listing/trade room
      if (tradeId) {
        socketService.joinTrade(tradeId);
      } else {
        socketService.joinListing(listingId);
      }

      // Navigate to chat page
      const routeId = tradeId ?? chatId;
      navigate(`/chat/${routeId}`);
    } catch (err: any) {
      console.error("Failed to open chat:", err);
      alert(err?.response?.data?.message || err?.message || "Failed to open chat");
    }
  };

  const getBadge = (listing: Listing) => {
    // Check if listing is truly an instant seller
    if (isListingInstantSeller(listing)) {
      return {
        text: "Instant Seller",
        color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
        icon: Zap
      };
    }
    // Otherwise it's a regular listing
    return {
      text: "Regular Seller",
      color: "bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600",
      icon: null
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* KYC Warning Banner - Shows when user is logged in but KYC is not approved */}
        {showKycWarning && (
          <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 px-4 py-4 text-sm text-red-800 dark:text-red-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <div>
                  <strong className="font-bold">KYC Required</strong>
                  <p className="mt-1">Complete your KYC verification to start trading, create listings, and chat with sellers.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate("/kyc")}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Complete KYC
                </button>
                <button 
                  onClick={() => setShowKycWarning(false)}
                  className="px-4 py-2 border border-red-300 text-red-700 dark:text-red-300 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">P2P Marketplace</h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">Buy and sell crypto with ease</p>
          </div>
          <button 
            onClick={() => {
              if (isKycBlocked) {
                setShowKycWarning(true);
                return;
              }
              navigate("/market/create");
            }}
            disabled={isKycBlocked}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-indigo-600 dark:to-purple-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Create Listing
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Cryptocurrency</div>
                <select 
                  value={crypto} 
                  onChange={(e) => setCrypto(e.target.value)} 
                  className="px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm font-medium focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all"
                  disabled={isKycBlocked}
                >
                  {CRYPTO_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Network</div>
                <select 
                  value={networkFilter} 
                  onChange={(e) => setNetworkFilter(e.target.value)} 
                  className="px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm font-medium focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all"
                  disabled={isKycBlocked}
                >
                  <option value="">All Networks</option>
                  <option value="Ethereum">Ethereum</option>
                  <option value="BSC">BSC</option>
                  <option value="Polygon">Polygon</option>
                  <option value="TRON">TRON</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4 flex-1">
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Payment Method</div>
                <select 
                  value={method} 
                  onChange={(e) => setMethod(e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all"
                  disabled={isKycBlocked}
                >
                  <option value="">All Methods</option>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Search Seller</div>
                <div className="flex items-center gap-2 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-4 py-2 focus-within:border-indigo-500 dark:focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-200 dark:focus-within:ring-indigo-800 transition-all">
                  <Search className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                  <input 
                    className="outline-none text-sm flex-1 bg-transparent text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500" 
                    placeholder="Search by seller name..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    disabled={isKycBlocked}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button 
                onClick={resetFilters} 
                className="px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isKycBlocked}
              >
                Reset
              </button>
              <button 
                onClick={() => fetchListings()} 
                className="px-5 py-2.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isKycBlocked}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{crypto} Listings</h2>
            <div className="flex items-center gap-2 text-sm">
              {loading ? <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400"><div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />Loading...</div> : <span className="text-gray-600 dark:text-slate-400 font-medium">{filtered.length} {filtered.length === 1 ? "listing" : "listings"} found</span>}
            </div>
          </div>

          {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 rounded-r-lg"><p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p></div>}

          <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr className="text-gray-600 dark:text-slate-300 text-sm">
                  <th className="py-4 px-6 text-left font-semibold">Seller</th>
                  <th className="py-4 px-6 text-left font-semibold">Network</th>
                  <th className="py-4 px-6 text-left font-semibold">Price</th>
                  <th className="py-4 px-6 text-left font-semibold">Available</th>
                  <th className="py-4 px-6 text-left font-semibold">Limits</th>
                  <th className="py-4 px-6 text-left font-semibold">Payment</th>
                  <th className="py-4 px-6 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filtered.map((listing) => {
                  const badge = getBadge(listing);
                  const Icon = badge?.icon;
                  return (
                    <tr key={listing.id} className="hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-slate-100">{listing.seller}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {badge && <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>{Icon && <Icon className="w-3 h-3" />}{badge.text}</span>}
                            {listing.rating > 0 && <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-400"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{listing.rating.toFixed(1)}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-semibold uppercase">
                          {listing.networkName}
                        </span>
                      </td>
                      <td className="py-4 px-6"><div className="font-bold text-lg text-gray-900 dark:text-slate-100">${listing.price.toLocaleString()}</div><div className="text-xs text-gray-500 dark:text-slate-400">per {listing.crypto}</div></td>
                      <td className="py-4 px-6"><div className="font-medium text-gray-900 dark:text-slate-100">{listing.available.toLocaleString()} {listing.crypto}</div><div className="text-xs text-gray-500 dark:text-slate-400">≈ ₹{(listing.available * listing.price).toLocaleString()}</div></td>
                      <td className="py-4 px-6"><div className="text-sm text-gray-700 dark:text-slate-300">${listing.min.toLocaleString()} - ${listing.max.toLocaleString()}</div><div className="text-xs text-gray-500 dark:text-slate-400">{listing.timeLimit} min limit</div></td>
                      <td className="py-4 px-6"><div className="flex flex-wrap gap-1">{listing.methods.slice(0,2).map((m,i)=>(<span key={i} className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded text-xs font-medium">{m}</span>))}{listing.methods.length>2 && <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 rounded text-xs">+{listing.methods.length-2}</span>}</div></td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleStartChat(listing)}
                          disabled={isKycBlocked}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-indigo-600 dark:to-purple-700 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Chat
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden space-y-4">
            {filtered.map(listing => {
              const badge = getBadge(listing);
              const Icon = badge?.icon;
              return (
                <div key={listing.id} className="border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-slate-100 text-lg">{listing.seller}</div>
                      <div className="flex items-center gap-2 mt-1.5">{badge && <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>{Icon && <Icon className="w-3 h-3" />}{badge.text}</span>}{listing.rating>0 && <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-400"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{listing.rating.toFixed(1)}</span>}</div>
                    </div>
                    <div className="text-right"><div className="font-bold text-xl text-gray-900 dark:text-slate-100">${listing.price.toLocaleString()}</div><div className="text-xs text-gray-500 dark:text-slate-400">per {listing.crypto}</div><div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1 uppercase">{listing.networkName}</div></div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-slate-400">Available:</span><span className="font-medium text-gray-900 dark:text-slate-100">{listing.available.toLocaleString()} {listing.crypto}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-slate-400">Limits:</span><span className="font-medium text-gray-900 dark:text-slate-100">${listing.min.toLocaleString()} - ${listing.max.toLocaleString()}</span></div>
                    <div className="flex justify-between text-sm items-center"><span className="text-gray-600 dark:text-slate-400">Payment:</span><div className="flex flex-wrap gap-1 justify-end">{listing.methods.slice(0,2).map((m,i)=>(<span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded text-xs">{m}</span>))}{listing.methods.length>2 && <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 rounded text-xs">+{listing.methods.length-2}</span>}</div></div>
                  </div>

                  <button 
                    onClick={() => handleStartChat(listing)} 
                    disabled={isKycBlocked}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-indigo-600 dark:to-purple-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Buy Now
                  </button>
                </div>
              );
            })}
          </div>

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                No listings found
              </h3>
              <p className="text-gray-600 dark:text-slate-400 mb-6">
                Try adjusting your filters or search criteria
              </p>
              <button 
                onClick={resetFilters} 
                className="px-6 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all"
                disabled={isKycBlocked}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}