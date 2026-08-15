export type UserRole = "BUYER" | "VENDOR" | "DRIVER" | "INVESTOR" | "ADMIN";
export type SupportedLanguage = "FR" | "EN" | "EWE" | "KABYE";

export interface Kyc {
  id: string;
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  documentType: string;
  idNumber: string;
  documentUrl: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: UserRole;
  };
}

export interface EscrowWallet {
  id: string;
  vendorId: string;
  balance: number;
  pendingBalance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  isEmailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  kyc?: Kyc | null;
  escrowWallet?: EscrowWallet | null;
}

export interface PlatformStats {
  BUYER: number;
  VENDOR: number;
  DRIVER: number;
  INVESTOR: number;
  ADMIN: number;
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
}

export interface ProductVariant {
  id?: string;
  color?: string;
  name?: string;
  price?: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  wholesalePrice: number | null;
  wholesaleMinQty: number | null;
  image: string | null;
  images?: string[] | null;
  variants?: ProductVariant[] | string | null;
  category: string;
  stock: number;
  vendorId: string;
  vendor?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  isFlashDeal?: boolean;
  flashPrice?: number | null;
  flashEndTime?: string | null;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  expiryDate?: string | null;
  isActive: boolean;
  vendorId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  buyerId: string;
  status: "PENDING" | "PAID" | "ESCROW_HELD" | "DISPATCHED" | "DELIVERED" | "COMPLETED" | "CANCELLED";
  total: number;
  currency: string;
  paymentMethod: string | null;
  escrowWalletId: string | null;
  product?: Product | null;
  productTitle?: string | null;
  escrowWallet?: {
    id: string;
    vendorId: string;
    balance: number;
    pendingBalance: number;
    currency: string;
    vendor?: {
      name: string;
      email: string;
      phone: string | null;
    };
  } | null;
  buyer?: {
    name: string;
    email: string;
    phone: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Investment {
  id: string;
  investorId: string;
  projectId?: string | null;
  amount: number;
  status: "ACTIVE" | "COMPLETED";
  roi: number;
  createdAt: string;
  updatedAt: string;
}

export type InvestmentProjectStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "SUSPENDED";

export interface InvestmentProjectDocument {
  id?: string;
  name: string;
  url: string;
  type?: string;
  size?: number;
}

export interface InvestmentProject {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  raisedAmount?: number;
  estimatedReturn: number;
  investmentDuration: number;
  investmentDurationUnit: string; // e.g. "MONTHS", "YEARS", "DAYS"
  status: InvestmentProjectStatus;
  coverImage: string | null;
  images?: string[] | null;
  documents?: InvestmentProjectDocument[] | string | null;
  authorId?: string | null;
  createdAt: string;
  updatedAt: string;
}
