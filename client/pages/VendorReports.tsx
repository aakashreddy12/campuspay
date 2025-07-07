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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  ArrowLeft,
  Filter,
  Eye,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  Clock,
  Star,
  Percent,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface ReportData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  dailySales: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
  monthlyComparison: {
    currentMonth: number;
    previousMonth: number;
    growth: number;
  };
}

export default function VendorReports() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topSellingItems: [],
    dailySales: [],
    categoryBreakdown: [],
    monthlyComparison: {
      currentMonth: 0,
      previousMonth: 0,
      growth: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30days");
  const [reportType, setReportType] = useState("sales");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (user && user.role === "vendor") {
      fetchReportData();
    }
  }, [user, dateRange]);

  const fetchReportData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Calculate date range
      const endDateTime = new Date();
      const startDateTime = new Date();

      switch (dateRange) {
        case "7days":
          startDateTime.setDate(endDateTime.getDate() - 7);
          break;
        case "30days":
          startDateTime.setDate(endDateTime.getDate() - 30);
          break;
        case "90days":
          startDateTime.setDate(endDateTime.getDate() - 90);
          break;
        case "365days":
          startDateTime.setFullYear(endDateTime.getFullYear() - 1);
          break;
        case "custom":
          if (startDate && endDate) {
            startDateTime.setTime(new Date(startDate).getTime());
            endDateTime.setTime(new Date(endDate).getTime());
          }
          break;
      }

      // Fetch orders within date range
      const { data: ordersData, error: ordersError } = await supabase
        .from("vendor_orders")
        .select(
          `
          *,
          order_items(
            *,
            menu_items(name, category)
          )
        `,
        )
        .eq("vendor_id", user.id)
        .eq("status", "completed")
        .gte("created_at", startDateTime.toISOString())
        .lte("created_at", endDateTime.toISOString())
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
        return;
      }

      // Process the data
      const orders = ordersData || [];
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = orders.length;
      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate top selling items
      const itemSales: {
        [key: string]: { quantity: number; revenue: number; name: string };
      } = {};
      orders.forEach((order) => {
        order.order_items.forEach((item: any) => {
          const itemName = item.menu_items?.name || `Item ${item.menu_item_id}`;
          if (!itemSales[item.menu_item_id]) {
            itemSales[item.menu_item_id] = {
              quantity: 0,
              revenue: 0,
              name: itemName,
            };
          }
          itemSales[item.menu_item_id].quantity += item.quantity;
          itemSales[item.menu_item_id].revenue += item.price * item.quantity;
        });
      });

      const topSellingItems = Object.values(itemSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Calculate daily sales
      const salesByDate: {
        [key: string]: { revenue: number; orders: number };
      } = {};
      orders.forEach((order) => {
        const date = new Date(order.created_at).toISOString().split("T")[0];
        if (!salesByDate[date]) {
          salesByDate[date] = { revenue: 0, orders: 0 };
        }
        salesByDate[date].revenue += order.total;
        salesByDate[date].orders += 1;
      });

      const dailySales = Object.entries(salesByDate)
        .map(([date, data]) => ({ date, ...data }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      // Calculate category breakdown
      const categoryRevenue: { [key: string]: number } = {};
      orders.forEach((order) => {
        order.order_items.forEach((item: any) => {
          const category = item.menu_items?.category || "Other";
          if (!categoryRevenue[category]) {
            categoryRevenue[category] = 0;
          }
          categoryRevenue[category] += item.price * item.quantity;
        });
      });

      const categoryBreakdown = Object.entries(categoryRevenue)
        .map(([category, revenue]) => ({
          category,
          revenue,
          percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Calculate monthly comparison (current month vs previous month)
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const { data: currentMonthOrders } = await supabase
        .from("vendor_orders")
        .select("total")
        .eq("vendor_id", user.id)
        .eq("status", "completed")
        .gte("created_at", currentMonthStart.toISOString());

      const { data: previousMonthOrders } = await supabase
        .from("vendor_orders")
        .select("total")
        .eq("vendor_id", user.id)
        .eq("status", "completed")
        .gte("created_at", previousMonthStart.toISOString())
        .lte("created_at", previousMonthEnd.toISOString());

      const currentMonth =
        currentMonthOrders?.reduce((sum, order) => sum + order.total, 0) || 0;
      const previousMonth =
        previousMonthOrders?.reduce((sum, order) => sum + order.total, 0) || 0;
      const growth =
        previousMonth > 0
          ? ((currentMonth - previousMonth) / previousMonth) * 100
          : 0;

      setReportData({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        topSellingItems,
        dailySales,
        categoryBreakdown,
        monthlyComparison: {
          currentMonth,
          previousMonth,
          growth,
        },
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In a real app, this would generate and download a PDF/Excel file
    const reportContent = `
Vendor Sales Report - ${user?.name}
Period: ${dateRange === "custom" ? `${startDate} to ${endDate}` : dateRange}
Generated: ${new Date().toLocaleString()}

SUMMARY
-------
Total Revenue: ₹${reportData.totalRevenue.toLocaleString()}
Total Orders: ${reportData.totalOrders}
Average Order Value: ₹${reportData.averageOrderValue.toFixed(2)}
Monthly Growth: ${reportData.monthlyComparison.growth.toFixed(1)}%

TOP SELLING ITEMS
----------------
${reportData.topSellingItems
  .map(
    (item, i) =>
      `${i + 1}. ${item.name} - ${item.quantity} units - ₹${item.revenue.toLocaleString()}`,
  )
  .join("\n")}

CATEGORY BREAKDOWN
-----------------
${reportData.categoryBreakdown
  .map(
    (cat) =>
      `${cat.category}: ₹${cat.revenue.toLocaleString()} (${cat.percentage.toFixed(1)}%)`,
  )
  .join("\n")}
    `;

    // Create and download the report
    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendor-report-${dateRange}-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsGenerating(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  if (!user || user.role !== "vendor") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6">
          <CardContent className="text-center">
            <h2 className="text-xl font-semibold text-red-600">
              Access Denied
            </h2>
            <p className="text-gray-600 mt-2">
              This page is only available for vendors.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link to="/vendor">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Sales Reports & Analytics 📊
              </h1>
              <p className="text-gray-600">
                Detailed insights into your business performance
              </p>
            </div>
            <Button onClick={generateReport} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Report Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                    <SelectItem value="365days">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === "custom" && (
                <>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales Report</SelectItem>
                    <SelectItem value="items">Item Performance</SelectItem>
                    <SelectItem value="trends">Trend Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Revenue
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(reportData.totalRevenue)}
                      </p>
                      <div className="flex items-center mt-1">
                        <TrendingUp
                          className={`h-4 w-4 ${reportData.monthlyComparison.growth >= 0 ? "text-green-500" : "text-red-500"}`}
                        />
                        <p
                          className={`text-sm ${reportData.monthlyComparison.growth >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {reportData.monthlyComparison.growth >= 0 ? "+" : ""}
                          {reportData.monthlyComparison.growth.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Orders
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {reportData.totalOrders}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Orders completed
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Avg Order Value
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(reportData.averageOrderValue)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Per transaction
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Top Category
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.categoryBreakdown[0]?.category || "N/A"}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {reportData.categoryBreakdown[0]?.percentage.toFixed(
                          1,
                        ) || 0}
                        % of sales
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <PieChart className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Top Selling Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5" />
                    <span>Top Selling Items</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.topSellingItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">
                              #{index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              {item.quantity} units sold
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {formatCurrency(item.revenue)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {reportData.topSellingItems.length === 0 && (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No sales data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <span>Category Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.categoryBreakdown.map((category, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">
                            {category.category}
                          </span>
                          <span>
                            {formatCurrency(category.revenue)} (
                            {category.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            style={{ width: `${category.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {reportData.categoryBreakdown.length === 0 && (
                      <div className="text-center py-8">
                        <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">
                          No category data available
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Daily Sales Chart */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LineChart className="h-5 w-5" />
                  <span>Daily Sales Trend</span>
                </CardTitle>
                <CardDescription>
                  Track your daily revenue and order patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportData.dailySales.length > 0 ? (
                  <div className="h-64 flex items-end justify-between space-x-2">
                    {reportData.dailySales.map((day, index) => {
                      const maxRevenue = Math.max(
                        ...reportData.dailySales.map((d) => d.revenue),
                      );
                      const height =
                        maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;

                      return (
                        <div
                          key={index}
                          className="flex-1 flex flex-col items-center"
                        >
                          <div className="w-full bg-gray-200 rounded-t-lg relative group">
                            <div
                              className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300"
                              style={{ height: `${height}%`, minHeight: "4px" }}
                            ></div>
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {formatCurrency(day.revenue)}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 mt-2">
                            {new Date(day.date).toLocaleDateString("en-US", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">
                        No sales data available for chart
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Monthly Comparison</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Current Month</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(
                        reportData.monthlyComparison.currentMonth,
                      )}
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Previous Month</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {formatCurrency(
                        reportData.monthlyComparison.previousMonth,
                      )}
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Growth</p>
                    <p
                      className={`text-2xl font-bold ${reportData.monthlyComparison.growth >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {reportData.monthlyComparison.growth >= 0 ? "+" : ""}
                      {reportData.monthlyComparison.growth.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
