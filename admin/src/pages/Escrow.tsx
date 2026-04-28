
// src/pages/Escrow.tsx
import React, { useState, useMemo } from 'react';
import { 
  Search, Lock, CheckCircle2, XCircle, ShieldCheck, RefreshCw, Hash, Clock,
  AlertTriangle, Filter, X, Copy, ExternalLink, Bell, User, Wallet, Calendar,
  Send, Building, Globe, Eye, EyeOff,
  TrendingUp, FileText, Banknote, Coins, Check, Ban, Key
} from 'lucide-react';
import { 
  useGetAllEscrowTransactionsQuery,
  useGetDepositedTradesQuery, useVerifyDepositMutation, useReleaseToBuyerMutation
} from '../store/api/escrowApi';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

interface EscrowTransaction {
  _id: string;
  tradeId: { _id: string; tradeNumber: string; status: string };
  userId: { _id: string; name?: string; email: string };
  transactionType: 'deposit' | 'release';
  cryptoType: string;
  networkName?: string;
  amount: number;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  confirmations: number;
  requiredConfirmations: number;
  status: 'pending' | 'confirmed' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

interface DepositedTrade {
  _id: string;
  tradeNumber: string;
  status: string;
  cryptoAmount: number;
  cryptoType: string;
  networkName?: string;
  buyerId: { _id: string; name?: string; email?: string };
  sellerId: { _id: string; name?: string; email?: string };
  sellerBankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branch?: string;
    upiId?: string;
  };
  createdAt: string;
  escrowTransactionHash?: string;
  escrowAddress?: string;
  sellerMustDepositUSDT?: number;
  sellerMustSend?: number;
  buyerWillReceive?: number;
  totalINRAmount?: number;
  sellerNetINR?: number;
  pricePerUnit?: number;
  effectivePricePerUnit?: number;
  paymentMethod?: string;
  platformFeeINR?: number;
  gasFeeINR?: number;
  timeline?: Array<{
    event: string;
    description: string;
    timestamp: string;
    actor?: string;
    _id: string;
  }>;
}

const TRADE_STATUS = {
  DEPOSIT_SUBMITTED: 'deposit_submitted',
  ESCROW_CONFIRMED: 'escrow_confirmed',
  PENDING_SELLER_CONFIRMATION: 'pending_seller_confirmation',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const isValidTxHash = (hash: string): boolean => /^(0x)?[0-9a-fA-F]{40,}$/.test(hash.trim());

export const Escrow: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'deposited'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTx, setSelectedTx] = useState<EscrowTransaction | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<DepositedTrade | null>(null);
  const [releaseModal, setReleaseModal] = useState<{ open: boolean; hash: string }>({ open: false, hash: '' });
  const [verifyModal, setVerifyModal] = useState<{ open: boolean; isValid: boolean; remarks: string }>({ 
    open: false, isValid: true, remarks: '' 
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject' | 'release' | null; show: boolean }>({ 
    type: null, show: false 
  });
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [tradeVerifyRemarks, setTradeVerifyRemarks] = useState('');
  const [tradeVerifyAction, setTradeVerifyAction] = useState<'approve' | 'reject' | null>(null);
  const [txReleaseHash, setTxReleaseHash] = useState('');

  const { data, isLoading, error: allError, refetch } = useGetAllEscrowTransactionsQuery({ page: 1, limit: 50 });
  const { data: depositedTradesData, isLoading: depositedLoading, error: depositedError, refetch: refetchDepositedTrades } = useGetDepositedTradesQuery();
  const [verifyDeposit, { isLoading: isVerifying }] = useVerifyDepositMutation();
  const [releaseToBuyer, { isLoading: isReleasing }] = useReleaseToBuyerMutation();

  // Extract transactions from API response
  const transactions: EscrowTransaction[] = useMemo(() => {
    if (!data?.data || typeof data.data !== 'object' || !('transactions' in data.data)) return [];
    return Array.isArray((data.data as any).transactions) ? (data.data as any).transactions : [];
  }, [data]);

  // Extract deposited trades from API response
  const depositedTrades: DepositedTrade[] = useMemo(() => {
    if (!depositedTradesData?.data) return [];
    return Array.isArray(depositedTradesData.data) ? depositedTradesData.data : [];
  }, [depositedTradesData]);

  // Get pending transactions from all transactions
  const pendingTransactions: EscrowTransaction[] = useMemo(() => 
    transactions.filter(tx => 
      tx.tradeId?.status === TRADE_STATUS.DEPOSIT_SUBMITTED || 
      tx.status === 'pending'
    ), [transactions]
  );

  // Get deposited trades that need verification (status: deposit_submitted)
  const depositedTradesNeedingVerification = useMemo(() => 
    depositedTrades.filter(trade => trade.status === TRADE_STATUS.DEPOSIT_SUBMITTED), 
    [depositedTrades]
  );

  const currentTransactions = activeTab === 'pending' ? pendingTransactions : transactions;

  const filteredDepositedTrades = useMemo(() => {
    if (!searchTerm) return depositedTrades;
    const s = searchTerm.toLowerCase();
    return depositedTrades.filter(t =>
      t.tradeNumber.toLowerCase().includes(s) ||
      (t.buyerId?.name || '').toLowerCase().includes(s) ||
      (t.sellerId?.name || '').toLowerCase().includes(s) ||
      (t.buyerId?.email || '').toLowerCase().includes(s) ||
      (t.sellerId?.email || '').toLowerCase().includes(s)
    );
  }, [depositedTrades, searchTerm]);

  const filtered = useMemo(() => {
    return currentTransactions.filter(tx => {
      if (!tx.tradeId || !tx.userId) return false;
      if (activeTab === 'all' && filterStatus !== 'all' && tx.tradeId.status !== filterStatus) return false;
      const s = searchTerm.toLowerCase();
      return (
        (tx.tradeId.tradeNumber || '').toLowerCase().includes(s) ||
        (tx.userId.email || '').toLowerCase().includes(s) ||
        (tx.userId.name || '').toLowerCase().includes(s) ||
        (tx.txHash || '').toLowerCase().includes(s)
      );
    });
  }, [currentTransactions, searchTerm, filterStatus, activeTab]);

  const handleVerifySubmit = async () => {
    if (!selectedTx?.tradeId) return toast.error('Invalid transaction data');
    if (!confirmAction.show) return setConfirmAction({ type: verifyModal.isValid ? 'approve' : 'reject', show: true });
    
    try {
      await verifyDeposit({
        tradeId: selectedTx.tradeId._id,
        isValid: verifyModal.isValid,
        remarks: verifyModal.remarks || (verifyModal.isValid ? 'Verified by admin' : 'Invalid deposit')
      }).unwrap();
      
      toast.success(verifyModal.isValid ? 'Deposit verified!' : 'Deposit rejected');
      setVerifyModal({ open: false, isValid: true, remarks: '' });
      setConfirmAction({ type: null, show: false });
      setSelectedTx(null);
      refetch();
      refetchDepositedTrades();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Verification failed');
      setConfirmAction({ type: null, show: false });
    }
  };

  const handleTradeVerify = async () => {
    if (!selectedTrade || !tradeVerifyAction) return toast.error('Invalid verification data');
    
    try {
      await verifyDeposit({
        tradeId: selectedTrade._id,
        isValid: tradeVerifyAction === 'approve',
        remarks: tradeVerifyRemarks || (tradeVerifyAction === 'approve' ? 'Deposit verified on blockchain' : 'Deposit rejected by admin')
      }).unwrap();
      
      toast.success(tradeVerifyAction === 'approve' ? 'Trade deposit verified!' : 'Trade deposit rejected');
      setTradeVerifyAction(null);
      setTradeVerifyRemarks('');
      setSelectedTrade(null);
      refetch();
      refetchDepositedTrades();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Verification failed');
    }
  };

  const handleReleaseSubmit = async () => {
    if (!selectedTx?.tradeId) return toast.error('Invalid transaction data');
    if (!releaseModal.hash.trim()) return toast.error('Enter transaction hash');
    if (!isValidTxHash(releaseModal.hash)) return toast.error('Invalid hash format');
    if (!confirmAction.show) return setConfirmAction({ type: 'release', show: true });
    
    try {
      await releaseToBuyer({ tradeId: selectedTx.tradeId._id, releaseHash: releaseModal.hash.trim() }).unwrap();
      toast.success('Escrow released to buyer!');
      setReleaseModal({ open: false, hash: '' });
      setConfirmAction({ type: null, show: false });
      setSelectedTx(null);
      refetch();
      refetchDepositedTrades();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Release failed');
      setConfirmAction({ type: null, show: false });
    }
  };

  const handleTxRelease = async () => {
    if (!selectedTx?.tradeId) return toast.error('Invalid transaction data');
    if (!txReleaseHash.trim()) return toast.error('Enter release transaction hash');
    if (!isValidTxHash(txReleaseHash)) return toast.error('Invalid hash format');
    
    try {
      await releaseToBuyer({ 
        tradeId: selectedTx.tradeId._id, 
        releaseHash: txReleaseHash.trim() 
      }).unwrap();
      
      toast.success('Crypto released to buyer!');
      setTxReleaseHash('');
      setSelectedTx(null);
      refetch();
      refetchDepositedTrades();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Release failed');
    }
  };

  const handleRefresh = () => { 
    refetch(); 
    refetchDepositedTrades(); 
    toast.success('Data refreshed!'); 
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string; icon?: React.ReactNode }> = {
      [TRADE_STATUS.DEPOSIT_SUBMITTED]: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'DEPOSIT PENDING', icon: <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> },
      [TRADE_STATUS.ESCROW_CONFIRMED]: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'ESCROW CONFIRMED', icon: <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> },
      [TRADE_STATUS.PENDING_SELLER_CONFIRMATION]: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'READY TO RELEASE', icon: <Lock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> },
      [TRADE_STATUS.COMPLETED]: { bg: 'bg-green-100', text: 'text-green-700', label: 'COMPLETED', icon: <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> },
      [TRADE_STATUS.CANCELLED]: { bg: 'bg-red-100', text: 'text-red-700', label: 'CANCELLED', icon: <XCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> }
    };
    const c = map[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status.toUpperCase().replace(/_/g, ' '), icon: null };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 max-w-full ${c.bg} ${c.text}`}>{c.icon}<span className="truncate">{c.label}</span></span>;
  };

  const getTxStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'PENDING', icon: <Clock className="w-3 h-3" /> },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'CONFIRMED', icon: <CheckCircle2 className="w-3 h-3" /> },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'COMPLETED', icon: <ShieldCheck className="w-3 h-3" /> },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'FAILED', icon: <XCircle className="w-3 h-3" /> }
    };
    const c = map[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status.toUpperCase(), icon: null };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${c.bg} ${c.text}`}>{c.icon}{c.label}</span>;
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied to clipboard!'); };
  const canVerifyDeposit = (tx: EscrowTransaction | null) => tx?.tradeId?._id && tx.transactionType === 'deposit' && tx.tradeId.status === TRADE_STATUS.DEPOSIT_SUBMITTED;
  const canRelease = (tx: EscrowTransaction | null) => tx?.tradeId?._id && tx.transactionType === 'deposit' && tx.tradeId.status === TRADE_STATUS.PENDING_SELLER_CONFIRMATION;

  const canVerifyTradeDeposit = (trade: DepositedTrade | null) => trade?.status === TRADE_STATUS.DEPOSIT_SUBMITTED;

  const isCurrentTabLoading = (activeTab === 'pending' && isLoading) || (activeTab === 'all' && isLoading) || (activeTab === 'deposited' && depositedLoading);
  const currentError = activeTab === 'pending' ? allError : activeTab === 'all' ? allError : depositedError;

  // Check if sellerBankDetails is empty object
  const hasBankDetails = (bankDetails: any) => {
    if (!bankDetails) return false;
    const hasValues = Object.values(bankDetails).some(value => 
      value !== undefined && value !== null && value !== ''
    );
    return Object.keys(bankDetails).length > 0 && hasValues;
  };

  // Safe slice function for account number
  const getMaskedAccountNumber = (accountNumber?: string) => {
    if (!accountNumber) return '****';
    if (accountNumber.length <= 4) return `****${accountNumber}`;
    return `****${accountNumber.slice(-4)}`;
  };

  if (isCurrentTabLoading && !data && !depositedTradesData) return <LoadingSpinner text="Loading escrow data..." />;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 sm:gap-4">
        <div className="w-full xs:w-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Escrow Management</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base md:text-lg">Monitor and verify escrow transactions</p>
        </div>
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 w-full xs:w-auto">
          <div className="flex items-center justify-between xs:justify-start gap-3">
            <div className="px-4 py-2 sm:px-6 sm:py-3 bg-indigo-100 text-indigo-800 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base border-2 border-indigo-300 whitespace-nowrap">
              {activeTab === 'deposited' ? filteredDepositedTrades.length : filtered.length} {activeTab === 'deposited' ? 'Trades' : 'Transactions'}
              {activeTab === 'deposited' && depositedTradesNeedingVerification.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {depositedTradesNeedingVerification.length} Need Verification
                </span>
              )}
            </div>
            <button onClick={handleRefresh} className="p-2 sm:px-5 sm:py-3 bg-white border border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 w-12 sm:w-auto" aria-label="Refresh">
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {currentError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 text-sm sm:text-base">Error Loading {activeTab === 'deposited' ? 'Trades' : 'Transactions'}</h3>
              <p className="text-red-700 text-xs sm:text-sm mt-1">{(currentError as any)?.data?.message || 'Failed to load data'}</p>
              <button onClick={handleRefresh} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">Try Again</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filters */}
      {activeTab === 'all' && showMobileFilters && (
        <div className="sm:hidden bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Filter by Status</h3>
            <button onClick={() => setShowMobileFilters(false)}><X className="w-5 h-5" /></button>
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-base">
            <option value="all">All Status</option>
            <option value={TRADE_STATUS.DEPOSIT_SUBMITTED}>Pending Verification</option>
            <option value={TRADE_STATUS.ESCROW_CONFIRMED}>Awaiting Payment</option>
            <option value={TRADE_STATUS.PENDING_SELLER_CONFIRMATION}>Ready to Release</option>
            <option value={TRADE_STATUS.COMPLETED}>Completed</option>
            <option value={TRADE_STATUS.CANCELLED}>Cancelled</option>
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button onClick={() => { setActiveTab('pending'); setFilterStatus('all'); }} className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-semibold text-sm sm:text-base transition-colors relative ${activeTab === 'pending' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span className="flex items-center justify-center gap-2">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              Pending Verification
              {pendingTransactions.length > 0 && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{pendingTransactions.length}</span>}
            </span>
            {activeTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600" />}
          </button>
          <button onClick={() => setActiveTab('all')} className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-semibold text-sm sm:text-base transition-colors relative ${activeTab === 'all' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span className="flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />All Transactions</span>
            {activeTab === 'all' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600" />}
          </button>
          <button onClick={() => setActiveTab('deposited')} className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-semibold text-sm sm:text-base transition-colors relative ${activeTab === 'deposited' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
              Deposited Trades
              {depositedTradesNeedingVerification.length > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{depositedTradesNeedingVerification.length}</span>
              )}
            </span>
            {activeTab === 'deposited' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600" />}
          </button>
        </div>

        {/* Search */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                placeholder={activeTab === 'deposited' ? "Search by Trade ID, buyer, or seller..." : "Search by Trade ID, user, or TX hash..."} 
                className="w-full pl-9 sm:pl-12 pr-4 py-3 sm:py-4 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition text-sm sm:text-base" 
              />
            </div>
            {activeTab === 'all' && (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-sm sm:text-base min-w-[160px]">
                    <option value="all">All Status</option>
                    <option value={TRADE_STATUS.DEPOSIT_SUBMITTED}>Pending Verification</option>
                    <option value={TRADE_STATUS.ESCROW_CONFIRMED}>Awaiting Payment</option>
                    <option value={TRADE_STATUS.PENDING_SELLER_CONFIRMATION}>Ready to Release</option>
                    <option value={TRADE_STATUS.COMPLETED}>Completed</option>
                    <option value={TRADE_STATUS.CANCELLED}>Cancelled</option>
                  </select>
                </div>
                <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="sm:hidden px-4 py-3 border border-gray-300 rounded-lg flex items-center justify-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alert */}
      {activeTab === 'pending' && pendingTransactions.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-yellow-900 text-sm sm:text-base">{pendingTransactions.length} {pendingTransactions.length === 1 ? 'Transaction' : 'Transactions'} Awaiting Verification</h3>
              <p className="text-yellow-700 text-xs sm:text-sm mt-1">These deposits require manual verification before funds can be released.</p>
            </div>
          </div>
        </div>
      )}

      {/* Alert for deposited trades needing verification */}
      {activeTab === 'deposited' && depositedTradesNeedingVerification.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-orange-900 text-sm sm:text-base">{depositedTradesNeedingVerification.length} {depositedTradesNeedingVerification.length === 1 ? 'Trade' : 'Trades'} Need Deposit Verification</h3>
              <p className="text-orange-700 text-xs sm:text-sm mt-1">Click on any trade to verify or reject the escrow deposit.</p>
            </div>
          </div>
        </div>
      )}

      {/* Grid - Deposited Trades */}
      {activeTab === 'deposited' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {depositedLoading ? (
            <div className="col-span-full text-center py-16">
              <LoadingSpinner text="Loading deposited trades..." />
            </div>
          ) : filteredDepositedTrades.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
              <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600 font-medium mb-2">
                {searchTerm ? 'No matching trades found' : 'No deposited trades'}
              </p>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                {searchTerm ? 'Try adjusting your search terms' : 'Trades with escrow deposits will appear here once sellers submit their deposit hashes.'}
              </p>
            </div>
          ) : (
            filteredDepositedTrades.map((trade) => (
              <div 
                key={trade._id} 
                onClick={() => setSelectedTrade(trade)} 
                className={`bg-white rounded-xl shadow-md border ${trade.status === TRADE_STATUS.DEPOSIT_SUBMITTED ? 'border-yellow-300 hover:border-yellow-400' : 'border-gray-200 hover:border-indigo-400'} cursor-pointer p-5 transition-all duration-200 hover:shadow-lg`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-indigo-500" />
                    <span className="font-mono font-bold text-indigo-600 text-sm sm:text-base">#{trade.tradeNumber}</span>
                  </div>
                  {getStatusBadge(trade.status)}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Amount:</span>
                    </div>
                    <span className="font-bold text-gray-900">{trade.cryptoAmount} {trade.cryptoType}</span>
                  </div>

                  {trade.networkName && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Network:</span>
                      </div>
                      <span className="font-bold text-blue-600 text-xs uppercase">{trade.networkName}</span>
                    </div>
                  )}
                  
                  {trade.pricePerUnit && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Rate:</span>
                      </div>
                      <span className="font-medium">₹{trade.pricePerUnit.toFixed(2)}/{trade.cryptoType}</span>
                    </div>
                  )}
                  
                  {trade.sellerMustDepositUSDT && (
                    <div className={`${trade.status === TRADE_STATUS.DEPOSIT_SUBMITTED ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-3`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-yellow-800">Seller Must Deposit:</span>
                        <span className="text-xs font-bold text-yellow-900">{trade.sellerMustDepositUSDT} USDT</span>
                      </div>
                      {trade.escrowTransactionHash && (
                        <div className="mt-2">
                          <div className="flex items-center gap-1">
                            <Hash className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600 truncate">Tx: {trade.escrowTransactionHash.substring(0, 20)}...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Buyer</p>
                      <p className="font-medium truncate">{trade.buyerId?.name || trade.buyerId?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Seller</p>
                      <p className="font-medium truncate">{trade.sellerId?.name || trade.sellerId?.email || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {trade.status === TRADE_STATUS.DEPOSIT_SUBMITTED && (
                    <div className="mt-3">
                      <button className="w-full py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors text-sm">
                        Verify Deposit
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(trade.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(trade.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Grid - Transactions (Pending/All) */
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-16">
              <LoadingSpinner text="Loading transactions..." />
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <ShieldCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600">
                {searchTerm ? 'No matching transactions found' : activeTab === 'pending' ? 'No pending transactions' : 'No transactions found'}
              </p>
            </div>
          ) : (
            filtered.map((tx) => (
              <div 
                key={tx._id} 
                onClick={() => setSelectedTx(tx)} 
                className="bg-white rounded-xl shadow-md border-2 hover:border-indigo-400 cursor-pointer p-5 sm:p-6 transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-indigo-500" />
                    <span className="font-mono font-bold text-indigo-600 text-sm sm:text-base">#{tx.tradeId.tradeNumber}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(tx.tradeId.status)}
                    {getTxStatusBadge(tx.status)}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">User</p>
                      <p className="text-sm font-medium truncate">{tx.userId.name || tx.userId.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-sm font-medium">{tx.amount} {tx.cryptoType} {tx.networkName && <span className="text-[10px] text-blue-600 font-bold ml-1 uppercase">({tx.networkName})</span>}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Transaction Hash</p>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-mono truncate">{tx.txHash || 'Not available'}</p>
                        {tx.txHash && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(tx.txHash); }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Confirmations</p>
                      <p className="text-sm font-medium">
                        {tx.confirmations}/{tx.requiredConfirmations} {tx.status === 'confirmed' && '✓'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Type: {tx.transactionType}</span>
                    <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {canVerifyDeposit(tx) && (
                  <div className="mt-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTx(tx);
                        setVerifyModal({ open: true, isValid: true, remarks: '' });
                      }}
                      className="w-full py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors text-sm"
                    >
                      Verify Deposit
                    </button>
                  </div>
                )}
                
                {canRelease(tx) && (
                  <div className="mt-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTx(tx);
                        setReleaseModal({ open: true, hash: '' });
                      }}
                      className="w-full py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm"
                    >
                      Release to Buyer
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Transaction Detail Modal with Release Crypto button */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
                <button onClick={() => {
                  setSelectedTx(null);
                  setTxReleaseHash('');
                }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">TRADE INFO</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trade ID:</span>
                        <span className="font-mono font-bold text-indigo-600">#{selectedTx.tradeId.tradeNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trade Status:</span>
                        {getStatusBadge(selectedTx.tradeId.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction Status:</span>
                        {getTxStatusBadge(selectedTx.status)}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">USER INFO</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedTx.userId.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedTx.userId.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">TRANSACTION INFO</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{selectedTx.transactionType}</span>
                      </div>
                       <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-bold">{selectedTx.amount} {selectedTx.cryptoType}</span>
                      </div>
                      {selectedTx.networkName && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Network:</span>
                          <span className="font-bold text-blue-600 uppercase">{selectedTx.networkName}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Confirmations:</span>
                        <span className="font-medium">{selectedTx.confirmations}/{selectedTx.requiredConfirmations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{new Date(selectedTx.createdAt).toLocaleString()}</span>
                      </div>
                      {selectedTx.completedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Completed:</span>
                          <span className="font-medium">{new Date(selectedTx.completedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">ADDRESSES</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-gray-600 text-sm">From:</p>
                        <div className="flex items-center gap-1">
                          <p className="font-mono text-sm truncate">{selectedTx.fromAddress}</p>
                          <button onClick={() => copyToClipboard(selectedTx.fromAddress)}>
                            <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">To:</p>
                        <div className="flex items-center gap-1">
                          <p className="font-mono text-sm truncate">{selectedTx.toAddress}</p>
                          <button onClick={() => copyToClipboard(selectedTx.toAddress)}>
                            <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">TRANSACTION HASH</h3>
                <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                  <p className="font-mono text-sm truncate">{selectedTx.txHash || 'Not available'}</p>
                  <div className="flex items-center gap-2">
                    {selectedTx.txHash && (
                      <>
                        <button 
                          onClick={() => copyToClipboard(selectedTx.txHash)}
                          className="p-2 hover:bg-gray-200 rounded-lg"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a 
                          href={`https://etherscan.io/tx/${selectedTx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-gray-200 rounded-lg"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Release Crypto Section (only for pending_seller_confirmation status) */}
              {selectedTx.tradeId.status === TRADE_STATUS.PENDING_SELLER_CONFIRMATION && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Key className="w-6 h-6 text-purple-600" />
                      <div>
                        <h3 className="font-bold text-purple-900 text-lg">Release Crypto to Buyer</h3>
                        <p className="text-purple-700 text-sm">Release escrowed {selectedTx.amount} {selectedTx.cryptoType} to buyer's wallet</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-2">
                        Release Transaction Hash <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        value={txReleaseHash}
                        onChange={(e) => setTxReleaseHash(e.target.value)}
                        placeholder="Enter the transaction hash from blockchain (e.g., 0x111122223333...)"
                        className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-500 font-mono text-sm"
                      />
                      <p className="text-xs text-purple-600 mt-2">
                        Enter the transaction hash from your wallet after releasing the funds to buyer
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setTxReleaseHash('')}
                        className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                        disabled={isReleasing}
                      >
                        Clear
                      </button>
                      <button 
                        onClick={handleTxRelease}
                        disabled={isReleasing || !txReleaseHash.trim() || !isValidTxHash(txReleaseHash)}
                        className={`flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 ${(!txReleaseHash.trim() || isReleasing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isReleasing ? (
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Releasing...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Send className="w-4 h-4" />
                            Release Crypto
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {canVerifyDeposit(selectedTx) && (
                  <button 
                    onClick={() => {
                      setVerifyModal({ open: true, isValid: true, remarks: '' });
                      setSelectedTx(null);
                      setTxReleaseHash('');
                    }}
                    className="flex-1 py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                  >
                    Verify Deposit
                  </button>
                )}
                {canRelease(selectedTx) && (
                  <button 
                    onClick={() => {
                      setReleaseModal({ open: true, hash: '' });
                      setSelectedTx(null);
                      setTxReleaseHash('');
                    }}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Release to Buyer
                  </button>
                )}
                <button 
                  onClick={() => {
                    setSelectedTx(null);
                    setTxReleaseHash('');
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trade Detail Modal (keep existing) */}
      {selectedTrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Trade Details</h2>
                  <p className="text-indigo-600 font-mono font-bold">#{selectedTrade.tradeNumber}</p>
                </div>
                <button onClick={() => {
                  setSelectedTrade(null);
                  setTradeVerifyAction(null);
                  setTradeVerifyRemarks('');
                }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Verification Section (only show for deposit_submitted trades) */}
              {canVerifyTradeDeposit(selectedTrade) && (
                <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      <div>
                        <h3 className="font-bold text-yellow-900 text-lg">Deposit Verification Required</h3>
                        <p className="text-yellow-700 text-sm">Verify or reject the escrow deposit transaction</p>
                      </div>
                    </div>
                  </div>

                  {tradeVerifyAction ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Remarks for {tradeVerifyAction === 'approve' ? 'Approval' : 'Rejection'}
                        </label>
                        <textarea 
                          value={tradeVerifyRemarks}
                          onChange={(e) => setTradeVerifyRemarks(e.target.value)}
                          placeholder={tradeVerifyAction === 'approve' 
                            ? "Enter remarks for deposit approval (e.g., 'Deposit verified on blockchain with 12 confirmations')" 
                            : "Enter reason for deposit rejection (e.g., 'Transaction hash invalid or insufficient confirmations')"}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 resize-none text-sm"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            setTradeVerifyAction(null);
                            setTradeVerifyRemarks('');
                          }}
                          className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                          disabled={isVerifying}
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleTradeVerify}
                          disabled={isVerifying}
                          className={`flex-1 py-3 rounded-lg font-semibold text-white transition-colors ${tradeVerifyAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                        >
                          {isVerifying ? (
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Processing...
                            </div>
                          ) : tradeVerifyAction === 'approve' ? (
                            <div className="flex items-center justify-center gap-2">
                              <Check className="w-4 h-4" />
                              Confirm Approval
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <Ban className="w-4 h-4" />
                              Confirm Rejection
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setTradeVerifyAction('approve')}
                        className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Approve Deposit
                      </button>
                      <button 
                        onClick={() => setTradeVerifyAction('reject')}
                        className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject Deposit
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Trade Overview */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Trade Overview
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status:</span>
                        {getStatusBadge(selectedTrade.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Crypto Amount:</span>
                        <span className="font-bold">{selectedTrade.cryptoAmount} {selectedTrade.cryptoType}</span>
                      </div>
                      {selectedTrade.pricePerUnit && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Price per Unit:</span>
                          <span className="font-medium">₹{selectedTrade.pricePerUnit.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedTrade.effectivePricePerUnit && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Effective Price:</span>
                          <span className="font-medium">₹{selectedTrade.effectivePricePerUnit.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedTrade.totalINRAmount && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total INR Amount:</span>
                          <span className="font-bold">₹{selectedTrade.totalINRAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium uppercase">{selectedTrade.paymentMethod || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{new Date(selectedTrade.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fees Breakdown */}
                  {(selectedTrade.platformFeeINR || selectedTrade.gasFeeINR || selectedTrade.sellerNetINR) && (
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Banknote className="w-5 h-5" />
                        Fees Breakdown
                      </h3>
                      <div className="space-y-3">
                        {selectedTrade.platformFeeINR && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Platform Fee:</span>
                            <span className="font-medium">₹{selectedTrade.platformFeeINR.toLocaleString()}</span>
                          </div>
                        )}
                        {selectedTrade.gasFeeINR && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Gas Fee:</span>
                            <span className="font-medium">₹{selectedTrade.gasFeeINR.toLocaleString()}</span>
                          </div>
                        )}
                        {selectedTrade.sellerNetINR && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Seller Net INR:</span>
                            <span className="font-bold text-green-600">₹{selectedTrade.sellerNetINR.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Parties Information */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Parties Information</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Buyer
                        </h4>
                        <div className="pl-6 space-y-1">
                          <p className="text-sm"><span className="font-medium">Name:</span> {selectedTrade.buyerId?.name || 'N/A'}</p>
                          <p className="text-sm"><span className="font-medium">ID:</span> {selectedTrade.buyerId?._id}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Seller
                        </h4>
                        <div className="pl-6 space-y-1">
                          <p className="text-sm"><span className="font-medium">Name:</span> {selectedTrade.sellerId?.name || 'N/A'}</p>
                          <p className="text-sm"><span className="font-medium">ID:</span> {selectedTrade.sellerId?._id}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Escrow Information */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Escrow Information</h3>
                    <div className="space-y-3">
                      {selectedTrade.sellerMustDepositUSDT && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Seller Must Deposit:</span>
                          <span className="font-bold">{selectedTrade.sellerMustDepositUSDT} USDT</span>
                        </div>
                      )}
                      {selectedTrade.sellerMustSend && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Seller Must Send:</span>
                          <span className="font-medium">{selectedTrade.sellerMustSend} USDT</span>
                        </div>
                      )}
                      {selectedTrade.buyerWillReceive && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Buyer Will Receive:</span>
                          <span className="font-medium text-green-600">{selectedTrade.buyerWillReceive} USDT</span>
                        </div>
                      )}
                      {selectedTrade.escrowAddress && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-1">Escrow Address:</p>
                          <div className="flex items-center gap-1 bg-gray-50 p-2 rounded">
                            <code className="text-xs font-mono truncate flex-1">{selectedTrade.escrowAddress}</code>
                            <button onClick={() => copyToClipboard(selectedTrade.escrowAddress!)}>
                              <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                            </button>
                          </div>
                        </div>
                      )}
                      {selectedTrade.escrowTransactionHash && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-1">Deposit Transaction Hash:</p>
                          <div className="flex items-center gap-1 bg-gray-50 p-2 rounded">
                            <code className="text-xs font-mono truncate flex-1">{selectedTrade.escrowTransactionHash}</code>
                            <button onClick={() => copyToClipboard(selectedTrade.escrowTransactionHash!)}>
                              <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Seller Bank Details
                      </h3>
                      {selectedTrade.sellerBankDetails && hasBankDetails(selectedTrade.sellerBankDetails) && (
                        <button 
                          onClick={() => setShowBankDetails(!showBankDetails)}
                          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          {showBankDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {showBankDetails ? 'Hide Details' : 'Show Details'}
                        </button>
                      )}
                    </div>
                    
                    {selectedTrade.sellerBankDetails && hasBankDetails(selectedTrade.sellerBankDetails) ? (
                      <div className="space-y-3">
                        {selectedTrade.sellerBankDetails.accountHolderName && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Account Holder:</span>
                            <span className="font-medium">{selectedTrade.sellerBankDetails.accountHolderName}</span>
                          </div>
                        )}
                        {selectedTrade.sellerBankDetails.accountNumber && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Account Number:</span>
                            <span className="font-medium">
                              {showBankDetails 
                                ? selectedTrade.sellerBankDetails.accountNumber
                                : getMaskedAccountNumber(selectedTrade.sellerBankDetails.accountNumber)
                              }
                            </span>
                          </div>
                        )}
                        {selectedTrade.sellerBankDetails.bankName && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bank Name:</span>
                            <span className="font-medium">{selectedTrade.sellerBankDetails.bankName}</span>
                          </div>
                        )}
                        {selectedTrade.sellerBankDetails.ifscCode && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">IFSC Code:</span>
                            <span className="font-medium">{selectedTrade.sellerBankDetails.ifscCode}</span>
                          </div>
                        )}
                        {selectedTrade.sellerBankDetails.branch && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Branch:</span>
                            <span className="font-medium">{selectedTrade.sellerBankDetails.branch}</span>
                          </div>
                        )}
                        {selectedTrade.sellerBankDetails.upiId && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">UPI ID:</span>
                            <span className="font-medium">{selectedTrade.sellerBankDetails.upiId}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                        <p className="text-gray-600">Bank details not submitted by seller</p>
                        <p className="text-sm text-gray-500 mt-1">Seller needs to provide bank details for INR transfer</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {selectedTrade.timeline && selectedTrade.timeline.length > 0 && (
                <div className="mt-6 bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Trade Timeline</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedTrade?.timeline?.map((event: any, index: number) => (
                      <div key={event._id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                          {index < selectedTrade.timeline.length - 1 && (
                            <div className="w-0.5 h-6 bg-gray-300 flex-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-gray-900">{event.event}</p>
                            <p className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</p>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                {!tradeVerifyAction && (
                  <button 
                    onClick={() => {
                      setSelectedTrade(null);
                      setTradeVerifyAction(null);
                      setTradeVerifyRemarks('');
                    }}
                    className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Verify Deposit Modal */}
      {verifyModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Verify Deposit
              </h2>
              <p className="text-gray-600 mt-1">
                Trade #{selectedTx?.tradeId.tradeNumber}
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {selectedTx?.amount} {selectedTx?.cryptoType}
                    </p>
                    <p className="text-sm text-gray-600">
                      From: {selectedTx?.fromAddress?.slice(0, 20)}...
                    </p>
                  </div>
                  {verifyModal.isValid ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-500" />
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setVerifyModal((prev) => ({ ...prev, isValid: true }))
                  }
                  className={`flex-1 py-3 rounded-lg font-semibold border-2 transition-colors ${
                    verifyModal.isValid
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Approve
                  </div>
                </button>
                <button
                  onClick={() =>
                    setVerifyModal((prev) => ({ ...prev, isValid: false }))
                  }
                  className={`flex-1 py-3 rounded-lg font-semibold border-2 transition-colors ${
                    !verifyModal.isValid
                      ? "bg-red-100 text-red-700 border-red-300"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Reject
                  </div>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks (Optional)
                </label>
                <textarea
                  value={verifyModal.remarks}
                  onChange={(e) =>
                    setVerifyModal((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  placeholder="Add remarks for verification..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() =>
                    setVerifyModal({ open: false, isValid: true, remarks: "" })
                  }
                  className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  disabled={isVerifying}
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifySubmit}
                  disabled={isVerifying}
                  className={`flex-1 py-3 rounded-lg font-semibold text-white transition-colors ${
                    verifyModal.isValid
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isVerifying ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing...
                    </div>
                  ) : verifyModal.isValid ? (
                    "Approve Deposit"
                  ) : (
                    "Reject Deposit"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Release Escrow Modal */}
      {releaseModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Release Escrow to Buyer
              </h2>
              <p className="text-gray-600 mt-1">
                Trade #{selectedTx?.tradeId.tradeNumber}
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-purple-900">
                      Release {selectedTx?.amount} {selectedTx?.cryptoType} to
                      Buyer
                    </p>
                    <p className="text-sm text-purple-700 mt-1">
                      This action will transfer the escrowed funds to the
                      buyer's wallet.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Release Transaction Hash{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={releaseModal.hash}
                  onChange={(e) =>
                    setReleaseModal((prev) => ({
                      ...prev,
                      hash: e.target.value,
                    }))
                  }
                  placeholder="Enter the transaction hash from blockchain..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter the transaction hash from your wallet after releasing
                  the funds
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setReleaseModal({ open: false, hash: "" })}
                  className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  disabled={isReleasing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReleaseSubmit}
                  disabled={isReleasing || !releaseModal.hash.trim()}
                  className={`flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors ${
                    !releaseModal.hash.trim() || isReleasing
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {isReleasing ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Releasing...
                    </div>
                  ) : (
                    "Confirm Release"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Confirm Action
                </h3>
                <p className="text-gray-600 mb-6">
                  {confirmAction.type === "approve" &&
                    "Are you sure you want to approve this deposit?"}
                  {confirmAction.type === "reject" &&
                    "Are you sure you want to reject this deposit?"}
                  {confirmAction.type === "release" &&
                    "Are you sure you want to release escrow to buyer?"}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      setConfirmAction({ type: null, show: false })
                    }
                    className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (confirmAction.type === "release") {
                        handleReleaseSubmit();
                      } else {
                        handleVerifySubmit();
                      }
                    }}
                    className={`flex-1 py-3 rounded-lg font-semibold text-white transition-colors ${
                      confirmAction.type === "release"
                        ? "bg-purple-600 hover:bg-purple-700"
                        : confirmAction.type === "reject"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};