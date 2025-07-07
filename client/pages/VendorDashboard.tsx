import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Store,
  Package,
  Percent,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  Settings,
  History,
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Save,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { MenuItem, VendorOrder, VendorDiscount } from "@shared/api";
import { supabase } from "@/lib/supabase";

interface VendorStats {
  totalItems: number;
  activeDiscounts: number;
  todaySales: number;
  monthlyRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  weeklySales: number;
  averageOrderValue: number;
}

export default function VendorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<VendorStats>({
    totalItems: 0,
    activeDiscounts: 0,
    todaySales: 0,
    monthlyRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    weeklySales: 0,
    averageOrderValue: 0,
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<VendorOrder[]>([]);
  const [activeDiscounts, setActiveDiscounts] = useState<VendorDiscount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isCreateDiscountOpen, setIsCreateDiscountOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stockQuantity: "",
    discount: "",
    available: true,
  });

  const [discountForm, setDiscountForm] = useState({
    title: "",
    description: "",
    discountPercentage: "",
    minOrderValue: "",
    maxDiscountAmount: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (user && user.role === "vendor") {
      fetchVendorData();

      // Set up real-time stock monitoring
      const stockRefreshInterval = setInterval(() => {
        refreshMenuItems();
      }, 5000); // Refresh every 5 seconds

      // Set up real-time analytics refresh
      const analyticsRefreshInterval = setInterval(() => {
        fetchVendorData(); // Refresh all analytics data
      }, 30000); // Refresh every 30 seconds

      return () => {
        clearInterval(stockRefreshInterval);
        clearInterval(analyticsRefreshInterval);
      };
    }
  }, [user]);

  // Function to refresh only menu items for real-time stock updates
  const refreshMenuItems = async () => {
    if (!user) return;

    try {
      const { data: menuData, error: menuError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("vendor_id", user.id);

      if (!menuError && menuData) {
        const formattedMenuItems = menuData.map((item) => ({
          id: item.id,
          vendorId: item.vendor_id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          available: item.available,
          discount: item.discount,
          stockQuantity: item.stock_quantity,
          image: item.image_url,
        }));
        setMenuItems(formattedMenuItems);
        console.log("📦 Stock levels refreshed automatically");
      }
    } catch (error) {
      console.error("Error refreshing menu items:", error);
    }
  };

  const fetchVendorData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Fetch menu items
      const { data: menuData, error: menuError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("vendor_id", user.id);

      if (!menuError && menuData) {
        const formattedMenuItems = menuData.map((item) => ({
          id: item.id,
          vendorId: item.vendor_id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          available: item.available,
          discount: item.discount,
          stockQuantity: item.stock_quantity,
          image: item.image_url,
        }));
        setMenuItems(formattedMenuItems);
      }

      // Fetch recent orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("vendor_orders")
        .select(
          `
          *,
          order_items(*)
        `,
        )
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!ordersError && ordersData) {
        const formattedOrders = ordersData.map((order) => ({
          id: order.id,
          vendorId: order.vendor_id,
          studentId: order.student_id,
          storekeeperId: order.storekeeper_id,
          items: order.order_items.map((item: any) => ({
            menuItemId: item.menu_item_id,
            quantity: item.quantity,
            price: item.price,
          })),
          total: order.total,
          status: order.status,
          timestamp: new Date(order.created_at),
        }));
        setRecentOrders(formattedOrders);
      }

      // Fetch active discounts
      const { data: discountsData, error: discountsError } = await supabase
        .from("vendor_discounts")
        .select("*")
        .eq("vendor_id", user.id)
        .eq("active", true);

      if (!discountsError && discountsData) {
        const formattedDiscounts = discountsData.map((discount) => ({
          id: discount.id,
          vendorId: discount.vendor_id,
          title: discount.title,
          description: discount.description,
          discountPercentage: discount.discount_percentage,
          minOrderValue: discount.min_order_value,
          maxDiscountAmount: discount.max_discount_amount,
          startDate: new Date(discount.start_date),
          endDate: new Date(discount.end_date),
          active: discount.active,
          createdAt: new Date(discount.created_at),
        }));
        setActiveDiscounts(formattedDiscounts);
      }

      // Calculate comprehensive stats from database data
      const totalItems = menuData?.length || 0;
      const activeDiscountCount = discountsData?.length || 0;

      // Get today's date range
      const today = new Date();
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Today's sales from completed orders
      const todaySales =
        ordersData
          ?.filter((order) => {
            const orderDate = new Date(order.created_at);
            return orderDate >= startOfToday && order.status === "completed";
          })
          .reduce((sum, order) => sum + order.total, 0) || 0;

      // Weekly sales
      const weeklySales =
        ordersData
          ?.filter((order) => {
            const orderDate = new Date(order.created_at);
            return orderDate >= startOfWeek && order.status === "completed";
          })
          .reduce((sum, order) => sum + order.total, 0) || 0;

      // Monthly revenue from completed orders
      const monthlyRevenue =
        ordersData
          ?.filter((order) => {
            const orderDate = new Date(order.created_at);
            return orderDate >= startOfMonth && order.status === "completed";
          })
          .reduce((sum, order) => sum + order.total, 0) || 0;

      // Total orders count
      const totalOrders =
        ordersData?.filter((order) => order.status === "completed").length || 0;

      // Pending orders count
      const pendingOrders =
        ordersData?.filter((order) => order.status === "pending").length || 0;

      // Calculate average order value
      const averageOrderValue =
        totalOrders > 0 ? monthlyRevenue / totalOrders : 0;

      setStats({
        totalItems,
        activeDiscounts: activeDiscountCount,
        todaySales,
        monthlyRevenue,
        totalOrders,
        pendingOrders,
        weeklySales,
        averageOrderValue,
      });
    } catch (error) {
      console.error("Error fetching vendor data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForms = () => {
    setItemForm({
      name: "",
      description: "",
      price: "",
      category: "",
      stockQuantity: "",
      discount: "",
      available: true,
    });
    setDiscountForm({
      title: "",
      description: "",
      discountPercentage: "",
      minOrderValue: "",
      maxDiscountAmount: "",
      startDate: "",
      endDate: "",
    });
    setEditingItem(null);
    setError(null);
    setSuccess(null);
  };

  const handleAddItem = async () => {
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("menu_items")
        .insert({
          vendor_id: user.id,
          name: itemForm.name,
          description: itemForm.description,
          price: parseFloat(itemForm.price),
          category: itemForm.category,
          stock_quantity: parseInt(itemForm.stockQuantity) || 0,
          discount: parseFloat(itemForm.discount) || 0,
          available: itemForm.available,
        })
        .select()
        .single();

      if (error) throw error;

      setSuccess("Menu item added successfully!");
      resetForms();
      setIsAddItemOpen(false);
      fetchVendorData(); // Refresh data
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || "Failed to add menu item");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category: item.category,
      stockQuantity: (item.stockQuantity || 0).toString(),
      discount: (item.discount || 0).toString(),
      available: item.available,
    });
    setIsAddItemOpen(true);
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("menu_items")
        .update({
          name: itemForm.name,
          description: itemForm.description,
          price: parseFloat(itemForm.price),
          category: itemForm.category,
          stock_quantity: parseInt(itemForm.stockQuantity) || 0,
          discount: parseFloat(itemForm.discount) || 0,
          available: itemForm.available,
        })
        .eq("id", editingItem.id)
        .eq("vendor_id", user.id);

      if (error) throw error;

      setSuccess("Menu item updated successfully!");
      resetForms();
      setIsAddItemOpen(false);
      fetchVendorData(); // Refresh data
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || "Failed to update menu item");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user || !confirm("Are you sure you want to delete this item?")) return;

    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", itemId)
        .eq("vendor_id", user.id);

      if (error) throw error;

      setSuccess("Menu item deleted successfully!");
      fetchVendorData(); // Refresh data
    } catch (error: any) {
      setError(error.message || "Failed to delete menu item");
    }
  };

  const handleCreateDiscount = async () => {
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("vendor_discounts")
        .insert({
          vendor_id: user.id,
          title: discountForm.title,
          description: discountForm.description,
          discount_percentage: parseFloat(discountForm.discountPercentage),
          min_order_value: parseFloat(discountForm.minOrderValue) || null,
          max_discount_amount:
            parseFloat(discountForm.maxDiscountAmount) || null,
          start_date: discountForm.startDate,
          end_date: discountForm.endDate,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setSuccess("Discount created successfully!");
      resetForms();
      setIsCreateDiscountOpen(false);
      fetchVendorData(); // Refresh data
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || "Failed to create discount");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleItemAvailability = async (item: MenuItem) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ available: !item.available })
        .eq("id", item.id)
        .eq("vendor_id", user.id);

      if (error) throw error;

      setSuccess(
        `Item ${!item.available ? "enabled" : "disabled"} successfully!`,
      );
      fetchVendorData(); // Refresh data
    } catch (error: any) {
      setError(error.message || "Failed to update item availability");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getItemEmoji = (itemName: string) => {
    const name = itemName.toLowerCase();
    if (name.includes("coffee") || name.includes("tea")) return "☕";
    if (name.includes("burger") || name.includes("sandwich")) return "🍔";
    if (name.includes("pizza")) return "🍕";
    if (name.includes("dosa") || name.includes("idli")) return "🥞";
    if (name.includes("rice") || name.includes("biryani")) return "🍚";
    if (name.includes("juice") || name.includes("drink")) return "🥤";
    if (name.includes("sweet") || name.includes("dessert")) return "🍰";
    return "🍽️";
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
              This dashboard is only available for vendors.
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user.name} Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your menu, orders, and business insights
          </p>
        </div>

        {/* Success/Error Alerts */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <Save className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <X className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Menu Items
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalItems}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Total items</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Today's Sales
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(stats.todaySales)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Today only</p>
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
                    Weekly Sales
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(stats.weeklySales)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Last 7 days</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Monthly Revenue
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(stats.monthlyRevenue)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">This month</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
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
                    {stats.totalOrders}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.pendingOrders} pending
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-orange-600" />
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
                    {formatCurrency(stats.averageOrderValue)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Per order</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Store className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        resetForms();
                        setIsAddItemOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingItem
                          ? "Update the details of your menu item"
                          : "Add a new item to your menu"}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Item Name</Label>
                        <Input
                          id="name"
                          value={itemForm.name}
                          onChange={(e) =>
                            setItemForm({ ...itemForm, name: e.target.value })
                          }
                          placeholder="e.g., Masala Dosa"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={itemForm.description}
                          onChange={(e) =>
                            setItemForm({
                              ...itemForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="Describe your item..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Price (₹)</Label>
                          <Input
                            id="price"
                            type="number"
                            value={itemForm.price}
                            onChange={(e) =>
                              setItemForm({
                                ...itemForm,
                                price: e.target.value,
                              })
                            }
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={itemForm.category}
                            onValueChange={(value) =>
                              setItemForm({ ...itemForm, category: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="South Indian">
                                South Indian
                              </SelectItem>
                              <SelectItem value="North Indian">
                                North Indian
                              </SelectItem>
                              <SelectItem value="Fast Food">
                                Fast Food
                              </SelectItem>
                              <SelectItem value="Beverages">
                                Beverages
                              </SelectItem>
                              <SelectItem value="Snacks">Snacks</SelectItem>
                              <SelectItem value="Desserts">Desserts</SelectItem>
                              <SelectItem value="Chinese">Chinese</SelectItem>
                              <SelectItem value="Continental">
                                Continental
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="stock">Stock Quantity</Label>
                          <Input
                            id="stock"
                            type="number"
                            value={itemForm.stockQuantity}
                            onChange={(e) =>
                              setItemForm({
                                ...itemForm,
                                stockQuantity: e.target.value,
                              })
                            }
                            placeholder="0"
                            min="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="discount">Discount (%)</Label>
                          <Input
                            id="discount"
                            type="number"
                            value={itemForm.discount}
                            onChange={(e) =>
                              setItemForm({
                                ...itemForm,
                                discount: e.target.value,
                              })
                            }
                            placeholder="0"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="available"
                          checked={itemForm.available}
                          onChange={(e) =>
                            setItemForm({
                              ...itemForm,
                              available: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        <Label htmlFor="available">Available for order</Label>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          resetForms();
                          setIsAddItemOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={editingItem ? handleUpdateItem : handleAddItem}
                        disabled={
                          isSubmitting ||
                          !itemForm.name ||
                          !itemForm.price ||
                          !itemForm.category
                        }
                      >
                        {isSubmitting
                          ? "Saving..."
                          : editingItem
                            ? "Update Item"
                            : "Add Item"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog
                  open={isCreateDiscountOpen}
                  onOpenChange={setIsCreateDiscountOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        resetForms();
                        setIsCreateDiscountOpen(true);
                      }}
                    >
                      <Percent className="h-4 w-4 mr-2" />
                      Create Discount
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Discount</DialogTitle>
                      <DialogDescription>
                        Set up a new promotional offer for your customers
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="discount-title">Offer Title</Label>
                        <Input
                          id="discount-title"
                          value={discountForm.title}
                          onChange={(e) =>
                            setDiscountForm({
                              ...discountForm,
                              title: e.target.value,
                            })
                          }
                          placeholder="e.g., Weekend Special"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="discount-description">
                          Description
                        </Label>
                        <Textarea
                          id="discount-description"
                          value={discountForm.description}
                          onChange={(e) =>
                            setDiscountForm({
                              ...discountForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="Describe your offer..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="discount-percentage">
                            Discount (%)
                          </Label>
                          <Input
                            id="discount-percentage"
                            type="number"
                            value={discountForm.discountPercentage}
                            onChange={(e) =>
                              setDiscountForm({
                                ...discountForm,
                                discountPercentage: e.target.value,
                              })
                            }
                            placeholder="10"
                            min="1"
                            max="100"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="min-order">Min Order (₹)</Label>
                          <Input
                            id="min-order"
                            type="number"
                            value={discountForm.minOrderValue}
                            onChange={(e) =>
                              setDiscountForm({
                                ...discountForm,
                                minOrderValue: e.target.value,
                              })
                            }
                            placeholder="100"
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="max-discount">
                          Max Discount Amount (₹)
                        </Label>
                        <Input
                          id="max-discount"
                          type="number"
                          value={discountForm.maxDiscountAmount}
                          onChange={(e) =>
                            setDiscountForm({
                              ...discountForm,
                              maxDiscountAmount: e.target.value,
                            })
                          }
                          placeholder="50"
                          min="0"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="start-date">Start Date</Label>
                          <Input
                            id="start-date"
                            type="datetime-local"
                            value={discountForm.startDate}
                            onChange={(e) =>
                              setDiscountForm({
                                ...discountForm,
                                startDate: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="end-date">End Date</Label>
                          <Input
                            id="end-date"
                            type="datetime-local"
                            value={discountForm.endDate}
                            onChange={(e) =>
                              setDiscountForm({
                                ...discountForm,
                                endDate: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          resetForms();
                          setIsCreateDiscountOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateDiscount}
                        disabled={
                          isSubmitting ||
                          !discountForm.title ||
                          !discountForm.discountPercentage
                        }
                      >
                        {isSubmitting ? "Creating..." : "Create Discount"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Link to="/vendor/reports">
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    View Reports
                  </Button>
                </Link>
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </CardContent>
            </Card>

            {/* Active Discounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Percent className="h-5 w-5" />
                    <span>Active Offers</span>
                  </span>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeDiscounts.length > 0 ? (
                  <div className="space-y-3">
                    {activeDiscounts.slice(0, 3).map((discount) => (
                      <div
                        key={discount.id}
                        className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">
                            {discount.title}
                          </h4>
                          <Badge variant="secondary">
                            {discount.discountPercentage}% OFF
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {discount.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            Ends:{" "}
                            {new Date(discount.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Percent className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No active discounts</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        resetForms();
                        setIsCreateDiscountOpen(true);
                      }}
                    >
                      Create Offer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5" />
                    <span>Recent Orders</span>
                  </CardTitle>
                  <Link to="/vendor/orders">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium">
                              Order #{order.id.slice(-8)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              {formatCurrency(order.total)}
                            </p>
                            <Badge
                              variant={
                                order.status === "completed"
                                  ? "default"
                                  : order.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-xs"
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span>
                                {item.quantity}x Item #
                                {item.menuItemId.slice(-6)}
                              </span>
                              <span>
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recent orders</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Menu Items Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Menu Items</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      resetForms();
                      setIsAddItemOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {menuItems.length > 0 ? (
                  <div className="space-y-3">
                    {menuItems.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {getItemEmoji(item.name)}
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              {item.category}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(item.price)}
                            </p>
                            {item.discount && item.discount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {item.discount}% OFF
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              Stock: {item.stockQuantity || 0}
                            </p>
                            <Badge
                              variant={
                                item.available ? "default" : "destructive"
                              }
                              className="text-xs"
                            >
                              {item.available ? "Available" : "Unavailable"}
                            </Badge>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditItem(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleItemAvailability(item)}
                              className={
                                item.available
                                  ? "text-orange-600"
                                  : "text-green-600"
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">No menu items yet</p>
                    <Button
                      onClick={() => {
                        resetForms();
                        setIsAddItemOpen(true);
                      }}
                    >
                      Add Your First Item
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Revenue Chart - Full Width */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Sales Analytics</span>
            </CardTitle>
            <CardDescription>
              Track your revenue and order trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  Revenue chart will be displayed here
                </p>
                <p className="text-sm text-gray-400">
                  Monthly revenue: {formatCurrency(stats.monthlyRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
