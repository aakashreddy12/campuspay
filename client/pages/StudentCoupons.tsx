import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Gift,
  ArrowLeft,
  Copy,
  CheckCircle,
  Clock,
  Tag,
  Percent,
  IndianRupee,
  Calendar,
  Store,
  Search,
  Filter,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AdCampaign } from "@shared/api";
import { supabase } from "@/lib/supabase";

interface Coupon {
  id: string;
  title: string;
  description: string;
  discount: number;
  discountType: "percentage" | "fixed";
  code: string;
  minAmount?: number;
  maxDiscount?: number;
  validUntil: Date;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  applicableVendors: string[];
  category: string;
  isUsed?: boolean;
}

export default function StudentCoupons() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [copiedCode, setCopiedCode] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [activeAds, setActiveAds] = useState<AdCampaign[]>([]);

  // Mock coupons data
  const mockCoupons: Coupon[] = [
    {
      id: "1",
      title: "Welcome to Campus!",
      description:
        "Special welcome discount for new students. Use this coupon on your first purchase at any campus vendor.",
      discount: 20,
      discountType: "percentage",
      code: "WELCOME20",
      minAmount: 100,
      maxDiscount: 50,
      validUntil: new Date("2024-12-31"),
      usageLimit: 1,
      usedCount: 0,
      isActive: true,
      applicableVendors: [
        "Campus Canteen",
        "Library Coffee",
        "Stationary Store",
      ],
      category: "welcome",
    },
    {
      id: "2",
      title: "Weekend Special",
      description:
        "Enjoy weekend discounts on all food items. Perfect for your weekend treats!",
      discount: 15,
      discountType: "percentage",
      code: "WEEKEND15",
      minAmount: 50,
      maxDiscount: 30,
      validUntil: new Date("2024-12-25"),
      usageLimit: 5,
      usedCount: 1,
      isActive: true,
      applicableVendors: ["Campus Canteen", "Library Coffee"],
      category: "food",
    },
    {
      id: "3",
      title: "Study Fuel Discount",
      description:
        "Get discounts on coffee and snacks during exam season. Fuel your studies!",
      discount: 25,
      discountType: "fixed",
      code: "STUDY25",
      minAmount: 75,
      validUntil: new Date("2024-12-20"),
      usageLimit: 3,
      usedCount: 0,
      isActive: true,
      applicableVendors: ["Library Coffee"],
      category: "food",
    },
    {
      id: "4",
      title: "Stationery Saver",
      description: "Save on all your academic supplies and stationery needs.",
      discount: 10,
      discountType: "percentage",
      code: "BOOKS10",
      minAmount: 150,
      maxDiscount: 75,
      validUntil: new Date("2025-01-15"),
      usageLimit: 2,
      usedCount: 0,
      isActive: true,
      applicableVendors: ["Stationary Store", "Campus Bookstore"],
      category: "academic",
    },
    {
      id: "5",
      title: "Friendship Day Special",
      description:
        "Share the joy with friends! Use this coupon when dining together.",
      discount: 30,
      discountType: "fixed",
      code: "FRIENDS30",
      minAmount: 200,
      validUntil: new Date("2024-12-18"),
      usageLimit: 1,
      usedCount: 1,
      isActive: false,
      applicableVendors: ["Campus Canteen"],
      category: "social",
      isUsed: true,
    },
    {
      id: "6",
      title: "Hostel Night Snacks",
      description:
        "Late night study sessions? Get discounts on your midnight snacks!",
      discount: 20,
      discountType: "percentage",
      code: "NIGHT20",
      minAmount: 40,
      maxDiscount: 25,
      validUntil: new Date("2024-12-30"),
      usageLimit: 10,
      usedCount: 3,
      isActive: true,
      applicableVendors: ["Campus Canteen"],
      category: "food",
    },
  ];

  const categories = [
    { id: "all", name: "All Coupons", icon: Gift },
    { id: "welcome", name: "Welcome", icon: Sparkles },
    { id: "food", name: "Food & Drinks", icon: Store },
    { id: "academic", name: "Academic", icon: Tag },
    { id: "social", name: "Social", icon: Gift },
  ];

  useEffect(() => {
    setCoupons(mockCoupons);
    setFilteredCoupons(mockCoupons);
  }, []);

  useEffect(() => {
    let filtered = coupons;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (coupon) => coupon.category === selectedCategory,
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (coupon) =>
          coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          coupon.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          coupon.code.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredCoupons(filtered);
  }, [coupons, selectedCategory, searchTerm]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  const isExpired = (date: Date) => {
    return new Date() > date;
  };

  const isUsageLimitReached = (coupon: Coupon) => {
    return coupon.usedCount >= coupon.usageLimit;
  };

  const getDiscountText = (coupon: Coupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discount}% OFF`;
    } else {
      return `₹${coupon.discount} OFF`;
    }
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (coupon.isUsed) return { text: "Used", variant: "secondary" as const };
    if (!coupon.isActive)
      return { text: "Inactive", variant: "secondary" as const };
    if (isExpired(coupon.validUntil))
      return { text: "Expired", variant: "destructive" as const };
    if (isUsageLimitReached(coupon))
      return { text: "Limit Reached", variant: "destructive" as const };
    return { text: "Active", variant: "default" as const };
  };

  useEffect(() => {
    if (user) {
      fetchActiveAds();
    }
  }, [user]);

  const fetchActiveAds = async () => {
    try {
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("status", "active")
        .lte("start_date", new Date().toISOString())
        .gte("end_date", new Date().toISOString());

      if (error) {
        console.error("Error fetching ads:", error);
        return;
      }

      setActiveAds(data || []);
    } catch (error) {
      console.error("Error fetching ads:", error);
    }
  };

  const handleAdClick = async (ad: AdCampaign) => {
    // Track ad click event
    try {
      await supabase.from("ad_events").insert({
        user_id: user?.id,
        ad_id: ad.id,
        type: "click",
        metadata: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      console.error("Error tracking ad click:", error);
    }

    // Open website URL if available
    if (ad.websiteUrl) {
      window.open(ad.websiteUrl, "_blank");
    }
  };

  const AdCard = ({ ad }: { ad: AdCampaign }) => (
    <Card className="border-purple-200 hover:shadow-lg transition-all duration-300 cursor-pointer group">
      <div className="relative h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-t-lg overflow-hidden">
        {ad.mediaUrl ? (
          <img
            src={ad.mediaUrl}
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Gift className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <span className="text-xs text-purple-600">Ad Content</span>
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge className="bg-purple-600 text-white">Sponsored</Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
          {ad.title}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{ad.description}</p>
        <Button
          size="sm"
          variant="outline"
          className="w-full mt-3 border-purple-200 hover:bg-purple-50"
          onClick={() => handleAdClick(ad)}
        >
          {ad.callToAction || "Learn More"}
        </Button>
      </CardContent>
    </Card>
  );

  const activeCoupons = coupons.filter(
    (c) =>
      c.isActive &&
      !isExpired(c.validUntil) &&
      !isUsageLimitReached(c) &&
      !c.isUsed,
  );
  const usedCoupons = coupons.filter((c) => c.isUsed || isUsageLimitReached(c));
  const expiredCoupons = coupons.filter((c) => isExpired(c.validUntil));

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
      <Navbar />

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
            <h1 className="text-3xl font-bold text-gray-900">My Coupons 🎟️</h1>
            <p className="text-gray-600">
              Discover and use amazing discounts on campus
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-xl font-bold">{activeCoupons.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Used</p>
                  <p className="text-xl font-bold">{usedCoupons.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expired</p>
                  <p className="text-xl font-bold">{expiredCoupons.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <IndianRupee className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Saved</p>
                  <p className="text-xl font-bold">₹342</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Coupons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search coupons..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const count =
                    category.id === "all"
                      ? coupons.length
                      : coupons.filter((c) => c.category === category.id)
                          .length;

                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                        selectedCategory === category.id
                          ? "bg-purple-100 text-purple-900 border border-purple-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon
                          className={`h-5 w-5 ${
                            selectedCategory === category.id
                              ? "text-purple-600"
                              : "text-gray-600"
                          }`}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <Badge
                        variant={
                          selectedCategory === category.id
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {count}
                      </Badge>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Top Sidebar Ad */}
            {activeAds
              .filter((ad) => ad.placement === "sidebar")
              .slice(0, 1)
              .map((ad) => (
                <AdCard key={ad.id} ad={ad} />
              ))}

            {/* Coupon-related Sponsored Content */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200 relative">
              <div className="flex items-center justify-between mb-3">
                <Badge className="bg-yellow-600 text-white text-xs">
                  Sponsored
                </Badge>
                <button className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                🛍️ Shopping Rewards
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Earn extra cashback on online purchases. Get 5% back on all
                student shopping.
              </p>
              <Button
                size="sm"
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                Start Earning
              </Button>
            </div>

            {/* Second Sidebar Ad */}
            {activeAds
              .filter((ad) => ad.placement === "dashboard-card")
              .slice(0, 1)
              .map((ad) => (
                <AdCard key={ad.id} ad={ad} />
              ))}

            {/* Coupon Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💡 Coupon Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Check expiry dates regularly</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Read minimum amount requirements</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Some coupons have usage limits</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Copy code before going to vendor</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Coupons Grid */}
            <div className="grid gap-6">
              {filteredCoupons.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Coupons Found
                    </h3>
                    <p className="text-gray-600">
                      Try adjusting your search or filter criteria
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredCoupons.map((coupon, index) => {
                  const status = getCouponStatus(coupon);
                  const canUse = status.text === "Active";
                  const shouldShowAd =
                    index === 2 &&
                    activeAds.filter((ad) => ad.placement === "inline-card")
                      .length > 0;

                  return (
                    <div key={coupon.id}>
                      {shouldShowAd && (
                        <div className="mb-6">
                          <AdCard
                            ad={
                              activeAds.filter(
                                (ad) => ad.placement === "inline-card",
                              )[0]
                            }
                          />
                        </div>
                      )}
                      <Card
                        className={`hover:shadow-lg transition-all duration-300 ${
                          canUse ? "border-green-200" : "opacity-75"
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row gap-4">
                            {/* Coupon Visual */}
                            <div className="md:w-32 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <div className="text-center">
                                <div className="text-lg font-bold text-purple-600">
                                  {getDiscountText(coupon)}
                                </div>
                                <div className="text-xs text-purple-500">
                                  {coupon.discountType === "percentage"
                                    ? "Percent"
                                    : "Fixed"}
                                </div>
                              </div>
                            </div>

                            {/* Coupon Details */}
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {coupon.title}
                                </h3>
                                <Badge variant={status.variant}>
                                  {status.text}
                                </Badge>
                              </div>

                              <p className="text-gray-600 text-sm mb-3">
                                {coupon.description}
                              </p>

                              <div className="flex flex-wrap gap-2 mb-3">
                                {coupon.minAmount && (
                                  <Badge variant="outline" className="text-xs">
                                    Min: ₹{coupon.minAmount}
                                  </Badge>
                                )}
                                {coupon.maxDiscount && (
                                  <Badge variant="outline" className="text-xs">
                                    Max: ₹{coupon.maxDiscount}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {new Date(
                                    coupon.validUntil,
                                  ).toLocaleDateString()}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {coupon.usedCount}/{coupon.usageLimit} used
                                </Badge>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600">
                                    Valid at:
                                  </span>
                                  <div className="flex space-x-1">
                                    {coupon.applicableVendors
                                      .slice(0, 2)
                                      .map((vendor, index) => (
                                        <Badge
                                          key={index}
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {vendor}
                                        </Badge>
                                      ))}
                                    {coupon.applicableVendors.length > 2 && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        +{coupon.applicableVendors.length - 2}{" "}
                                        more
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          setSelectedCoupon(coupon)
                                        }
                                      >
                                        Details
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>
                                          {coupon.title}
                                        </DialogTitle>
                                        <DialogDescription>
                                          Coupon details and usage information
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <h4 className="font-medium mb-2">
                                            Description
                                          </h4>
                                          <p className="text-sm text-gray-600">
                                            {coupon.description}
                                          </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <h4 className="font-medium mb-2">
                                              Discount
                                            </h4>
                                            <p className="text-lg font-bold text-green-600">
                                              {getDiscountText(coupon)}
                                            </p>
                                          </div>
                                          <div>
                                            <h4 className="font-medium mb-2">
                                              Valid Until
                                            </h4>
                                            <p className="text-sm">
                                              {new Date(
                                                coupon.validUntil,
                                              ).toLocaleDateString()}
                                            </p>
                                          </div>
                                        </div>

                                        <div>
                                          <h4 className="font-medium mb-2">
                                            Applicable Vendors
                                          </h4>
                                          <div className="flex flex-wrap gap-2">
                                            {coupon.applicableVendors.map(
                                              (vendor, index) => (
                                                <Badge
                                                  key={index}
                                                  variant="outline"
                                                >
                                                  {vendor}
                                                </Badge>
                                              ),
                                            )}
                                          </div>
                                        </div>

                                        <div>
                                          <h4 className="font-medium mb-2">
                                            Terms & Conditions
                                          </h4>
                                          <ul className="text-sm text-gray-600 space-y-1">
                                            {coupon.minAmount && (
                                              <li>
                                                • Minimum order amount: ₹
                                                {coupon.minAmount}
                                              </li>
                                            )}
                                            {coupon.maxDiscount && (
                                              <li>
                                                • Maximum discount: ₹
                                                {coupon.maxDiscount}
                                              </li>
                                            )}
                                            <li>
                                              • Can be used {coupon.usageLimit}{" "}
                                              time(s)
                                            </li>
                                            <li>
                                              • Valid only at listed vendors
                                            </li>
                                            <li>
                                              • Cannot be combined with other
                                              offers
                                            </li>
                                          </ul>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>

                                  {canUse && (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        copyToClipboard(coupon.code)
                                      }
                                      className="bg-gradient-to-r from-purple-600 to-pink-600"
                                    >
                                      {copiedCode === coupon.code ? (
                                        <>
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Copied!
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="h-4 w-4 mr-2" />
                                          Copy {coupon.code}
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Banner Ad */}
        {activeAds
          .filter((ad) => ad.placement === "footer-banner")
          .slice(0, 1)
          .map((ad) => (
            <div key={ad.id} className="mt-8">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200 relative">
                <div className="flex items-center justify-between">
                  <Badge className="bg-purple-600 text-white text-xs absolute top-2 left-2">
                    Sponsored
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setClosedAds((prev) => [...prev, ad.id]);
                    }}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div
                  className="flex items-center justify-between cursor-pointer pt-6"
                  onClick={() => handleAdClick(ad)}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{ad.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {ad.description}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {ad.callToAction || "Learn More"}
                  </Button>
                </div>
              </div>
            </div>
          ))}

        {/* Floating CTA Ad */}
        {activeAds
          .filter((ad) => ad.placement === "floating-cta")
          .slice(0, 1)
          .map((ad) => (
            <div key={ad.id} className="fixed bottom-4 right-4 z-50 max-w-sm">
              <div className="bg-white rounded-lg shadow-lg border-2 border-orange-200 p-4 relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setClosedAds((prev) => [...prev, ad.id]);
                  }}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
                <Badge className="bg-orange-600 text-white text-xs mb-2">
                  Sponsored
                </Badge>
                <h4 className="font-semibold text-gray-900 mb-2">{ad.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{ad.description}</p>
                <Button
                  size="sm"
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={() => handleAdClick(ad)}
                >
                  {ad.callToAction || "Learn More"}
                </Button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
