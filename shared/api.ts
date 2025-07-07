/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Auth Types
export type UserRole =
  | "student"
  | "vendor"
  | "advertiser"
  | "admin"
  | "storekeeper";

export interface User {
  id: string;
  email?: string;
  phone?: string;
  role: UserRole;
  name: string;
  college?: string;
  course?: string;
  year?: number;
  gender?: string;
  walletBalance?: number;
  rfidId?: string;
  collegeId?: string; // College ID to show to students instead of RFID
  rewardPoints?: number;
  adConsent?: boolean;
  parentContact?: string;
  ageGroup?: string;
  residenceType?: string;
  interests?: string[];
  hostelBlock?: string;
  emergencyContact?: string;
  vendorId?: string; // For storekeepers - which vendor they're assigned to
  createdAt: Date;
}

export interface LoginRequest {
  identifier: string; // email or phone
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Wallet Types
export interface WalletTransaction {
  id: string;
  userId: string;
  type: "recharge" | "payment" | "refund";
  amount: number;
  description: string;
  vendorId?: string;
  timestamp: Date;
  status: "pending" | "completed" | "failed";
}

export interface RechargeRequest {
  amount: number;
  method: "upi" | "card" | "netbanking";
}

// Vendor Types
export interface MenuItem {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  available: boolean;
  discount?: number;
  category: string;
  stockQuantity?: number;
}

export interface VendorOrder {
  id: string;
  vendorId: string;
  studentId: string;
  storekeeperId?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  timestamp: Date;
}

export interface VendorDiscount {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  discountPercentage: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  startDate: Date;
  endDate: Date;
  active: boolean;
  createdAt: Date;
}

export interface PaymentRequest {
  rfidId: string;
  vendorId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
}

// Ad Types
export interface AdCampaign {
  id: string;
  advertiserId: string;
  title?: string;
  description?: string;
  mediaUrl?: string;
  mediaType: "image" | "gif" | "video" | "html";
  placement:
    | "top-banner"
    | "sidebar"
    | "inline-card"
    | "footer-banner"
    | "interstitial"
    | "floating-cta"
    | "dashboard-card";
  size?: "small" | "medium" | "large" | "extra-large";
  targetAudience?: {
    gender?: string;
    course?: string;
    college?: string;
    year?: number;
    ageGroup?: string;
    residenceType?: string;
    interests?: string;
    size?: string;
  };
  startDate: Date;
  endDate: Date;
  budget: number;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "active"
    | "paused"
    | "completed";
  websiteUrl?: string; // Optional URL for Learn More/Order Now buttons
  callToAction?: string; // Text for the CTA button (e.g., "Learn More", "Order Now", "Visit Store")
  createdAt: Date;
}

export interface AdEvent {
  id: string;
  userId: string;
  adId: string;
  type: "impression" | "click" | "view";
  timestamp: Date;
  duration?: number;
}

// Analytics Types
export interface DashboardStats {
  totalUsers: number;
  totalRecharges: number;
  totalVendorSales: number;
  totalAdImpressions: number;
  totalAdClicks: number;
}
