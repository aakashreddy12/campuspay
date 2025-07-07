import { useState, useEffect } from "react";
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
import {
  Wallet,
  Plus,
  CreditCard,
  Gift,
  Settings,
  History,
  Shield,
  Star,
  TrendingUp,
  MapPin,
  Clock,
  Newspaper,
  User,
  ArrowRight,
  Eye,
  QrCode,
  X,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AdCampaign, WalletTransaction } from "@shared/api";
import { supabase } from "@/lib/supabase";
import { AdDisplay } from "@/components/AdDisplay";
import { AdService } from "@/lib/adService";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [rewardTier, setRewardTier] = useState("Silver");
  const [nextTierProgress, setNextTierProgress] = useState(65);
  const [activeAds, setActiveAds] = useState<AdCampaign[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    if (user) {
      fetchActiveAds();
      fetchTransactions();
    }
  }, [user]);

  const fetchActiveAds = async () => {
    if (!user) return;

    try {
      const targetedAds = await AdService.fetchTargetedAds(user, "dashboard");
      setActiveAds(targetedAds);
      setNetworkError(false); // Clear any previous network errors
    } catch (error) {
      console.error(
        "Error fetching ads for dashboard:",
        JSON.stringify(error, null, 2),
      );
      console.error("Error details:", error);
      setActiveAds([]); // Ensure we have a fallback

      // Check if it's a network error
      if (error?.message?.includes("Failed to fetch")) {
        setNetworkError(true);
      }
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

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

  useEffect(() => {
    // Calculate reward tier based on points
    if (user?.rewardPoints) {
      if (user.rewardPoints >= 1000) {
        setRewardTier("Gold");
        setNextTierProgress(100);
      } else if (user.rewardPoints >= 500) {
        setRewardTier("Silver");
        setNextTierProgress((user.rewardPoints % 500) / 5);
      } else {
        setRewardTier("Bronze");
        setNextTierProgress((user.rewardPoints % 500) / 5);
      }
    }
  }, [user?.rewardPoints]);

  const toggleTheme = () => {
    const newTheme =
      theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", isDark);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />

      {/* Network Error Banner */}
      {networkError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded relative">
          <strong className="font-bold">Connection Issue: </strong>
          <span className="block sm:inline">
            Having trouble connecting to the server. Some features may not work
            properly. Please check your internet connection and try refreshing
            the page.
          </span>
          <button
            onClick={() => setNetworkError(false)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Banner Ad */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AdDisplay
          ads={activeAds}
          user={user}
          placement="top-banner"
          page="dashboard"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Theme Toggle */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {user.name.split(" ")[0]}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Quick access to all your campus services and information.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="flex items-center space-x-2"
            >
              {theme === "light" && <Sun className="h-4 w-4" />}
              {theme === "dark" && <Moon className="h-4 w-4" />}
              {theme === "system" && <Monitor className="h-4 w-4" />}
              <span className="capitalize">{theme}</span>
            </Button>
          </div>
        </div>

        {/* Main Grid Layout - Mixed Content and Ads */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Quick Navigation Cards */}
          <Link to="/student/wallet" className="group">
            <Card className="h-full hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">My Wallet</h3>
                <p className="text-2xl font-bold text-green-600">
                  ₹{user.walletBalance?.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">Available Balance</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/student/news" className="group">
            <Card className="h-full hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Newspaper className="h-6 w-6 text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Campus News
                </h3>
                <p className="text-lg font-bold text-blue-600">
                  8 new articles
                </p>
                <p className="text-sm text-gray-600 mt-1">Latest Updates</p>
              </CardContent>
            </Card>
          </Link>

          {/* First Ad Slot */}
          <AdDisplay
            ads={activeAds}
            user={user}
            placement="inline-card"
            page="dashboard"
          />

          <Link to="/student/profile" className="group">
            <Card className="h-full hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">My Profile</h3>
                <p className="text-lg font-bold text-purple-600">
                  {user.course}
                </p>
                <p className="text-sm text-gray-600 mt-1">Year {user.year}</p>
              </CardContent>
            </Card>
          </Link>

          {/* Student ID Card */}
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-purple-100 text-sm">Campus Card</p>
                  <p className="font-bold text-lg">{user.name}</p>
                  <p className="text-purple-100 text-sm mt-1">
                    {user.course} • Year {user.year}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-white/80" />
              </div>
              <div className="text-right">
                <p className="font-mono text-sm">
                  {user.collegeId || user.rfidId}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Reward Status */}
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-100 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Star className="h-6 w-6 text-yellow-600 mr-2" />
                <h3 className="font-semibold text-gray-900">
                  {rewardTier} Member
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to Gold</span>
                  <span>{nextTierProgress}%</span>
                </div>
                <Progress value={nextTierProgress} className="h-2" />
                <p className="text-sm text-gray-600">
                  {user.rewardPoints} points earned
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Second Ad Slot */}
          <AdDisplay
            ads={activeAds}
            user={user}
            placement="sidebar"
            page="dashboard"
            size="small"
          />

          {/* Recent Activities - Compact */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <History className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <Link to="/student/wallet">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions.length > 0 ? (
                  transactions.slice(0, 3).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            transaction.type === "recharge"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {transaction.type === "recharge" ? "+" : "-"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {transaction.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`font-bold text-sm ${
                          transaction.amount > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}₹
                        {Math.abs(transaction.amount)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">
                      No recent transactions
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/student/wallet">
                <Button
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  style={{ margin: "6px 0 5px", padding: "9px 16px 8px" }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Funds
                </Button>
              </Link>
              <Link to="/student/wallet">
                <Button
                  variant="outline"
                  className="w-full"
                  style={{ marginBottom: "7px" }}
                >
                  <History className="h-4 w-4 mr-2" />
                  Transaction History
                </Button>
              </Link>
              <Link to="/student/coupons">
                <Button
                  variant="outline"
                  className="w-full"
                  style={{ marginBottom: "6px" }}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  My Coupons
                </Button>
              </Link>
              <Link to="/student/profile">
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Profile Settings
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Third Ad Slot - Different Placement */}
          <div className="md:col-span-2">
            <AdDisplay
              ads={activeAds}
              user={user}
              placement="footer-banner"
              page="dashboard"
              size="large"
            />
          </div>
        </div>

        {/* Floating CTA Ad */}
        <AdDisplay
          ads={activeAds}
          user={user}
          placement="floating-cta"
          page="dashboard"
        />
      </div>
    </div>
  );
}
