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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  ShoppingCart,
  Scan,
  User,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Receipt,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  FileText,
  Eye,
  Calendar,
} from "lucide-react";
import { User as UserType, MenuItem } from "@shared/api";
import { supabase } from "@/lib/supabase";

interface CartItem extends MenuItem {
  quantity: number;
  subtotal: number;
}

interface StudentDetails {
  id: string;
  name: string;
  college: string;
  course: string;
  year: number;
  walletBalance: number;
  rfidId: string;
  collegeId: string;
}

interface TransactionRecord {
  id: string;
  studentId: string;
  studentName: string;
  items: CartItem[];
  total: number;
  paymentMethod: "wallet";
  timestamp: Date;
  status: "completed" | "failed";
}

export default function StorekeeperDashboard() {
  const { user } = useAuth();
  const [vendorInfo, setVendorInfo] = useState<UserType | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [showReceipt, setShowReceipt] = useState<TransactionRecord | null>(
    null,
  );

  // NFC/RFID scanning states
  const [isNFCSupported, setIsNFCSupported] = useState(false);
  const [isNFCScanning, setIsNFCScanning] = useState(false);
  const [nfcError, setNfcError] = useState<string | null>(null);
  const [lastScannedRFID, setLastScannedRFID] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === "storekeeper") {
      fetchVendorInfo();
      fetchMenuItems();
      loadTransactions();
      initializeNFC();

      // Start NFC scanning only if supported
      if (isNFCSupported) {
        setTimeout(() => {
          startNFCScanning();
        }, 1000);
      }

      // Set up real-time stock monitoring
      const stockRefreshInterval = setInterval(() => {
        fetchMenuItems(); // Refresh menu items every 10 seconds
      }, 10000);

      // Cleanup function to stop scanning and intervals when component unmounts
      return () => {
        stopNFCScanning();
        clearInterval(stockRefreshInterval);
      };
    }

    // Cleanup function to stop scanning when component unmounts
    return () => {
      stopNFCScanning();
    };
  }, [user]);

  const initializeNFC = async () => {
    console.log("=== NFC INITIALIZATION ===");

    // Check if Web NFC is supported
    if ("NDEFReader" in window) {
      setIsNFCSupported(true);
      console.log("✅ NFC is supported by this browser");
    } else {
      setIsNFCSupported(false);
      console.log("❌ NFC is not supported by this browser");
      console.log("💡 NFC is supported in Chrome/Edge on Android devices");
    }
  };

  const startNFCScanning = async () => {
    if (!isNFCSupported) {
      setNfcError(
        "❌ NFC not supported on this device/browser. Please use Chrome/Edge on Android with NFC hardware to scan real RFID cards.",
      );
      setIsNFCScanning(false);
      return;
    }

    try {
      setIsNFCScanning(true);
      setNfcError(null);
      console.log(
        "🔍 Starting real NFC card scanning - place your card near the device",
      );

      // Request NFC permissions
      const ndef = new (window as any).NDEFReader();

      // Start scanning for real cards
      await ndef.scan();
      console.log("✅ Ready to scan your physical RFID card");

      ndef.addEventListener("reading", ({ message, serialNumber }: any) => {
        console.log("📱 Physical RFID card detected!");
        console.log("Serial Number:", serialNumber);
        console.log("Message:", message);

        // Extract RFID ID from the physical card
        let rfidId = serialNumber;

        // If there's message data, try to extract RFID from it
        if (message && message.records && message.records.length > 0) {
          try {
            const record = message.records[0];
            if (record.data) {
              const decoder = new TextDecoder();
              const textData = decoder.decode(record.data);
              console.log("Card data:", textData);
              // Use the text data if it looks like an RFID
              if (
                textData &&
                (textData.includes("RFID") || textData.length > 8)
              ) {
                rfidId = textData.trim();
              }
            }
          } catch (e) {
            console.log("Could not decode message data, using serial number");
          }
        }

        // Use serial number if no better ID found
        if (!rfidId || rfidId.length < 4) {
          rfidId = serialNumber || `CARD-${Date.now()}`;
        }

        setLastScannedRFID(rfidId);
        handleNFCCardScanned(rfidId);
      });

      ndef.addEventListener("readingerror", (error: any) => {
        console.error("❌ NFC reading error:", error);
        setNfcError(
          "❌ Error reading your card. Please try placing it closer to the device.",
        );
        // Auto-restart scanning after error
        setTimeout(() => {
          startNFCScanning();
        }, 2000);
      });
    } catch (error: any) {
      console.error("❌ NFC scan failed:", error);
      let errorMessage = "❌ Failed to start NFC scanning";

      if (error.name === "NotAllowedError") {
        errorMessage =
          "❌ NFC permission denied. Please allow NFC access in your browser settings.";
      } else if (error.name === "NotSupportedError") {
        errorMessage =
          "❌ NFC not supported on this device/browser. Use Chrome/Edge on Android.";
      } else if (error.name === "NotReadableError") {
        errorMessage =
          "❌ NFC hardware is not available or already in use by another app.";
      }

      setNfcError(errorMessage);
      setIsNFCScanning(false);
    }
  };

  const stopNFCScanning = () => {
    setIsNFCScanning(false);
    console.log("⏹️ NFC scanning stopped");

    // Clear simulation interval if running
    if ((window as any).nfcScanInterval) {
      clearInterval((window as any).nfcScanInterval);
      (window as any).nfcScanInterval = null;
    }
  };

  const handleNFCCardScanned = async (rfidId: string) => {
    console.log("🎯 Processing scanned RFID:", rfidId);

    // Auto-search for student with this RFID
    setStudentSearch(rfidId);
    await searchStudent(rfidId);

    // Continue scanning automatically after a brief pause
    setTimeout(() => {
      if (!isNFCScanning) {
        startNFCScanning();
      }
    }, 2000);
  };

  const simulateNFCScan = () => {
    console.log("🎭 Simulating NFC scan...");
    const mockRFIDs = ["RFID-AX12345", "RFID-SW67890", "RFID-MC11111"];

    const randomRFID = mockRFIDs[Math.floor(Math.random() * mockRFIDs.length)];
    setLastScannedRFID(randomRFID);
    handleNFCCardScanned(randomRFID);
  };

  const fetchVendorInfo = async () => {
    console.log("=== VENDOR INFO FETCH DEBUG ===");
    console.log("Current user:", JSON.stringify(user, null, 2));
    console.log("User vendor ID:", user?.vendorId);
    console.log("User role:", user?.role);

    if (!user?.vendorId) {
      console.error("❌ No vendor ID found for storekeeper:", user?.id);
      console.error("User object:", JSON.stringify(user, null, 2));
      return;
    }

    try {
      console.log("✅ Fetching vendor info for ID:", user.vendorId);
      console.log("Vendor ID type:", typeof user.vendorId);

      // First, let's check what users exist with this ID (without role filter)
      console.log("🔍 Checking if user exists with ID:", user.vendorId);
      const { data: checkUser, error: checkError } = await supabase
        .from("users")
        .select("id, name, role, email")
        .eq("id", user.vendorId);

      if (checkError) {
        console.error(
          "❌ Error checking user existence:",
          JSON.stringify(checkError, null, 2),
        );
      } else {
        console.log(
          "📋 Users found with this ID:",
          JSON.stringify(checkUser, null, 2),
        );
      }

      // Now try the original query without .single() to avoid PGRST116 error
      console.log("🔍 Querying vendor with role filter...");
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.vendorId)
        .eq("role", "vendor");

      if (error) {
        console.error("❌ Supabase error fetching vendor:");
        console.error("Error message:", error.message || "No message");
        console.error("Error details:", error.details || "No details");
        console.error("Error hint:", error.hint || "No hint");
        console.error("Error code:", error.code || "No code");
        console.error("Full error object:", JSON.stringify(error, null, 2));
        console.error("Vendor ID being searched:", user.vendorId);
        return;
      }

      if (data && data.length > 0) {
        const vendorData = data[0];
        console.log("✅ Vendor info fetched successfully!");
        console.log("Vendor data:", JSON.stringify(vendorData, null, 2));
        setVendorInfo({
          id: vendorData.id,
          name: vendorData.name,
          role: vendorData.role,
          email: vendorData.email,
          createdAt: new Date(vendorData.created_at),
        });

        // Fetch menu items after vendor info is successfully loaded
        console.log("🔄 Refreshing menu items after vendor fetch...");
        await fetchMenuItems();
      } else {
        console.warn("⚠️ No vendor found with ID:", user.vendorId);

        // Try a broader search to see what's available
        const { data: allVendors } = await supabase
          .from("users")
          .select("id, name, role, email")
          .eq("role", "vendor");

        console.log(
          "📋 All available vendors:",
          JSON.stringify(allVendors, null, 2),
        );

        if (allVendors && allVendors.length > 0) {
          console.warn(
            "💡 SOLUTION: Update your storekeeper's vendor_id to one of these vendor IDs:",
          );
          allVendors.forEach((vendor, index) => {
            console.warn(`${index + 1}. ${vendor.name} (ID: ${vendor.id})`);
          });

          // For now, use the first available vendor as fallback
          const fallbackVendor = allVendors[0];
          console.warn("🔄 Using fallback vendor:", fallbackVendor.name);
          setVendorInfo({
            id: fallbackVendor.id,
            name: fallbackVendor.name + " (Fallback)",
            role: fallbackVendor.role,
            email: fallbackVendor.email,
            createdAt: new Date(),
          });

          // Update user.vendorId to the fallback vendor for menu items fetch
          const updatedUser = { ...user, vendorId: fallbackVendor.id };
          console.log("🔄 Fetching menu items for fallback vendor...");

          // Temporarily update vendorId for menu fetch
          const { data: fallbackMenuItems } = await supabase
            .from("menu_items")
            .select("*")
            .eq("vendor_id", fallbackVendor.id);

          if (fallbackMenuItems) {
            const formattedMenuItems = fallbackMenuItems.map((item) => ({
              id: item.id,
              vendorId: item.vendor_id,
              name: item.name,
              description: item.description || "",
              price: parseFloat(item.price) || 0,
              category: item.category || "Other",
              available: item.available !== false,
              discount: parseFloat(item.discount) || 0,
              stockQuantity: parseInt(item.stock_quantity) || 0,
              image: item.image_url,
            }));
            setMenuItems(formattedMenuItems);
            console.log(
              "✅ Fallback vendor menu items loaded:",
              formattedMenuItems.length,
            );
          }
        } else {
          console.error("❌ No vendors exist in the database!");
          console.error(
            "💡 SOLUTION: Create a vendor user in your database first",
          );

          // Set a placeholder vendor
          setVendorInfo({
            id: "placeholder",
            name: "No Vendor Assigned",
            role: "vendor",
            email: "placeholder@vendor.com",
            createdAt: new Date(),
          });
        }
      }
    } catch (error: any) {
      console.error("Unexpected error fetching vendor info:", {
        message: error?.message,
        stack: error?.stack,
        vendorId: user?.vendorId,
        error: error,
      });
    }
  };

  const fetchMenuItems = async () => {
    console.log("=== MENU ITEMS FETCH DEBUG ===");
    console.log("Vendor ID for menu items:", user?.vendorId);

    if (!user?.vendorId) {
      console.error("❌ Cannot fetch menu items: No vendor ID");
      return;
    }

    try {
      console.log("�� Fetching menu items for vendor:", user.vendorId);

      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("vendor_id", user.vendorId);

      if (error) {
        console.error("❌ Supabase error fetching menu items:");
        console.error("Error message:", error.message || "No message");
        console.error("Error details:", error.details || "No details");
        console.error("Error code:", error.code || "No code");
        console.error("Full error object:", JSON.stringify(error, null, 2));
        return;
      }

      console.log("📦 Raw menu items data:", JSON.stringify(data, null, 2));
      console.log("📊 Number of items found:", data?.length || 0);

      if (!data || data.length === 0) {
        console.warn("⚠️ No menu items found for vendor:", user.vendorId);
        console.warn(
          "💡 SOLUTION: Add menu items to this vendor in the vendor dashboard",
        );

        // Check if there are any menu items at all
        const { data: allItems } = await supabase
          .from("menu_items")
          .select("id, name, vendor_id")
          .limit(10);

        console.log(
          "📋 Sample menu items in database:",
          JSON.stringify(allItems, null, 2),
        );
        setMenuItems([]);
        return;
      }

      const formattedMenuItems = data.map((item) => ({
        id: item.id,
        vendorId: item.vendor_id,
        name: item.name,
        description: item.description || "",
        price: parseFloat(item.price) || 0,
        category: item.category || "Other",
        available: item.available !== false,
        discount: parseFloat(item.discount) || 0,
        stockQuantity: parseInt(item.stock_quantity) || 0,
        image: item.image_url,
      }));

      console.log("✅ Menu items formatted successfully!");
      console.log(
        "📋 Formatted items:",
        JSON.stringify(formattedMenuItems, null, 2),
      );
      setMenuItems(formattedMenuItems);
    } catch (error: any) {
      console.error("❌ Unexpected error fetching menu items:", {
        message: error?.message,
        stack: error?.stack,
        vendorId: user?.vendorId,
        error: error,
      });
    }
  };

  const loadTransactions = async () => {
    if (!user?.vendorId) return;

    try {
      const { data, error } = await supabase
        .from("vendor_orders")
        .select(
          `
          *,
          users!vendor_orders_student_id_fkey(name),
          order_items(
            *,
            menu_items(name, price, category)
          )
        `,
        )
        .eq("vendor_id", user.vendorId)
        .eq("storekeeper_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching transactions:", error);
        return;
      }

      const formattedTransactions: TransactionRecord[] =
        data?.map((order) => ({
          id: order.id,
          studentId: order.student_id,
          studentName: order.users?.name || "Unknown Student",
          items: order.order_items.map((item: any) => ({
            id: item.menu_item_id,
            vendorId: user.vendorId,
            name: item.menu_items?.name || "Unknown Item",
            description: "",
            price: item.menu_items?.price || item.price,
            category: item.menu_items?.category || "Other",
            available: true,
            discount: 0,
            stockQuantity: 0,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
          })),
          total: order.total,
          paymentMethod: "wallet",
          timestamp: new Date(order.created_at),
          status: order.status === "completed" ? "completed" : "failed",
        })) || [];

      setTransactions(formattedTransactions);
    } catch (error: any) {
      console.error("Error loading transactions:", {
        message: error?.message,
        stack: error?.stack,
        vendorId: user?.vendorId,
        error: error,
      });
    }
  };

  const createOrderInSupabase = async (transaction: TransactionRecord) => {
    if (!user?.vendorId) return false;

    try {
      // Create the vendor order
      const { data: orderData, error: orderError } = await supabase
        .from("vendor_orders")
        .insert({
          vendor_id: user.vendorId,
          student_id: transaction.studentId,
          storekeeper_id: user.id,
          total: transaction.total,
          status: "completed",
        })
        .select()
        .single();

      if (orderError) {
        console.error("Error creating order:", {
          message: orderError.message,
          details: orderError.details,
          hint: orderError.hint,
          code: orderError.code,
        });
        return false;
      }

      // Create order items
      const orderItems = transaction.items.map((item) => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price * (1 - (item.discount || 0) / 100),
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Error creating order items:", {
          message: itemsError.message,
          details: itemsError.details,
          hint: itemsError.hint,
          code: itemsError.code,
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error saving transaction to Supabase:", error);
      return false;
    }
  };

  const searchStudent = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "student")
        .or(
          `name.ilike.%${query}%,college_id.ilike.%${query}%,rfid_id.ilike.%${query}%,email.eq.${query}`,
        )
        .single();

      if (error || !data) {
        setSelectedStudent(null);
        console.error("Student not found:", error);
        return;
      }

      const student: StudentDetails = {
        id: data.id,
        name: data.name,
        college: data.college || "",
        course: data.course || "",
        year: data.year || 0,
        walletBalance: parseFloat(data.wallet_balance || "0"),
        rfidId: data.rfid_id || "",
        collegeId: data.college_id || "",
      };

      setSelectedStudent(student);
    } catch (error) {
      console.error("Error searching student:", error);
      setSelectedStudent(null);
    } finally {
      setIsSearching(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    if (!item.available || (item.stockQuantity || 0) <= 0) {
      console.warn(
        "Cannot add item to cart:",
        item.name,
        "- Out of stock or unavailable",
      );
      return;
    }

    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;

    // Check if adding one more would exceed available stock
    if (currentCartQuantity >= (item.stockQuantity || 0)) {
      console.warn("Cannot add more items:", item.name, "- Insufficient stock");
      return;
    }

    if (existingItem) {
      updateQuantity(item.id, existingItem.quantity + 1);
    } else {
      const discountedPrice = item.price * (1 - (item.discount || 0) / 100);
      setCart([
        ...cart,
        {
          ...item,
          quantity: 1,
          subtotal: discountedPrice,
        },
      ]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter((item) => item.id !== itemId));
      return;
    }

    // Find the menu item to check stock
    const menuItem = menuItems.find((item) => item.id === itemId);
    const maxStock = menuItem?.stockQuantity || 0;

    // Limit quantity to available stock
    const validQuantity = Math.min(newQuantity, maxStock);

    setCart(
      cart.map((item) => {
        if (item.id === itemId) {
          const discountedPrice = item.price * (1 - (item.discount || 0) / 100);
          return {
            ...item,
            quantity: validQuantity,
            subtotal: discountedPrice * validQuantity,
          };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const processPayment = async () => {
    if (!selectedStudent || cart.length === 0 || !user?.vendorId) return;

    const total = calculateTotal();
    if (selectedStudent.walletBalance < total) {
      setPaymentStatus("error");
      setTimeout(() => setPaymentStatus("idle"), 3000);
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Create transaction record
      const transaction: TransactionRecord = {
        id: `temp-${Date.now()}`,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        items: [...cart],
        total,
        paymentMethod: "wallet",
        timestamp: new Date(),
        status: "completed",
      };

      // 1. Create wallet transaction (deduct from student)
      const { error: walletError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: selectedStudent.id,
          type: "payment",
          amount: -total,
          description: `Purchase at ${vendorInfo?.name || "Vendor"}`,
          vendor_id: user.vendorId,
          status: "completed",
          payment_method: "wallet",
        });

      if (walletError) {
        console.error("Error creating wallet transaction:", {
          message: walletError.message,
          details: walletError.details,
          hint: walletError.hint,
          code: walletError.code,
        });
        throw walletError;
      }

      // 2. Update student wallet balance
      const newBalance = selectedStudent.walletBalance - total;
      const { error: balanceError } = await supabase
        .from("users")
        .update({ wallet_balance: newBalance })
        .eq("id", selectedStudent.id);

      if (balanceError) {
        console.error("Error updating student balance:", {
          message: balanceError.message,
          details: balanceError.details,
          hint: balanceError.hint,
          code: balanceError.code,
        });
        throw balanceError;
      }

      // 3. Create vendor order and order items
      const orderSaved = await createOrderInSupabase(transaction);
      if (!orderSaved) {
        throw new Error("Failed to save order");
      }

      // 4. Update inventory stock quantities
      for (const cartItem of cart) {
        const { error: stockError } = await supabase
          .from("menu_items")
          .update({
            stock_quantity: Math.max(
              0,
              (cartItem.stockQuantity || 0) - cartItem.quantity,
            ),
          })
          .eq("id", cartItem.id)
          .eq("vendor_id", user.vendorId);

        if (stockError) {
          console.error("Error updating stock:", {
            message: stockError.message,
            details: stockError.details,
            hint: stockError.hint,
            code: stockError.code,
            itemId: cartItem.id,
          });
        }
      }

      // 5. Update local state
      setSelectedStudent({
        ...selectedStudent,
        walletBalance: newBalance,
      });

      setMenuItems(
        menuItems.map((item) => {
          const cartItem = cart.find((ci) => ci.id === item.id);
          if (cartItem) {
            return {
              ...item,
              stockQuantity: Math.max(
                0,
                (item.stockQuantity || 0) - cartItem.quantity,
              ),
            };
          }
          return item;
        }),
      );

      // 6. Refresh transactions and show success
      await loadTransactions();
      setPaymentStatus("success");
      setShowReceipt(transaction);
      clearCart();

      setTimeout(() => {
        setPaymentStatus("idle");
        setSelectedStudent(null);
        setStudentSearch("");
      }, 3000);
    } catch (error) {
      console.error("Payment processing error:", error);
      setPaymentStatus("error");
      setTimeout(() => setPaymentStatus("idle"), 3000);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const generateReceipt = (transaction: TransactionRecord) => {
    // In a real app, this would use a proper PDF library like jsPDF
    const receiptContent = `
CAMPUS CANTEEN RECEIPT
=====================
Date: ${transaction.timestamp.toLocaleString()}
Transaction ID: ${transaction.id}
Student: ${transaction.studentName}

Items:
${transaction.items
  .map(
    (item) => `${item.name} x${item.quantity} - ₹${item.subtotal.toFixed(2)}`,
  )
  .join("\n")}

Total: ₹${transaction.total.toFixed(2)}
Payment: Wallet

Thank you for your purchase!
    `;

    // Create a blob and download
    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${transaction.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getItemEmoji = (itemName: string) => {
    const name = itemName.toLowerCase();
    if (name.includes("coffee") || name.includes("tea")) return "☕";
    if (name.includes("burger") || name.includes("sandwich")) return "🍔";
    if (name.includes("pizza")) return "🍕";
    if (name.includes("dosa") || name.includes("idli")) return "🥞";
    if (name.includes("rice") || name.includes("biryani")) return "🍚";
    if (name.includes("juice") || name.includes("drink")) return "🥤";
    return "🍽️";
  };

  const todayStats = {
    transactions: transactions.filter(
      (t) => t.timestamp.toDateString() === new Date().toDateString(),
    ).length,
    revenue: transactions
      .filter((t) => t.timestamp.toDateString() === new Date().toDateString())
      .reduce((sum, t) => sum + t.total, 0),
    itemsSold: transactions
      .filter((t) => t.timestamp.toDateString() === new Date().toDateString())
      .reduce(
        (sum, t) =>
          sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0,
      ),
  };

  if (!user || user.role !== "storekeeper") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6">
          <CardContent className="text-center">
            <h2 className="text-xl font-semibold text-red-600">
              Access Denied
            </h2>
            <p className="text-gray-600 mt-2">
              This dashboard is only available for storekeepers.
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
            POS System - {vendorInfo?.name}
          </h1>
          <p className="text-gray-600">
            Scan student cards, manage inventory, and process payments
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Today's Sales
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {todayStats.transactions}
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ₹{todayStats.revenue.toFixed(0)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Items Sold
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {todayStats.itemsSold}
                  </p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Low Stock Items
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {
                      menuItems.filter((item) => (item.stockQuantity || 0) < 10)
                        .length
                    }
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main POS Interface */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Student Lookup</span>
                  {isNFCSupported && (
                    <Badge variant="secondary" className="text-xs">
                      NFC Ready
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Scan NFC/RFID card or search manually by Roll Number, RFID, or
                  Name
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* NFC Scanning Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${isNFCScanning ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
                      ></div>
                      <span className="font-medium text-blue-900">
                        {isNFCScanning
                          ? "🔄 Ready to scan your RFID card..."
                          : "📱 RFID Card Scanner"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className={
                          isNFCSupported
                            ? "text-green-700 border-green-300"
                            : "text-red-700 border-red-300"
                        }
                      >
                        {isNFCSupported
                          ? "Real NFC Ready"
                          : "NFC Not Available"}
                      </Badge>
                      {!isNFCSupported && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.reload()}
                          className="border-orange-300 text-orange-700 hover:bg-orange-100"
                        >
                          <Scan className="h-4 w-4 mr-1" />
                          Retry NFC
                        </Button>
                      )}
                    </div>
                  </div>

                  {isNFCScanning && (
                    <div className="text-center py-4">
                      <div className="relative w-16 h-16 mx-auto mb-3">
                        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-3 bg-blue-100 rounded-full flex items-center justify-center">
                          <Scan className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-blue-700 text-sm font-medium">
                        Ready to scan your physical RFID card
                      </p>
                      <p className="text-blue-600 text-xs mt-1">
                        {isNFCSupported
                          ? "Hold your student RFID card close to this device"
                          : "NFC hardware not available on this device"}
                      </p>
                    </div>
                  )}

                  {nfcError && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {nfcError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {lastScannedRFID && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-800 text-sm">
                          Last scanned: <strong>{lastScannedRFID}</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {!isNFCSupported && (
                    <div className="bg-orange-50 border border-orange-200 rounded p-3">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <div className="text-orange-800 text-sm">
                          <p className="font-medium">
                            Real RFID scanning not available
                          </p>
                          <p>
                            To scan physical RFID cards, use Chrome/Edge browser
                            on an Android device with NFC hardware.
                          </p>
                          <p className="mt-1">
                            You can still search students manually using the
                            form below.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Manual Search Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-px bg-gray-300 flex-1"></div>
                    <span className="text-sm text-gray-500">
                      OR SEARCH MANUALLY
                    </span>
                    <div className="h-px bg-gray-300 flex-1"></div>
                  </div>

                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter Roll Number, RFID, or Name (try 'Alex', 'TU21CS001', or 'RFID-AX12345')"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          searchStudent(studentSearch);
                        }
                      }}
                      disabled={isSearching}
                    />
                    <Button
                      onClick={() => searchStudent(studentSearch)}
                      disabled={isSearching || !studentSearch.trim()}
                    >
                      {isSearching ? (
                        <Clock className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setStudentSearch("RFID-AX12345")}
                      disabled={isSearching}
                      title="Quick test with sample RFID"
                    >
                      <Scan className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {selectedStudent && (
                  <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-green-900">
                                {selectedStudent.name}
                              </h3>
                              <p className="text-sm text-green-700">
                                {selectedStudent.course}, Year{" "}
                                {selectedStudent.year}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-green-600 font-medium">
                                College
                              </p>
                              <p className="text-green-800">
                                {selectedStudent.college}
                              </p>
                            </div>
                            <div>
                              <p className="text-green-600 font-medium">
                                Roll Number
                              </p>
                              <p className="text-green-800 font-mono">
                                {selectedStudent.collegeId}
                              </p>
                            </div>
                            <div>
                              <p className="text-green-600 font-medium">RFID</p>
                              <p className="text-green-800 font-mono">
                                {selectedStudent.rfidId}
                              </p>
                            </div>
                            <div>
                              <p className="text-green-600 font-medium">
                                Status
                              </p>
                              <Badge className="bg-green-100 text-green-800">
                                Active
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="text-right ml-6">
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <p className="text-sm text-gray-600 mb-1">
                              Wallet Balance
                            </p>
                            <p className="text-3xl font-bold text-green-600">
                              ₹{selectedStudent.walletBalance.toLocaleString()}
                            </p>
                            <div className="flex items-center justify-center mt-2">
                              <div
                                className={`w-2 h-2 rounded-full mr-2 ${selectedStudent.walletBalance > 100 ? "bg-green-500" : selectedStudent.walletBalance > 50 ? "bg-yellow-500" : "bg-red-500"}`}
                              ></div>
                              <span
                                className={`text-xs ${selectedStudent.walletBalance > 100 ? "text-green-600" : selectedStudent.walletBalance > 50 ? "text-yellow-600" : "text-red-600"}`}
                              >
                                {selectedStudent.walletBalance > 100
                                  ? "Good Balance"
                                  : selectedStudent.walletBalance > 50
                                    ? "Low Balance"
                                    : "Critical Balance"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {lastScannedRFID === selectedStudent.rfidId && (
                        <div className="mt-4 flex items-center space-x-2 bg-blue-100 rounded-lg p-3">
                          <Scan className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-800 text-sm font-medium">
                            Found via NFC scan
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {paymentStatus === "success" && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Payment successful! Receipt generated.
                    </AlertDescription>
                  </Alert>
                )}

                {paymentStatus === "error" && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Payment failed. Insufficient wallet balance or system
                      error.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Menu Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Menu Items</span>
                </CardTitle>
                <CardDescription>
                  Add items to cart by clicking on available items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 border rounded-lg transition-all ${
                        item.available && (item.stockQuantity || 0) > 0
                          ? "hover:shadow-md cursor-pointer hover:border-blue-300"
                          : "opacity-50 bg-gray-50"
                      }`}
                      onClick={() => {
                        if (item.available && (item.stockQuantity || 0) > 0) {
                          addToCart(item);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">
                            {getItemEmoji(item.name)}
                          </span>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            {item.discount && item.discount > 0 && (
                              <span className="text-sm text-gray-500 line-through">
                                ₹{item.price}
                              </span>
                            )}
                            <span className="font-bold text-gray-900">
                              ₹
                              {(
                                item.price *
                                (1 - (item.discount || 0) / 100)
                              ).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                          {item.discount && item.discount > 0 && (
                            <Badge variant="destructive" className="text-xs">
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
                              item.available && (item.stockQuantity || 0) > 0
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {item.available && (item.stockQuantity || 0) > 0
                              ? "Available"
                              : "Out of Stock"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart and Checkout */}
          <div className="space-y-6">
            {/* Shopping Cart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5" />
                    <span>Cart ({cart.length})</span>
                  </CardTitle>
                  {cart.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearCart}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Cart is empty</p>
                    <p className="text-sm text-gray-400">
                      Add items from the menu
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg"
                      >
                        <span className="text-lg">
                          {getItemEmoji(item.name)}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-600">
                            ₹
                            {(
                              item.price *
                              (1 - (item.discount || 0) / 100)
                            ).toFixed(0)}{" "}
                            each
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={isProcessingPayment}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={
                              isProcessingPayment ||
                              (item.stockQuantity || 0) <= item.quantity
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            disabled={isProcessingPayment}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center font-bold">
                        <span>Total:</span>
                        <span>���{calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Checkout */}
            {cart.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Checkout</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedStudent && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium">
                        {selectedStudent.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Balance: ₹
                        {selectedStudent.walletBalance.toLocaleString()}
                      </p>
                      {selectedStudent.walletBalance < calculateTotal() && (
                        <p className="text-sm text-red-600 mt-1">
                          Insufficient balance!
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={processPayment}
                    disabled={
                      !selectedStudent ||
                      cart.length === 0 ||
                      isProcessingPayment ||
                      selectedStudent.walletBalance < calculateTotal()
                    }
                  >
                    {isProcessingPayment ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Process Payment (₹{calculateTotal().toFixed(2)})
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Recent Transactions</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-6">
                    <Receipt className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="p-3 border rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">
                              {transaction.studentName}
                            </p>
                            <p className="text-xs text-gray-600">
                              {transaction.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">
                              ₹{transaction.total.toFixed(2)}
                            </p>
                            <Badge
                              variant={
                                transaction.status === "completed"
                                  ? "default"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-600">
                            {transaction.items.length} item(s)
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowReceipt(transaction)}
                          >
                            <Receipt className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Receipt Dialog */}
        <Dialog open={!!showReceipt} onOpenChange={() => setShowReceipt(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Receipt</DialogTitle>
              <DialogDescription>
                Transaction #{showReceipt?.id}
              </DialogDescription>
            </DialogHeader>
            {showReceipt && (
              <div className="space-y-4">
                <div className="text-center border-b pb-4">
                  <h3 className="font-bold">{vendorInfo?.name}</h3>
                  <p className="text-sm text-gray-600">Campus Food Service</p>
                  <p className="text-xs text-gray-500">
                    {showReceipt.timestamp.toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-medium">
                    Customer: {showReceipt.studentName}
                  </p>
                  <p className="text-sm text-gray-600">
                    Transaction ID: {showReceipt.id}
                  </p>
                </div>

                <div className="space-y-2">
                  {showReceipt.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.name} x{item.quantity}
                      </span>
                      <span>₹{item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>₹{showReceipt.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => generateReceipt(showReceipt)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.print()}
                  >
                    Print
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
