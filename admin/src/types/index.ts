// src/types/index.ts
export type UserRole = 'Super_Admin' | 'Admin' | 'Support_Manager' | 'Support';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  accountStatus: string;
  kycStatus: string;
  isInstantSeller: boolean;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  actorId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  actorRole: string;
  targetModel: string;
  targetId: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuthResponse {
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  message: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeTrades: number;
  pendingKYCs: number;
  openDisputes: number;
  totalEscrowLocked: number;
  completedTrades: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface KYCSubmission {
  userId: string;
  userName: string;
  email: string;
  status: string;
  submittedAt: string;
  documents: {
    aadhaar: string;
    pan: string;
    selfie: string;
  };
}

export interface PlatformOverview {
  users: { total: number; active: number };
  trades: { total: number; completed: number; completionRate: string | number };
  listings: { total: number; active: number };
  kyc: { total: number; pending: number; approved: number; rejected: number };
  escrow: { totalLocked: number; count: number };
}

export interface AdminNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  status: 'read' | 'unread';
  data?: any;
  createdAt: string;
}