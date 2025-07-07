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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  QrCode,
  ArrowLeft,
  Camera,
  Wallet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Store,
  ShoppingCart,
  Plus,
  Minus,
  CreditCard,
} from "lucide-react";
import { Link } from "react-router-dom";

interface VendorItem {
  id: string;
  name: string;
  price: number;
  description: string;
  available: boolean;
  discount?: number;
}

interface MockVendor {
  id: string;
  name: string;
  items: VendorItem[];
}

export default function ScanAndPay() {
  const { user } = useAuth();
  const [scannedData, setScannedData] = useState("");
  const [currentVendor, setCurrentVendor] = useState<MockVendor | null>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "failed"
  >("idle");
  const [total, setTotal] = useState(0);

  // Mock vendor data
  const mockVendors: MockVendor[] = [
    {
      id: "vendor-001",
      name: "Campus Canteen",
      items: [
        {
          id: "item-1",
          name: "Masala Dosa",
          price: 60,
          description: "Crispy dosa with spiced potato filling",
          available: true,
        },
        {
          id: "item-2",
          name: "Veg Burger",
          price: 85,
          description: "Fresh veggie burger with cheese",
          available: true,
          discount: 10,
        },
        {
          id: "item-3",
          name: "Filter Coffee",
          price: 25,
          description: "Traditional South Indian filter coffee",
          available: true,
        },
        {
          id: "item-4",
          name: "Samosa",
          price: 15,
          description: "Crispy fried samosa with chutney",
          available: true,
        },
      ],
    },
    {
      id: "vendor-002",
      name: "Library Coffee",
      items: [
        {
          id: "item-5",
          name: "Cappuccino",
          price: 45,
          description: "Rich espresso with steamed milk",
          available: true,
        },
        {
          id: "item-6",
          name: "Sandwich",
          price: 55,
          description: "Grilled vegetable sandwich",
          available: true,
        },
      ],
    },
  ];

  // Calculate total when cart changes
  useEffect(() => {
    if (!currentVendor) return;

    let newTotal = 0;
    Object.entries(cart).forEach(([itemId, quantity]) => {
      const item = currentVendor.items.find((i) => i.id === itemId);
      if (item) {
        const discountedPrice = item.price * (1 - (item.discount || 0) / 100);
        newTotal += discountedPrice * quantity;
      }
    });
    setTotal(newTotal);
  }, [cart, currentVendor]);

  // Auto-start scanning when component loads
  useEffect(() => {
    startAutoScan();
  }, []);

  // Auto-scan functionality with continuous scanning
  const startAutoScan = () => {
    // Simulate automatic QR/RFID scanning
    const scanInterval = setInterval(() => {
      if (Math.random() > 0.7 && !currentVendor) {
        // 30% chance of detecting vendor QR
        const randomVendor =
          mockVendors[Math.floor(Math.random() * mockVendors.length)];
        setScannedData(randomVendor.id);
        setCurrentVendor(randomVendor);
        clearInterval(scanInterval);
      }
    }, 2000);

    // Clear interval after 30 seconds if nothing is found
    setTimeout(() => clearInterval(scanInterval), 30000);
  };

  const handleScanQR = () => {
    // Mock QR scan - in real app, this would use camera
    const mockQRData = "vendor-001"; // Simulate scanning vendor QR
    setScannedData(mockQRData);

    const vendor = mockVendors.find((v) => v.id === mockQRData);
    if (vendor) {
      setCurrentVendor(vendor);
    }
  };

  const updateCartItem = (itemId: string, change: number) => {
    setCart((prev) => {
      const newQuantity = (prev[itemId] || 0) + change;
      if (newQuantity <= 0) {
        const { [itemId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newQuantity };
    });
  };

  const handlePayment = async () => {
    if (total <= 0 || !user?.walletBalance || user.walletBalance < total) {
      setPaymentStatus("failed");
      setTimeout(() => setPaymentStatus("idle"), 3000);
      return;
    }

    setPaymentStatus("processing");

    // Simulate payment processing
    setTimeout(() => {
      setPaymentStatus("success");
      setTimeout(() => {
        setPaymentStatus("idle");
        setCurrentVendor(null);
        setCart({});
        setScannedData("");
      }, 3000);
    }, 2000);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-green-50/30">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center space-x-4 mb-8">
          <Link to="/student">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Scan & Pay 📱</h1>
            <p className="text-gray-600">
              Scan vendor QR codes to order and pay instantly
            </p>
          </div>
        </div>

        {!currentVendor ? (
          /* QR Scanner Interface */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="h-5 w-5" />
                  <span>Scan Vendor QR Code</span>
                </CardTitle>
                <CardDescription>
                  Point your camera at the vendor's QR code to start ordering
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <Camera className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-600 mb-4">
                      Automatic scanning active
                    </p>
                    <p className="text-sm text-gray-500">
                      Scanning for vendor QR codes...
                    </p>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full animate-pulse"
                          style={{ width: "70%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Or enter QR data manually for demo:
                    </p>
                    <Input
                      placeholder="Enter vendor ID (e.g., vendor-001)"
                      value={scannedData}
                      onChange={(e) => setScannedData(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleScanQR} className="w-full" size="lg">
                    <QrCode className="h-5 w-5 mr-2" />
                    Manual Scan (Demo)
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Automatic scanning is running in background
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Vendors</CardTitle>
                <CardDescription>
                  Quick access to nearby vendors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockVendors.map((vendor) => (
                    <button
                      key={vendor.id}
                      onClick={() => {
                        setScannedData(vendor.id);
                        setCurrentVendor(vendor);
                      }}
                      className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Store className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{vendor.name}</h3>
                          <p className="text-sm text-gray-600">
                            {vendor.items.length} items available
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Vendor Menu Interface */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Store className="h-5 w-5" />
                        <span>{currentVendor.name}</span>
                      </CardTitle>
                      <CardDescription>
                        Select items to add to your order
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentVendor(null);
                        setCart({});
                        setScannedData("");
                      }}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Scan Different Vendor
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentVendor.items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 border rounded-lg ${
                          !item.available
                            ? "opacity-50 bg-gray-50"
                            : "hover:shadow-md transition-shadow"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {item.description}
                            </p>
                          </div>
                          <div className="text-right">
                            {item.discount ? (
                              <div>
                                <span className="text-sm text-gray-500 line-through">
                                  ₹{item.price}
                                </span>
                                <p className="font-bold text-green-600">
                                  ₹
                                  {Math.round(
                                    item.price * (1 - item.discount / 100),
                                  )}
                                </p>
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  {item.discount}% OFF
                                </Badge>
                              </div>
                            ) : (
                              <p className="font-bold text-gray-900">
                                ₹{item.price}
                              </p>
                            )}
                          </div>
                        </div>

                        {item.available ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCartItem(item.id, -1)}
                                disabled={!cart[item.id]}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {cart[item.id] || 0}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCartItem(item.id, 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => updateCartItem(item.id, 1)}
                              className="bg-gradient-to-r from-blue-600 to-purple-600"
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="w-full justify-center"
                          >
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(cart).length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Your cart is empty</p>
                      <p className="text-sm text-gray-500">
                        Add items to start ordering
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {Object.entries(cart).map(([itemId, quantity]) => {
                          const item = currentVendor.items.find(
                            (i) => i.id === itemId,
                          );
                          if (!item) return null;

                          const price =
                            item.price * (1 - (item.discount || 0) / 100);
                          return (
                            <div
                              key={itemId}
                              className="flex justify-between items-center"
                            >
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-gray-600">
                                  ₹{Math.round(price)} × {quantity}
                                </p>
                              </div>
                              <p className="font-semibold">
                                ₹{Math.round(price * quantity)}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total</span>
                          <span>₹{Math.round(total)}</span>
                        </div>
                      </div>

                      {paymentStatus === "processing" && (
                        <Alert className="border-blue-200 bg-blue-50">
                          <AlertTriangle className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-blue-800">
                            Processing payment...
                          </AlertDescription>
                        </Alert>
                      )}

                      {paymentStatus === "success" && (
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            Payment successful! Order placed.
                          </AlertDescription>
                        </Alert>
                      )}

                      {paymentStatus === "failed" && (
                        <Alert variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>
                            Payment failed. Check your wallet balance.
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button
                        onClick={handlePayment}
                        disabled={
                          paymentStatus === "processing" ||
                          !user?.walletBalance ||
                          user.walletBalance < total
                        }
                        className="w-full bg-gradient-to-r from-green-600 to-blue-600"
                        size="lg"
                      >
                        <CreditCard className="h-5 w-5 mr-2" />
                        {paymentStatus === "processing"
                          ? "Processing..."
                          : `Pay ₹${Math.round(total)}`}
                      </Button>

                      <div className="text-center">
                        <p className="text-sm text-gray-600">
                          Wallet Balance: ₹
                          {user?.walletBalance?.toLocaleString()}
                        </p>
                        {user?.walletBalance && user.walletBalance < total && (
                          <p className="text-sm text-red-600 mt-1">
                            Insufficient balance
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Wallet className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Campus Wallet</p>
                        <p className="text-sm text-gray-600">
                          Balance: ₹{user?.walletBalance?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">NFC Card</p>
                        <p className="text-sm text-gray-600">{user?.rfidId}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
