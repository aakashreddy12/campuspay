import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sknfoewscuvalrhsbmvh.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrbmZvZXdzY3V2YWxyaHNibXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTk5NjQsImV4cCI6MjA2NzM3NTk2NH0.9p4S-T8c4PXP9xLOf6wcwuO68J16BMYKQ-UuqofRRu0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database type definitions based on your schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email?: string;
          phone?: string;
          role: "student" | "vendor" | "storekeeper" | "admin" | "advertiser";
          name: string;
          college?: string;
          course?: string;
          year?: number;
          gender?: "male" | "female" | "other";
          wallet_balance?: number;
          rfid_id?: string;
          college_id?: string;
          reward_points?: number;
          ad_consent?: boolean;
          parent_contact?: string;
          created_at: string;
          updated_at: string;
          vendor_id?: string; // For storekeepers
        };
        Insert: {
          id?: string;
          email?: string;
          phone?: string;
          role: "student" | "vendor" | "storekeeper" | "admin" | "advertiser";
          name: string;
          college?: string;
          course?: string;
          year?: number;
          gender?: "male" | "female" | "other";
          wallet_balance?: number;
          rfid_id?: string;
          college_id?: string;
          reward_points?: number;
          ad_consent?: boolean;
          parent_contact?: string;
          vendor_id?: string;
        };
        Update: {
          email?: string;
          phone?: string;
          role?: "student" | "vendor" | "storekeeper" | "admin" | "advertiser";
          name?: string;
          college?: string;
          course?: string;
          year?: number;
          gender?: "male" | "female" | "other";
          wallet_balance?: number;
          rfid_id?: string;
          college_id?: string;
          reward_points?: number;
          ad_consent?: boolean;
          parent_contact?: string;
          vendor_id?: string;
          updated_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          vendor_id: string;
          name: string;
          description?: string;
          price: number;
          category: string;
          available: boolean;
          discount: number;
          stock_quantity: number;
          image_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          name: string;
          description?: string;
          price: number;
          category: string;
          available?: boolean;
          discount?: number;
          stock_quantity: number;
          image_url?: string;
        };
        Update: {
          vendor_id?: string;
          name?: string;
          description?: string;
          price?: number;
          category?: string;
          available?: boolean;
          discount?: number;
          stock_quantity?: number;
          image_url?: string;
          updated_at?: string;
        };
      };
      wallet_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: "recharge" | "payment" | "refund";
          amount: number;
          description: string;
          vendor_id?: string;
          status: "pending" | "completed" | "failed";
          transaction_id?: string;
          payment_method?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "recharge" | "payment" | "refund";
          amount: number;
          description: string;
          vendor_id?: string;
          status?: "pending" | "completed" | "failed";
          transaction_id?: string;
          payment_method?: string;
        };
        Update: {
          status?: "pending" | "completed" | "failed";
          transaction_id?: string;
          payment_method?: string;
        };
      };
      vendor_orders: {
        Row: {
          id: string;
          vendor_id: string;
          student_id: string;
          storekeeper_id?: string;
          total: number;
          status: "pending" | "completed" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          student_id: string;
          storekeeper_id?: string;
          total: number;
          status?: "pending" | "completed" | "cancelled";
        };
        Update: {
          status?: "pending" | "completed" | "cancelled";
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string;
          quantity: number;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id: string;
          quantity: number;
          price: number;
        };
        Update: {
          quantity?: number;
          price?: number;
        };
      };
      ad_campaigns: {
        Row: {
          id: string;
          advertiser_id: string;
          title: string;
          description: string;
          media_url?: string;
          media_type: "image" | "video" | "gif";
          placement:
            | "top-banner"
            | "inline-card"
            | "sidebar"
            | "footer-banner"
            | "floating-cta"
            | "interstitial"
            | "dashboard-card";
          target_audience: Record<string, any>;
          start_date: string;
          end_date: string;
          budget: number;
          status: "pending" | "active" | "paused" | "completed";
          website_url?: string;
          call_to_action?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          advertiser_id: string;
          title: string;
          description: string;
          media_url?: string;
          media_type: "image" | "video" | "gif";
          placement:
            | "top-banner"
            | "inline-card"
            | "sidebar"
            | "footer-banner"
            | "floating-cta"
            | "interstitial"
            | "dashboard-card";
          target_audience?: Record<string, any>;
          start_date: string;
          end_date: string;
          budget: number;
          status?: "pending" | "active" | "paused" | "completed";
          website_url?: string;
          call_to_action?: string;
        };
        Update: {
          title?: string;
          description?: string;
          media_url?: string;
          media_type?: "image" | "video" | "gif";
          placement?:
            | "top-banner"
            | "inline-card"
            | "sidebar"
            | "footer-banner"
            | "floating-cta"
            | "interstitial"
            | "dashboard-card";
          target_audience?: Record<string, any>;
          start_date?: string;
          end_date?: string;
          budget?: number;
          status?: "pending" | "active" | "paused" | "completed";
          website_url?: string;
          call_to_action?: string;
          updated_at?: string;
        };
      };
      ad_events: {
        Row: {
          id: string;
          user_id: string;
          ad_id: string;
          type: "impression" | "click" | "view";
          metadata?: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ad_id: string;
          type: "impression" | "click" | "view";
          metadata?: Record<string, any>;
        };
        Update: {
          metadata?: Record<string, any>;
        };
      };
      vendor_discounts: {
        Row: {
          id: string;
          vendor_id: string;
          title: string;
          description: string;
          discount_percentage: number;
          min_order_value?: number;
          max_discount_amount?: number;
          start_date: string;
          end_date: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          title: string;
          description: string;
          discount_percentage: number;
          min_order_value?: number;
          max_discount_amount?: number;
          start_date: string;
          end_date: string;
          active?: boolean;
        };
        Update: {
          title?: string;
          description?: string;
          discount_percentage?: number;
          min_order_value?: number;
          max_discount_amount?: number;
          start_date?: string;
          end_date?: string;
          active?: boolean;
          updated_at?: string;
        };
      };
    };
  };
}
