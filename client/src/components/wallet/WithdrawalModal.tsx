import { useState } from 'react';
import { X, AlertTriangle, ChevronRight, Check } from 'lucide-react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
}

export default function WithdrawalModal({ 
  isOpen, 
  onClose, 
  availableBalance
}: WithdrawalModalProps) {
  const [amount, setAmount] = useState('');
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('Ethereum');
  const selectedToken = 'USDT';
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const networks = [
    { id: 'ethereum', name: 'Ethereum', fee: '10', estimatedTime: '3-5 minutes' },
    { id: 'polygon', name: 'Polygon', fee: '0.5', estimatedTime: '1-2 minutes' },
    { id: 'bsc', name: 'BNB Smart Chain', fee: '0.3', estimatedTime: '1-2 minutes' },
    { id: 'arbitrum', name: 'Arbitrum', fee: '2', estimatedTime: '2-3 minutes' },
  ];

  const networkFee = networks.find(n => n.name === selectedNetwork)?.fee || '10';
  const totalAmount = amount ? parseFloat(amount) + parseFloat(networkFee) : 0;

  const handleMaxAmount = () => {
    const max = Math.max(0, availableBalance - parseFloat(networkFee));
    setAmount(max.toFixed(2));
  };

  const handleWithdrawal = async () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep(3);
    }, 2000);
  };

  const handleReset = () => {
    setAmount('');
    setWithdrawalAddress('');
    setStep(1);
  };

  if (!isOpen) return null;

  if (step === 3) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mx-auto mb-6 flex items-center justify-center">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Withdrawal Successful!
            </h3>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Your withdrawal of {amount} {selectedToken} has been initiated.
            </p>
            
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-6">
              <div className="text-sm font-mono text-slate-900 dark:text-slate-100">
                TX: 0x1234...5678
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                You can track this transaction on the blockchain explorer
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="flex-1 py-3 px-4 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
              >
                New Withdrawal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Confirm Withdrawal
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Amount</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {amount} {selectedToken}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">To Address</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    {withdrawalAddress.slice(0, 8)}...{withdrawalAddress.slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-slate-500 dark:text-slate-400">Network</span>
                  <span className="text-slate-900 dark:text-slate-100">{selectedNetwork}</span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
                  Fee Breakdown
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-700 dark:text-amber-400">Network Fee</span>
                    <span className="text-amber-700 dark:text-amber-400">{networkFee} {selectedToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700 dark:text-amber-400">Platform Fee</span>
                    <span className="text-amber-700 dark:text-amber-400">0.00 {selectedToken}</span>
                  </div>
                  <div className="border-t border-amber-200 dark:border-amber-800 pt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-amber-800 dark:text-amber-300">Total Amount</span>
                      <span className="text-amber-800 dark:text-amber-300">{totalAmount.toFixed(2)} {selectedToken}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800 dark:text-red-300">
                    Double-check the withdrawal address
                  </p>
                  <p className="text-red-700 dark:text-red-400 mt-1">
                    Transactions cannot be reversed. Ensure the address is correct before confirming.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleWithdrawal}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm Withdrawal
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Withdraw Funds
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Available: {availableBalance.toFixed(2)} USDT
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Amount to Withdraw
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full p-4 pr-24 text-2xl font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                step="0.01"
                min="0"
                max={availableBalance}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {selectedToken}
                </span>
                <button
                  onClick={handleMaxAmount}
                  className="px-3 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800"
                >
                  MAX
                </button>
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Minimum: 10 {selectedToken}
              </span>
              <span className={`text-xs ${
                parseFloat(amount || '0') > availableBalance 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                Balance: {availableBalance.toFixed(2)} {selectedToken}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Network
            </label>
            <div className="grid grid-cols-2 gap-2">
              {networks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => setSelectedNetwork(network.name)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedNetwork === network.name
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-400'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {network.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Fee: {network.fee} {selectedToken}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      ~{network.estimatedTime}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Withdrawal Address
            </label>
            <input
              type="text"
              value={withdrawalAddress}
              onChange={(e) => setWithdrawalAddress(e.target.value)}
              placeholder="0x..."
              className="w-full p-4 text-sm font-mono text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Enter the wallet address where you want to receive funds
            </p>
          </div>

          {amount && (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">You'll receive</span>
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {amount} {selectedToken}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Network fee</span>
                <span className="text-slate-900 dark:text-slate-100">{networkFee} {selectedToken}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-900 dark:text-slate-100">Total cost</span>
                  <span className="text-slate-900 dark:text-slate-100">{totalAmount.toFixed(2)} {selectedToken}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!amount || !withdrawalAddress || parseFloat(amount) < 10 || parseFloat(amount) > availableBalance}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
