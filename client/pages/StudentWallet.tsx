import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Wallet,
  Plus,
  QrCode,
  CreditCard,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Filter,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Smartphone,
  ArrowLeft,
  TrendingUp,
  X,
} from "lucide-react";
import { WalletTransaction, RechargeRequest, AdCampaign } from "@shared/api";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { AdDisplay } from "@/components/AdDisplay";
import { AdService } from "@/lib/adService";

export default function StudentWallet() {
  const { user, setUser } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "upi" | "card" | "netbanking"
  >("upi");
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isProcessingRecharge, setIsProcessingRecharge] = useState(false);
  const [activeAds, setActiveAds] = useState<AdCampaign[]>([]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchActiveAds();
    }
  }, [user]);

  const fetchActiveAds = async () => {
    if (!user) return;

    try {
      const targetedAds = await AdService.fetchTargetedAds(user, "wallet");
      setActiveAds(targetedAds);
    } catch (error) {
      console.error(
        "Error fetching ads for wallet:",
        JSON.stringify(error, null, 2),
      );
      console.error("Error details:", error);
      setActiveAds([]); // Ensure we have a fallback
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "Error fetching transactions:",
          JSON.stringify(error, null, 2),
        );
        console.error("Error details:", error);
        return;
      }

      const formattedTransactions: WalletTransaction[] =
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecharge = async () => {
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0 || !user) return;

    setIsProcessingRecharge(true);
    setQrCodeGenerated(true);

    try {
      const amount = parseFloat(rechargeAmount);

      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create transaction record
      const { data: transactionData, error: transactionError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          type: "recharge",
          amount: amount,
          description: `Wallet Recharge via ${paymentMethod.toUpperCase()}`,
          status: "completed",
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (transactionError) {
        console.error("Error creating transaction:", transactionError);
        throw transactionError;
      }

      // Update user wallet balance
      const newBalance = (user.walletBalance || 0) + amount;
      const { error: updateError } = await supabase
        .from("users")
        .update({ wallet_balance: newBalance })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating wallet balance:", updateError);
        throw updateError;
      }

      // Update local state
      const updatedUser = { ...user, walletBalance: newBalance };
      setUser(updatedUser);
      localStorage.setItem("campuspay_user", JSON.stringify(updatedUser));

      // Refresh transactions
      await fetchTransactions();

      // Reset form
      setRechargeAmount("");
      setRechargeDialogOpen(false);
      setQrCodeGenerated(false);
    } catch (error) {
      console.error("Recharge failed:", error);
      setQrCodeGenerated(false);
    } finally {
      setIsProcessingRecharge(false);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    // Filter by type
    if (filterType !== "all" && transaction.type !== filterType) return false;

    // Filter by period
    if (filterPeriod !== "all") {
      const transactionDate = new Date(transaction.timestamp);
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      switch (filterPeriod) {
        case "week":
          if (daysDiff > 7) return false;
          break;
        case "month":
          if (daysDiff > 30) return false;
          break;
        case "3months":
          if (daysDiff > 90) return false;
          break;
      }
    }

    return true;
  });

  const generateMockQRCode = () => {
    // Mock QR code for demonstration
    const svgContent = `
      <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <g fill="black">
          ${Array.from({ length: 20 }, (_, i) =>
            Array.from({ length: 20 }, (_, j) =>
              Math.random() > 0.5
                ? `<rect x="${i * 10}" y="${j * 10}" width="10" height="10"/>`
                : "",
            ).join(""),
          ).join("")}
        </g>
        <text x="100" y="195" text-anchor="middle" font-size="8" fill="gray">Rs ${rechargeAmount}</text>
      </svg>
    `;

    // Use encodeURIComponent instead of btoa to handle Unicode characters
    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-green-50/30">
      <Navbar />

      {/* Top Banner Ad */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AdDisplay
          ads={activeAds}
          user={user}
          placement="top-banner"
          page="wallet"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center space-x-4 mb-8">
          <Link to="/student">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wallet 💰</h1>
            <p className="text-gray-600">
              Manage your campus payments and view transaction history
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-100 text-sm mb-2">
                      Available Balance
                    </p>
                    <p className="text-4xl font-bold mb-4">
                      ₹{user.walletBalance?.toLocaleString() || "0"}
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-blue-100 text-sm">Active</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-blue-200" />
                        <span className="text-blue-100 text-sm">
                          {user.rfidId}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2">
                      <Wallet className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-blue-100 text-xs">Campus Wallet</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Dialog
                open={rechargeDialogOpen}
                onOpenChange={setRechargeDialogOpen}
              >
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow border-green-200">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Plus className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Add Money
                      </h3>
                      <p className="text-sm text-gray-600">
                        Recharge your wallet
                      </p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Money to Wallet</DialogTitle>
                    <DialogDescription>
                      Choose amount and payment method to recharge your campus
                      wallet
                    </DialogDescription>
                  </DialogHeader>

                  {!qrCodeGenerated ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="Enter amount"
                          value={rechargeAmount}
                          onChange={(e) => setRechargeAmount(e.target.value)}
                          min="1"
                          max="10000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select
                          value={paymentMethod}
                          onValueChange={(value: any) =>
                            setPaymentMethod(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="card">
                              Credit/Debit Card
                            </SelectItem>
                            <SelectItem value="netbanking">
                              Net Banking
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Quick amount buttons */}
                      <div className="space-y-2">
                        <Label>Quick Select</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {[100, 200, 500, 1000].map((amount) => (
                            <Button
                              key={amount}
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setRechargeAmount(amount.toString())
                              }
                              className="h-10"
                            >
                              ₹{amount}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={handleRecharge}
                        className="w-full bg-gradient-to-r from-green-600 to-blue-600"
                        disabled={
                          !rechargeAmount || parseFloat(rechargeAmount) <= 0
                        }
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate Payment QR
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-48 h-48 mx-auto border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                        <img
                          src={generateMockQRCode()}
                          alt="Payment QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          Scan to Pay
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          Scan this QR code with any UPI app to pay ₹
                          {rechargeAmount}
                        </p>
                        <div className="flex items-center justify-center space-x-2">
                          <Smartphone className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-600">
                            Processing payment...
                          </span>
                        </div>
                      </div>
                      <Alert className="border-blue-200 bg-blue-50">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          In a real app, this would integrate with Cashfree
                          payment gateway
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <Card className="cursor-pointer hover:shadow-md transition-shadow border-blue-200">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <QrCode className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Pay with QR
                  </h3>
                  <p className="text-sm text-gray-600">Scan vendor QR code</p>
                </CardContent>
              </Card>
            </div>

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <History className="h-5 w-5" />
                      <span>Transaction History</span>
                    </CardTitle>
                    <CardDescription>
                      Your recent payments and recharges
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="recharge">Recharges</SelectItem>
                        <SelectItem value="payment">Payments</SelectItem>
                        <SelectItem value="refund">Refunds</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filterPeriod}
                      onValueChange={setFilterPeriod}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="week">Last Week</SelectItem>
                        <SelectItem value="month">Last Month</SelectItem>
                        <SelectItem value="3months">Last 3 Months</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-8">
                      <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Transactions Found
                      </h3>
                      <p className="text-gray-600">
                        Try adjusting your filters or make your first
                        transaction
                      </p>
                    </div>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              transaction.type === "recharge"
                                ? "bg-green-100 text-green-600"
                                : transaction.type === "refund"
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-red-100 text-red-600"
                            }`}
                          >
                            {transaction.type === "recharge" ? (
                              <ArrowDownLeft className="h-5 w-5" />
                            ) : transaction.type === "refund" ? (
                              <ArrowUpRight className="h-5 w-5" />
                            ) : (
                              <ArrowUpRight className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {transaction.description}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-sm text-gray-500">
                                {new Date(
                                  transaction.timestamp,
                                ).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(
                                  transaction.timestamp,
                                ).toLocaleTimeString()}
                              </p>
                              <Badge
                                variant={
                                  transaction.status === "completed"
                                    ? "default"
                                    : transaction.status === "pending"
                                      ? "secondary"
                                      : "destructive"
                                }
                                className="text-xs"
                              >
                                {transaction.status === "completed" && (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                {transaction.status === "pending" && (
                                  <Clock className="h-3 w-3 mr-1" />
                                )}
                                {transaction.status === "failed" && (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                {transaction.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${
                              transaction.amount > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.amount > 0 ? "+" : ""}₹
                            {Math.abs(transaction.amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {transaction.type}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Inline Card Ad */}
            <AdDisplay
              ads={activeAds}
              user={user}
              placement="inline-card"
              page="wallet"
              size="medium"
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sidebar Ad */}
            <AdDisplay
              ads={activeAds}
              user={user}
              placement="sidebar"
              page="wallet"
              size="small"
            />

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Spent</span>
                  <span className="font-medium">₹1,250</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Transactions</span>
                  <span className="font-medium">23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Avg per transaction
                  </span>
                  <span className="font-medium">₹54</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Rewards Earned</span>
                  <span className="font-medium text-green-600">125 points</span>
                </div>
              </CardContent>
            </Card>

            {/* Spending Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Food & Dining", amount: 850, percentage: 68 },
                    { name: "Stationary", amount: 280, percentage: 22 },
                    { name: "Coffee", amount: 120, percentage: 10 },
                  ].map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{category.name}</span>
                        <span className="font-medium">₹{category.amount}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center space-x-3"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.type === "recharge"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {transaction.type === "recharge" ? (
                          <Plus className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <p
                        className={`text-sm font-medium ${
                          transaction.amount > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}₹
                        {Math.abs(transaction.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Footer Banner Ad */}
            <AdDisplay
              ads={activeAds}
              user={user}
              placement="footer-banner"
              page="wallet"
              size="large"
            />
          </div>
        </div>

        {/* Floating CTA Ad */}
        <AdDisplay
          ads={activeAds}
          user={user}
          placement="floating-cta"
          page="wallet"
        />
      </div>
    </div>
  );
}
