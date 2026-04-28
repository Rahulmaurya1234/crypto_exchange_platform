// Chat and Trade message types
export type MessageType =
  | 'text'
  | 'buyer-request'
  | 'seller-approval'
  | 'crypto-transfer'
  | 'payment-request'
  | 'payment-confirmation'
  | 'crypto-release'
  | 'appeal'
  | 'system';

export type TradeStatus =
  | 'initiated'
  | 'buyer-requested'
  | 'seller-approved'
  | 'crypto-in-escrow'
  | 'payment-pending'
  | 'payment-submitted'
  | 'payment_proof_uploaded'
  | 'payment-confirmed'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'appealed';

export interface ChatMessage {
  id: string;
  tradeId: string;
  senderId: string;
  senderRole: 'buyer' | 'seller';
  type: MessageType;
  text?: string;
  // Socket or API may send either timestamp or createdAt + text or content
  timestamp?: Date | string;
  createdAt?: Date | string;
  content?: string;
  data?: any; // For structured data (forms, etc.)
  // Allow extra properties from backend without type errors
  [key: string]: any;
}

export interface BuyerRequest {
  agreeToShareDocuments: any;
  usdtAmount: number;
  inrAmount: number;
  rate: number;
  paymentMode: string[];
  kycDoc?: string;
  buyerWalletAddress?: string;
  networkName: string;
  cryptoType: string;
  listingId?: string;
  feeDetails: {
    currentRate: number;
    cryptiansFee: number;
    gasFee: number;
    total: number;
  };
  metadata?: {
    escrowStartDate?: string;
    escrowEndDate?: string;
    buyerName?: string;
    sellerName?: string;
    buyerWillReceive?: number;
    sellerMustDeposit?: number;
    documents?: {
      vtr?: boolean;
      ncnda?: boolean;
      imfpa?: boolean;
      tsaip?: boolean;
    };
    agreeToShareDocuments?: boolean;
  };
}

export interface SellerApproval {
  approved: boolean;
  usdtToEscrow: number;
  walletAddress?: string;
  txnHash?: string;
  feeDetails: {
    usdtAmount: number;
    cryptiansFee: number;
    totalFee: number;
  };
}

// types/chat.types.ts

export interface PaymentDetails {
  // core trade info
  usdtAmount: number;
  inrAmount: number;
  rate: number;

  // buyer-entered proof info
  utrNumber: string;
  screenshot: string; // local blob or remote URL

  // stored inside trade.buyerPaymentProof
  amountPaid?: number;
  remarks?: string;

  // /upload-payment backend payload
  transactionId?: string;
  amount?: number;
  bank?: string;
  proofUrl?: string;

  // seller destination (optional)
  upiId?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  accountHolder?: string;
}


export interface PaymentConfirmation {
  confirmed: boolean;
  utrNumber: string;
  remark?: string;
}

export interface TradeData {
  id: string;
  buyerId: string;
  sellerId: string;
  cryptoType: string;
  amount: number;
  rate: number;
  status: TradeStatus;
  createdAt: Date;
  expiryTime?: Date;
}
