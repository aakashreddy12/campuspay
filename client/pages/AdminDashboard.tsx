import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  TrendingUp,
  DollarSign,
  Store,
  Eye,
  BarChart3,
  Settings,
  UserCheck,
  AlertTriangle,
  Calendar,
  Activity,
  FileText,
  ShoppingCart,
  Zap,
  PieChart,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  RefreshCw,
  CreditCard,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  User as UserType,
  MenuItem,
  AdCampaign,
  WalletTransaction,
} from "@shared/api";
import { supabase } from "@/lib/supabase";

// Enhanced interfaces for admin dashboard
interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  totalTransactions: number;
  totalRevenue: number;
  monthlyGrowth: number;
  activeStudents: number;
  pendingApprovals: number;
  systemHealth: number;
  totalAdCampaigns: number;
  adRevenue: number;
  avgOrderValue: number;
  dailyActiveUsers: number;
}

interface VendorPerformance {
  id: string;
  name: string;
  revenue: number;
  growth: number;
  orders: number;
  rating: number;
  status: "active" | "inactive" | "pending";
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalVendors: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    activeStudents: 0,
    pendingApprovals: 0,
    systemHealth: 98.5,
    totalAdCampaigns: 0,
    adRevenue: 0,
    avgOrderValue: 0,
    dailyActiveUsers: 0,
  });

  const [vendors, setVendors] = useState<VendorPerformance[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([]);

  // Form states
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    college: "",
    course: "",
    year: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserForm, setEditUserForm] = useState<any>({});
  const [viewingCampaign, setViewingCampaign] = useState<any>(null);

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchAdminData();
    }
  }, [user, selectedPeriod]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // In a real app, these would be separate API calls
      await Promise.all([
        fetchUsers(),
        fetchTransactions(),
        fetchAdCampaigns(),
        fetchSystemMetrics(),
      ]);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
        return;
      }

      const formattedUsers =
        data?.map((user) => ({
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          name: user.name,
          college: user.college,
          course: user.course,
          year: user.year,
          gender: user.gender,
          walletBalance: parseFloat(user.wallet_balance || "0"),
          rfidId: user.rfid_id,
          collegeId: user.college_id,
          rewardPoints: user.reward_points || 0,
          adConsent: user.ad_consent,
          parentContact: user.parent_contact,
          vendorId: user.vendor_id,
          createdAt: new Date(user.created_at),
        })) || [];

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching transactions:", error);
        return;
      }

      const formattedTransactions =
        data?.map((transaction) => ({
          id: transaction.id,
          userId: transaction.user_id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          vendorId: transaction.vendor_id,
          timestamp: new Date(transaction.created_at),
          status: transaction.status,
        })) || [];

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchAdCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching ad campaigns:", error);
        return;
      }

      const formattedCampaigns =
        data?.map((campaign) => ({
          id: campaign.id,
          advertiserId: campaign.advertiser_id,
          title: campaign.title,
          description: campaign.description,
          mediaUrl: campaign.media_url,
          mediaType: campaign.media_type,
          placement: campaign.placement,
          targetAudience: campaign.target_audience,
          startDate: new Date(campaign.start_date),
          endDate: new Date(campaign.end_date),
          budget: campaign.budget,
          status: campaign.status,
          websiteUrl: campaign.website_url,
          callToAction: campaign.call_to_action,
          createdAt: new Date(campaign.created_at),
        })) || [];

      setAdCampaigns(formattedCampaigns);
    } catch (error) {
      console.error("Error fetching ad campaigns:", error);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      // Get fresh counts from database for accuracy
      const { data: allUsers } = await supabase
        .from("users")
        .select("role, created_at");
      const { data: allTransactions } = await supabase
        .from("wallet_transactions")
        .select("type, amount, status, created_at");
      const { data: allCampaigns } = await supabase
        .from("ad_campaigns")
        .select("budget, status, created_at");
      const { data: allOrders } = await supabase
        .from("vendor_orders")
        .select("total, status, created_at");

      // Calculate metrics from fresh database data
      const totalUsers = allUsers?.length || 0;
      const totalVendors =
        allUsers?.filter((u) => u.role === "vendor").length || 0;
      const activeStudents =
        allUsers?.filter((u) => u.role === "student").length || 0;

      const completedTransactions =
        allTransactions?.filter(
          (t) => t.type === "payment" && t.status === "completed",
        ) || [];
      const totalTransactions = completedTransactions.length;
      const totalRevenue = completedTransactions.reduce(
        (sum, t) => sum + Math.abs(t.amount),
        0,
      );

      const activeCampaigns =
        allCampaigns?.filter((c) => c.status === "active") || [];
      const totalAdCampaigns = activeCampaigns.length;
      const adRevenue = activeCampaigns.reduce(
        (sum, campaign) => sum + campaign.budget,
        0,
      );

      const completedOrders =
        allOrders?.filter((o) => o.status === "completed") || [];
      const avgOrderValue =
        completedOrders.length > 0
          ? completedOrders.reduce((sum, o) => sum + o.total, 0) /
            completedOrders.length
          : 0;

      // Calculate monthly growth
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const currentMonthUsers =
        allUsers?.filter((u) => {
          const createdDate = new Date(u.created_at);
          return (
            createdDate.getMonth() === currentMonth &&
            createdDate.getFullYear() === currentYear
          );
        }).length || 0;

      const lastMonthUsers =
        allUsers?.filter((u) => {
          const createdDate = new Date(u.created_at);
          return (
            createdDate.getMonth() === lastMonth &&
            createdDate.getFullYear() === lastMonthYear
          );
        }).length || 0;

      const monthlyGrowth =
        lastMonthUsers > 0
          ? ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
          : 0;

      setStats({
        totalUsers,
        totalVendors,
        totalTransactions,
        totalRevenue,
        monthlyGrowth,
        activeStudents,
        pendingApprovals: 0, // Will be calculated after vendors are fetched
        systemHealth: 98.5,
        totalAdCampaigns,
        adRevenue,
        avgOrderValue,
        dailyActiveUsers: Math.floor(activeStudents * 0.3), // Estimated based on students
      });

      // Calculate vendor performance from fresh data
      const vendorUsers = allUsers?.filter((u) => u.role === "vendor") || [];
      const vendorPerformance = await Promise.all(
        vendorUsers.map(async (vendor) => {
          const { data: vendorOrders } = await supabase
            .from("vendor_orders")
            .select("total, status, created_at")
            .eq("vendor_id", vendor.id)
            .eq("status", "completed");

          const currentMonth = new Date().getMonth();
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

          const currentMonthOrders =
            vendorOrders?.filter((order) => {
              const orderDate = new Date(order.created_at);
              return orderDate.getMonth() === currentMonth;
            }) || [];

          const lastMonthOrders =
            vendorOrders?.filter((order) => {
              const orderDate = new Date(order.created_at);
              return orderDate.getMonth() === lastMonth;
            }) || [];

          const revenue =
            vendorOrders?.reduce((sum, order) => sum + order.total, 0) || 0;
          const orders = vendorOrders?.length || 0;

          const currentMonthRevenue = currentMonthOrders.reduce(
            (sum, order) => sum + order.total,
            0,
          );
          const lastMonthRevenue = lastMonthOrders.reduce(
            (sum, order) => sum + order.total,
            0,
          );
          const growth =
            lastMonthRevenue > 0
              ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) *
                100
              : 0;

          // Get vendor details from users array
          const vendorDetails = users.find((u) => u.id === vendor.id);

          return {
            id: vendor.id,
            name: vendorDetails?.name || "Unknown Vendor",
            revenue,
            growth,
            orders,
            rating: 4.5 + Math.random() * 0.5, // This would come from reviews table in real app
            status: "active" as const,
          };
        }),
      );

      setVendors(vendorPerformance);

      // Update pending approvals count
      setStats((prev) => ({
        ...prev,
        pendingApprovals: vendorPerformance.filter(
          (v) => v.status === "pending",
        ).length,
      }));
    } catch (error) {
      console.error("Error calculating system metrics:", error);
    }
  };

  const handleViewUser = (user: any) => {
    setViewingUser(user);
  };

  const handleViewCampaign = (campaign: any) => {
    setViewingCampaign(campaign);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditUserForm({
      name: user.name,
      email: user.email || "",
      phone: user.phone || "",
      role: user.role,
      college: user.college || "",
      course: user.course || "",
      year: user.year?.toString() || "",
      walletBalance: user.walletBalance || 0,
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updateData: any = {
        name: editUserForm.name,
        email: editUserForm.email || null,
        phone: editUserForm.phone || null,
        role: editUserForm.role,
        college: editUserForm.college || null,
        course: editUserForm.course || null,
        year: editUserForm.year ? parseInt(editUserForm.year) : null,
        wallet_balance: parseFloat(editUserForm.walletBalance) || 0,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", editingUser.id);

      if (error) throw error;

      setFormSuccess("User updated successfully!");
      setEditingUser(null);
      setEditUserForm({});
      await fetchAdminData(); // Refresh data
    } catch (error: any) {
      console.error("Error updating user:", error);
      setFormError(`Error updating user: ${error?.message || "Unknown error"}`);
    }
  };

  const handleUserAction = async (
    userId: string,
    action: "activate" | "deactivate" | "delete",
  ) => {
    try {
      if (action === "delete") {
        // Confirm deletion
        if (
          !confirm(
            "Are you sure you want to delete this user? This action cannot be undone.",
          )
        ) {
          return;
        }

        // Delete user from database
        const { error } = await supabase
          .from("users")
          .delete()
          .eq("id", userId);

        if (error) {
          console.error("Supabase delete error:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw new Error(`Failed to delete user: ${error.message}`);
        }

        // Remove from local state
        setUsers(users.filter((u) => u.id !== userId));
        console.log(`User ${userId} deleted successfully`);

        // Show success message
        alert("User deleted successfully");
      } else {
        // For activate/deactivate, you might want to add an 'active' field to users table
        console.log(
          `${action} feature requires adding 'active' field to users table`,
        );
      }

      // Refresh data
      await fetchAdminData();
    } catch (error: any) {
      console.error(`Error performing ${action} on user ${userId}:`, {
        message: error?.message || "Unknown error",
        stack: error?.stack,
        error: error,
      });
      alert(`Error ${action}ing user: ${error?.message || "Unknown error"}`);
    }
  };

  const handleVendorAction = async (
    vendorId: string,
    action: "approve" | "reject" | "suspend",
  ) => {
    try {
      if (action === "approve") {
        // Update vendor status in database (requires adding status field)
        console.log(
          `Approve vendor feature requires adding 'status' field to users table`,
        );
      } else if (action === "suspend") {
        // Suspend vendor operations
        console.log(
          `Suspend vendor feature requires adding 'status' field to users table`,
        );
      } else if (action === "reject") {
        // Reject vendor application
        console.log(
          `Reject vendor feature requires adding 'status' field to users table`,
        );
      }

      // Refresh data
      await fetchAdminData();
    } catch (error) {
      console.error(`Error performing ${action} on vendor ${vendorId}:`, error);
    }
  };

  const createNewUser = async (userData: {
    name: string;
    email: string;
    phone: string;
    role: string;
    college?: string;
    course?: string;
    year?: number;
  }) => {
    try {
      // Generate RFID for students
      const rfidId = userData.role === "student" ? `RFID-${Date.now()}` : null;
      const collegeId =
        userData.role === "student"
          ? `${userData.college?.substring(0, 2).toUpperCase()}${new Date().getFullYear()}${userData.course?.substring(0, 2).toUpperCase()}${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`
          : null;

      const { data, error } = await supabase
        .from("users")
        .insert({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          college: userData.college,
          course: userData.course,
          year: userData.year,
          wallet_balance: userData.role === "student" ? 100 : 0, // Starting balance for students
          rfid_id: rfidId,
          college_id: collegeId,
          reward_points: userData.role === "student" ? 0 : null,
          ad_consent: userData.role === "student" ? true : null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      console.log("New user created:", data);
      await fetchAdminData(); // Refresh data
      return data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  };

  const handleAdApproval = async (
    campaignId: string,
    action: "approve" | "reject" | "pause",
  ) => {
    try {
      let status;
      switch (action) {
        case "approve":
          status = "active";
          break;
        case "reject":
          status = "rejected";
          break;
        case "pause":
          status = "paused";
          break;
      }

      const { error } = await supabase
        .from("ad_campaigns")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", campaignId);

      if (error) throw error;

      console.log(`Ad campaign ${campaignId} ${action}d successfully`);
      await fetchAdCampaigns(); // Refresh ad campaigns
    } catch (error) {
      console.error(`Error ${action}ing ad campaign:`, error);
    }
  };

  const updateSystemSettings = async (settings: {
    platformCommission?: number;
    minWalletBalance?: number;
    maxAdCampaigns?: number;
  }) => {
    try {
      // In a real app, this would update a system_settings table
      console.log("Updating system settings:", settings);
      // For now, just log the settings
      // In future, create a system_settings table and store these values
    } catch (error) {
      console.error("Error updating system settings:", error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      // Validate required fields
      if (!newUserForm.name || !newUserForm.email || !newUserForm.role) {
        throw new Error("Name, email, and role are required");
      }

      const userData = {
        ...newUserForm,
        year: newUserForm.year ? parseInt(newUserForm.year) : undefined,
      };

      await createNewUser(userData);

      setFormSuccess("User created successfully!");
      setNewUserForm({
        name: "",
        email: "",
        phone: "",
        role: "",
        college: "",
        course: "",
        year: "",
      });

      setTimeout(() => setFormSuccess(null), 3000);
    } catch (error: any) {
      setFormError(error.message || "Failed to create user");
      setTimeout(() => setFormError(null), 5000);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const resetNewUserForm = () => {
    setNewUserForm({
      name: "",
      email: "",
      phone: "",
      role: "",
      college: "",
      course: "",
      year: "",
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const exportReport = () => {
    // Generate and download comprehensive report
    const reportData = {
      period: selectedPeriod,
      stats,
      vendors,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-report-${selectedPeriod}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6">
          <CardContent className="text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-600">
              Access Denied
            </h2>
            <p className="text-gray-600 mt-2">
              This dashboard is only available for administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div key="admin-dashboard" className="min-h-screen bg-gray-50">
      <Navbar />

      <div
        key="main-container"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div key="header-content">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Comprehensive platform management and analytics
            </p>
          </div>
          <div key="header-actions" className="flex space-x-3">
            <Button
              key="export"
              variant="outline"
              size="sm"
              onClick={exportReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button
              key="refresh"
              variant="outline"
              size="sm"
              onClick={fetchAdminData}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Dialog key="settings">
              <DialogTrigger asChild>
                <Button size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>System Settings</DialogTitle>
                  <DialogDescription>
                    Configure platform-wide settings and preferences
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div key="commission" className="space-y-2">
                    <Label>Platform Commission (%)</Label>
                    <Input type="number" defaultValue="2.5" />
                  </div>
                  <div key="min-balance" className="space-y-2">
                    <Label>Minimum Wallet Balance</Label>
                    <Input type="number" defaultValue="10" />
                  </div>
                  <div key="max-campaigns" className="space-y-2">
                    <Label>Max Ad Campaigns per Advertiser</Label>
                    <Input type="number" defaultValue="5" />
                  </div>
                  <Button key="save" className="w-full">
                    Save Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card key="total-users">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalUsers.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-1">
                    <ArrowUp className="h-4 w-4 text-green-500" />
                    <p className="text-sm text-green-600 ml-1">
                      +{stats.monthlyGrowth?.toFixed(1) || 0}%
                    </p>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card key="platform-revenue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Platform Revenue
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    ₹{(stats.totalRevenue / 1000).toFixed(0)}K
                  </p>
                  <p className="text-sm text-gray-500 mt-1">This month</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card key="ad-revenue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Ad Revenue
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    ₹{(stats.adRevenue / 1000).toFixed(0)}K
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.totalAdCampaigns} campaigns
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card key="system-health">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    System Health
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.systemHealth}%
                  </p>
                  <p className="text-sm text-green-600 mt-1">Excellent</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs
          key="admin-tabs"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger key="overview-trigger" value="overview">
              Overview
            </TabsTrigger>
            <TabsTrigger key="users-trigger" value="users">
              Users
            </TabsTrigger>
            <TabsTrigger key="vendors-trigger" value="vendors">
              Vendors
            </TabsTrigger>
            <TabsTrigger key="transactions-trigger" value="transactions">
              Transactions
            </TabsTrigger>
            <TabsTrigger key="ads-trigger" value="ads">
              Advertisements
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent
            key="overview-tab"
            value="overview"
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div key="main-content" className="lg:col-span-2 space-y-6">
                {/* Revenue Chart */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp key="icon" className="h-5 w-5" />
                        <span key="text">Revenue Analytics</span>
                      </CardTitle>
                      <Select
                        value={selectedPeriod}
                        onValueChange={setSelectedPeriod}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem key="7d" value="7d">
                            Last 7 days
                          </SelectItem>
                          <SelectItem key="30d" value="30d">
                            Last 30 days
                          </SelectItem>
                          <SelectItem key="90d" value="90d">
                            Last 90 days
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">
                          Revenue chart visualization
                        </p>
                        <p className="text-sm text-gray-400">
                          Integration with charting library
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div key="sidebar" className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={resetNewUserForm}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add User
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New User</DialogTitle>
                          <DialogDescription>
                            Create a new user account for the platform
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                          {formError && (
                            <div
                              key="form-error"
                              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
                            >
                              {formError}
                            </div>
                          )}
                          {formSuccess && (
                            <div
                              key="form-success"
                              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded"
                            >
                              {formSuccess}
                            </div>
                          )}

                          <div key="name-field" className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                              id="name"
                              placeholder="Enter user name"
                              value={newUserForm.name}
                              onChange={(e) =>
                                setNewUserForm((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              required
                            />
                          </div>

                          <div key="email-field" className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="Enter email"
                              value={newUserForm.email}
                              onChange={(e) =>
                                setNewUserForm((prev) => ({
                                  ...prev,
                                  email: e.target.value,
                                }))
                              }
                              required
                            />
                          </div>

                          <div key="phone-field" className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              placeholder="Enter phone number"
                              value={newUserForm.phone}
                              onChange={(e) =>
                                setNewUserForm((prev) => ({
                                  ...prev,
                                  phone: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div key="role-field" className="space-y-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select
                              value={newUserForm.role}
                              onValueChange={(value) =>
                                setNewUserForm((prev) => ({
                                  ...prev,
                                  role: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem key="student" value="student">
                                  Student
                                </SelectItem>
                                <SelectItem key="vendor" value="vendor">
                                  Vendor
                                </SelectItem>
                                <SelectItem
                                  key="storekeeper"
                                  value="storekeeper"
                                >
                                  Storekeeper
                                </SelectItem>
                                <SelectItem key="advertiser" value="advertiser">
                                  Advertiser
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {(newUserForm.role === "student" ||
                            newUserForm.role === "storekeeper") && (
                            <div key="college-student-fields">
                              <div key="college-field" className="space-y-2">
                                <Label htmlFor="college">College</Label>
                                <Input
                                  id="college"
                                  placeholder="Enter college name"
                                  value={newUserForm.college}
                                  onChange={(e) =>
                                    setNewUserForm((prev) => ({
                                      ...prev,
                                      college: e.target.value,
                                    }))
                                  }
                                />
                              </div>

                              {newUserForm.role === "student" && (
                                <div key="student-fields">
                                  <div key="course-field" className="space-y-2">
                                    <Label htmlFor="course">Course</Label>
                                    <Input
                                      id="course"
                                      placeholder="Enter course name"
                                      value={newUserForm.course}
                                      onChange={(e) =>
                                        setNewUserForm((prev) => ({
                                          ...prev,
                                          course: e.target.value,
                                        }))
                                      }
                                    />
                                  </div>

                                  <div key="year-field" className="space-y-2">
                                    <Label htmlFor="year">Year</Label>
                                    <Select
                                      value={newUserForm.year}
                                      onValueChange={(value) =>
                                        setNewUserForm((prev) => ({
                                          ...prev,
                                          year: value,
                                        }))
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select year" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem key="year-1" value="1">
                                          1st Year
                                        </SelectItem>
                                        <SelectItem key="year-2" value="2">
                                          2nd Year
                                        </SelectItem>
                                        <SelectItem key="year-3" value="3">
                                          3rd Year
                                        </SelectItem>
                                        <SelectItem key="year-4" value="4">
                                          4th Year
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <Button
                            type="submit"
                            className="w-full"
                            disabled={isCreatingUser}
                          >
                            {isCreatingUser ? (
                              <div key="creating" className="flex items-center">
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                              </div>
                            ) : (
                              <div key="create" className="flex items-center">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create User
                              </div>
                            )}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Button
                      key="manage-vendors"
                      className="w-full"
                      variant="outline"
                      onClick={() => setActiveTab("vendors")}
                    >
                      <Store className="h-4 w-4 mr-2" />
                      Manage Vendors
                    </Button>
                    <Button
                      key="ad-campaigns"
                      className="w-full"
                      variant="outline"
                      onClick={() => setActiveTab("ads")}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Ad Campaigns
                    </Button>
                    <Button
                      key="generate-reports"
                      className="w-full"
                      variant="outline"
                      onClick={exportReport}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Reports
                    </Button>
                  </CardContent>
                </Card>

                {/* System Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity key="icon" className="h-5 w-5" />
                      <span key="text">System Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div
                        key="api-status"
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-600">
                          API Response
                        </span>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm text-green-600">99.9%</span>
                        </div>
                      </div>
                      <div
                        key="database-status"
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-600">Database</span>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm text-green-600">
                            Optimal
                          </span>
                        </div>
                      </div>
                      <div
                        key="payment-status"
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-600">
                          Payment Gateway
                        </span>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                          <span className="text-sm text-yellow-600">98.1%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Users */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users key="icon" className="h-5 w-5" />
                      <span key="text">Recent Users</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {users.slice(0, 5).map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {user.email}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                user.role === "student"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {user.role}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {user.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent key="users-tab" value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management ({users.length} users)</CardTitle>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search users..."
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="all-roles" value="all">
                          All Roles
                        </SelectItem>
                        <SelectItem key="students" value="student">
                          Students
                        </SelectItem>
                        <SelectItem key="vendors" value="vendor">
                          Vendors
                        </SelectItem>
                        <SelectItem key="storekeepers" value="storekeeper">
                          Storekeepers
                        </SelectItem>
                        <SelectItem key="advertisers" value="advertiser">
                          Advertisers
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {users.length > 0 ? (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th
                            key="user-header"
                            className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                          >
                            User
                          </th>
                          <th
                            key="role-header"
                            className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                          >
                            Role
                          </th>
                          <th
                            key="college-header"
                            className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                          >
                            College/Course
                          </th>
                          <th
                            key="balance-header"
                            className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                          >
                            Wallet Balance
                          </th>
                          <th
                            key="created-header"
                            className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                          >
                            Created
                          </th>
                          <th
                            key="actions-header"
                            className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {user.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {user.email}
                                </p>
                                {user.phone && (
                                  <p className="text-sm text-gray-500">
                                    {user.phone}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  user.role === "student"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {user.role}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm">
                                {user.college && (
                                  <p className="text-gray-900">
                                    {user.college}
                                  </p>
                                )}
                                {user.course && (
                                  <p className="text-gray-600">
                                    {user.course}{" "}
                                    {user.year && `(Year ${user.year})`}
                                  </p>
                                )}
                                {user.collegeId && (
                                  <p className="text-gray-500 font-mono">
                                    {user.collegeId}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {user.walletBalance !== undefined ? (
                                <span className="font-medium">
                                  ₹{user.walletBalance.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {user.createdAt.toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex space-x-2">
                                <Button
                                  key="view"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewUser(user)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  key="edit"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  key="delete"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleUserAction(user.id, "delete")
                                  }
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Users Found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start by adding your first user to the platform
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent key="vendors-tab" value="vendors">
            <Card>
              <CardHeader>
                <CardTitle>
                  Vendor Management ({vendors.length} vendors)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vendors.length > 0 ? (
                  <div className="space-y-4">
                    {vendors.map((vendor) => (
                      <div key={vendor.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">
                              {vendor.name}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div key="revenue">
                                <span className="text-gray-500">Revenue:</span>
                                <p className="font-medium">
                                  ₹{vendor.revenue.toLocaleString()}
                                </p>
                              </div>
                              <div key="orders">
                                <span className="text-gray-500">Orders:</span>
                                <p className="font-medium">{vendor.orders}</p>
                              </div>
                              <div key="growth">
                                <span className="text-gray-500">Growth:</span>
                                <p
                                  className={`font-medium ${vendor.growth >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {vendor.growth >= 0 ? "+" : ""}
                                  {vendor.growth.toFixed(1)}%
                                </p>
                              </div>
                              <div key="rating">
                                <span className="text-gray-500">Rating:</span>
                                <p className="font-medium">
                                  {vendor.rating.toFixed(1)} ⭐
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button
                              key="view"
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingUser(vendor)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              key="manage"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(vendor)}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Vendors
                    </h3>
                    <p className="text-gray-600">
                      Vendor applications will appear here for review
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent key="transactions-tab" value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>
                  Transaction Management ({transactions.length} transactions)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th
                            key="txn-id-header"
                            className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                          >
                            Transaction ID
                          </th>
                          <th
                            key="txn-user-header"
                            className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                          >
                            User
                          </th>
                          <th
                            key="txn-type-header"
                            className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                          >
                            Type
                          </th>
                          <th
                            key="txn-amount-header"
                            className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                          >
                            Amount
                          </th>
                          <th
                            key="txn-status-header"
                            className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                          >
                            Status
                          </th>
                          <th
                            key="txn-date-header"
                            className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                          >
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice(0, 20).map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 font-mono text-sm">
                              {transaction.id.substring(0, 8)}...
                            </td>
                            <td className="px-4 py-3">
                              {users.find((u) => u.id === transaction.userId)
                                ?.name || "Unknown User"}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  transaction.type === "payment"
                                    ? "destructive"
                                    : transaction.type === "recharge"
                                      ? "default"
                                      : "secondary"
                                }
                              >
                                {transaction.type}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 font-medium">
                              <span
                                className={
                                  transaction.amount < 0
                                    ? "text-red-600"
                                    : "text-green-600"
                                }
                              >
                                {transaction.amount < 0 ? "-" : "+"}₹
                                {Math.abs(transaction.amount).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  transaction.status === "completed"
                                    ? "default"
                                    : transaction.status === "pending"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {transaction.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {transaction.timestamp.toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Transactions
                    </h3>
                    <p className="text-gray-600">
                      Transaction data will appear here once users start making
                      payments
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent key="ads-tab" value="ads">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Advertisement Management ({adCampaigns.length} campaigns)
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="all-status" value="all">
                          All Status
                        </SelectItem>
                        <SelectItem key="pending-status" value="pending">
                          Pending Approval
                        </SelectItem>
                        <SelectItem key="active-status" value="active">
                          Active
                        </SelectItem>
                        <SelectItem key="rejected-status" value="rejected">
                          Rejected
                        </SelectItem>
                        <SelectItem key="completed-status" value="completed">
                          Completed
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {adCampaigns.length > 0 ? (
                  <div className="space-y-4">
                    {adCampaigns.map((campaign) => (
                      <div key={campaign.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {campaign.title}
                              </h3>
                              <Badge
                                variant={
                                  campaign.status === "active"
                                    ? "default"
                                    : campaign.status === "pending"
                                      ? "secondary"
                                      : campaign.status === "rejected"
                                        ? "destructive"
                                        : "outline"
                                }
                              >
                                {campaign.status}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-3">
                              {campaign.description}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div key="budget">
                                <span className="text-gray-500">Budget:</span>
                                <p className="font-medium">
                                  ₹{campaign.budget.toLocaleString()}
                                </p>
                              </div>
                              <div key="placement">
                                <span className="text-gray-500">
                                  Placement:
                                </span>
                                <p className="font-medium">
                                  {campaign.placement}
                                </p>
                              </div>
                              <div key="start-date">
                                <span className="text-gray-500">
                                  Start Date:
                                </span>
                                <p className="font-medium">
                                  {campaign.startDate.toLocaleDateString()}
                                </p>
                              </div>
                              <div key="end-date">
                                <span className="text-gray-500">End Date:</span>
                                <p className="font-medium">
                                  {campaign.endDate.toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2 ml-4">
                            {campaign.status === "pending" && (
                              <div key="pending-actions">
                                <Button
                                  key="approve"
                                  size="sm"
                                  onClick={() =>
                                    handleAdApproval(campaign.id, "approve")
                                  }
                                  className="bg-green-600 hover:bg-green-700 mb-2"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  key="reject"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleAdApproval(campaign.id, "reject")
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                            {campaign.status === "active" && (
                              <Button
                                key="pause"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleAdApproval(campaign.id, "pause")
                                }
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                Pause
                              </Button>
                            )}
                            <Button
                              key="view"
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCampaign(campaign)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Ad Campaigns
                    </h3>
                    <p className="text-gray-600">
                      Ad campaigns created by advertisers will appear here for
                      review
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View User Dialog */}
        <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                View complete user information
              </DialogDescription>
            </DialogHeader>
            {viewingUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Name
                    </Label>
                    <p className="text-sm">{viewingUser.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Role
                    </Label>
                    <Badge variant="secondary">{viewingUser.role}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Email
                    </Label>
                    <p className="text-sm">{viewingUser.email || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Phone
                    </Label>
                    <p className="text-sm">{viewingUser.phone || "N/A"}</p>
                  </div>
                </div>
                {(viewingUser.college || viewingUser.course) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        College
                      </Label>
                      <p className="text-sm">{viewingUser.college || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Course
                      </Label>
                      <p className="text-sm">{viewingUser.course || "N/A"}</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Wallet Balance
                    </Label>
                    <p className="text-sm">
                      ₹{viewingUser.walletBalance?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Created
                    </Label>
                    <p className="text-sm">
                      {viewingUser.createdAt?.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {viewingUser.collegeId && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      College ID
                    </Label>
                    <p className="text-sm font-mono">{viewingUser.collegeId}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information</DialogDescription>
            </DialogHeader>
            {editingUser && (
              <form onSubmit={handleUpdateUser} className="space-y-4">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    {formSuccess}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name *</Label>
                    <Input
                      id="edit-name"
                      value={editUserForm.name || ""}
                      onChange={(e) =>
                        setEditUserForm({
                          ...editUserForm,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Role *</Label>
                    <Select
                      value={editUserForm.role}
                      onValueChange={(value) =>
                        setEditUserForm({ ...editUserForm, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                        <SelectItem value="advertiser">Advertiser</SelectItem>
                        <SelectItem value="storekeeper">Storekeeper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editUserForm.email || ""}
                      onChange={(e) =>
                        setEditUserForm({
                          ...editUserForm,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      value={editUserForm.phone || ""}
                      onChange={(e) =>
                        setEditUserForm({
                          ...editUserForm,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-college">College</Label>
                    <Input
                      id="edit-college"
                      value={editUserForm.college || ""}
                      onChange={(e) =>
                        setEditUserForm({
                          ...editUserForm,
                          college: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-course">Course</Label>
                    <Input
                      id="edit-course"
                      value={editUserForm.course || ""}
                      onChange={(e) =>
                        setEditUserForm({
                          ...editUserForm,
                          course: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-wallet">Wallet Balance (₹)</Label>
                  <Input
                    id="edit-wallet"
                    type="number"
                    step="0.01"
                    value={editUserForm.walletBalance || 0}
                    onChange={(e) =>
                      setEditUserForm({
                        ...editUserForm,
                        walletBalance: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Update User</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* View Campaign Dialog */}
        <Dialog
          open={!!viewingCampaign}
          onOpenChange={() => setViewingCampaign(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Campaign Details</DialogTitle>
              <DialogDescription>
                View complete campaign information
              </DialogDescription>
            </DialogHeader>
            {viewingCampaign && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Campaign Title
                    </Label>
                    <p className="text-lg font-semibold">
                      {viewingCampaign.title}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Status
                    </Label>
                    <Badge
                      variant={
                        viewingCampaign.status === "active"
                          ? "default"
                          : viewingCampaign.status === "pending"
                            ? "secondary"
                            : viewingCampaign.status === "rejected"
                              ? "destructive"
                              : "outline"
                      }
                    >
                      {viewingCampaign.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Description
                  </Label>
                  <p className="text-sm mt-1">{viewingCampaign.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Budget
                    </Label>
                    <p className="text-lg font-semibold">
                      ₹{viewingCampaign.budget.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Placement
                    </Label>
                    <Badge variant="outline">
                      {viewingCampaign.placement
                        .replace("-", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Start Date
                    </Label>
                    <p className="text-sm">
                      {viewingCampaign.startDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      End Date
                    </Label>
                    <p className="text-sm">
                      {viewingCampaign.endDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {viewingCampaign.websiteUrl && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Website URL
                    </Label>
                    <p className="text-sm text-blue-600 break-all">
                      {viewingCampaign.websiteUrl}
                    </p>
                  </div>
                )}

                {viewingCampaign.callToAction && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Call to Action
                    </Label>
                    <p className="text-sm">{viewingCampaign.callToAction}</p>
                  </div>
                )}

                {viewingCampaign.targetAudience &&
                  Object.keys(viewingCampaign.targetAudience).length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Target Audience
                      </Label>
                      <div className="mt-2 space-y-1">
                        {Object.entries(viewingCampaign.targetAudience).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-600 capitalize">
                                {key.replace(/([A-Z])/g, " $1")}:
                              </span>
                              <span>{String(value)}</span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Created
                  </Label>
                  <p className="text-sm">
                    {viewingCampaign.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
