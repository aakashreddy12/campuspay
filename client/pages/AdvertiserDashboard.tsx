import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { MultiSelect } from "@/components/ui/multi-select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Megaphone,
  Plus,
  TrendingUp,
  Users,
  Eye,
  MousePointer,
  BarChart3,
  Target,
  Calendar,
  Settings,
  Edit,
  Play,
  Pause,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AdCampaign } from "@shared/api";

export default function AdvertiserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [audienceDemographics, setAudienceDemographics] = useState<any>(null);
  const [placementPerformance, setPlacementPerformance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: "",
    description: "",
    mediaUrl: "",
    mediaType: "image" as const,
    placement: "top-banner" as const,
    size: "medium" as const,
    budget: "",
    startDate: "",
    endDate: "",
    websiteUrl: "",
    callToAction: "",
    targetAudience: {
      courses: [] as string[],
      genders: [] as string[],
      years: [] as string[],
      ageGroups: [] as string[],
      residenceTypes: [] as string[],
      interests: [] as string[],
    },
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [originalImage, setOriginalImage] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchCampaigns();
      fetchAnalytics();
      fetchAudienceDemographics();
      fetchPlacementPerformance();
    }
  }, [user]);

  const fetchAudienceDemographics = async () => {
    try {
      // Calculate demographics manually from users table
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("course, gender, year, college")
        .eq("role", "student");

      if (usersError) {
        console.error("Error fetching users for demographics:", usersError);
        throw usersError;
      }

      if (!users || users.length === 0) {
        setAudienceDemographics({
          totalStudents: 0,
          courseDistribution: [],
          genderDistribution: {},
          yearDistribution: {},
        });
        return;
      }

      // Calculate course distribution
      const courseDistribution: any = {};
      const totalUsers = users.length;

      users.forEach((user) => {
        if (user.course) {
          courseDistribution[user.course] =
            (courseDistribution[user.course] || 0) + 1;
        }
      });

      // Convert to percentage and format
      const courseData = Object.entries(courseDistribution)
        .map(([course, count]: [string, any]) => ({
          name: course,
          count,
          percentage: Math.round((count / totalUsers) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      setAudienceDemographics({
        totalStudents: totalUsers,
        courseDistribution: courseData,
        genderDistribution: users.reduce((acc: any, user) => {
          if (user.gender) {
            acc[user.gender] = (acc[user.gender] || 0) + 1;
          }
          return acc;
        }, {}),
        yearDistribution: users.reduce((acc: any, user) => {
          if (user.year) {
            acc[user.year] = (acc[user.year] || 0) + 1;
          }
          return acc;
        }, {}),
      });
    } catch (error) {
      console.error(
        "Error fetching audience demographics:",
        JSON.stringify(error, null, 2),
      );
      console.error("Error details:", error);
      setAudienceDemographics({
        totalStudents: 0,
        courseDistribution: [],
        genderDistribution: {},
        yearDistribution: {},
      });
    }
  };

  const fetchPlacementPerformance = async () => {
    try {
      // Get campaigns first
      const { data: campaigns, error: campaignsError } = await supabase
        .from("ad_campaigns")
        .select("id, placement")
        .eq("advertiser_id", user?.id);

      if (campaignsError) {
        console.error(
          "Error fetching campaigns for placement performance:",
          campaignsError,
        );
        throw campaignsError;
      }

      if (!campaigns || campaigns.length === 0) {
        setPlacementPerformance([]);
        return;
      }

      // Get events for these campaigns
      const campaignIds = campaigns.map((c) => c.id);
      const { data: events, error: eventsError } = await supabase
        .from("ad_events")
        .select("ad_id, type")
        .in("ad_id", campaignIds);

      if (eventsError) {
        console.error(
          "Error fetching events for placement performance:",
          eventsError,
        );
        // Continue with empty events
      }

      // Calculate performance by placement
      const placementStats: any = {};

      campaigns.forEach((campaign) => {
        const placement = campaign.placement;
        if (!placementStats[placement]) {
          placementStats[placement] = {
            name: placement
              .replace(/-/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            impressions: 0,
            clicks: 0,
            ctr: 0,
          };
        }

        const campaignEvents =
          events?.filter((e: any) => e.ad_id === campaign.id) || [];
        campaignEvents.forEach((event: any) => {
          if (event.type === "impression") {
            placementStats[placement].impressions++;
          } else if (event.type === "click") {
            placementStats[placement].clicks++;
          }
        });
      });

      // Calculate CTR and format data
      const performanceData = Object.values(placementStats).map(
        (stats: any) => ({
          ...stats,
          ctr:
            stats.impressions > 0
              ? ((stats.clicks / stats.impressions) * 100).toFixed(1)
              : "0.0",
          impressions:
            stats.impressions > 1000
              ? `${(stats.impressions / 1000).toFixed(1)}K`
              : stats.impressions.toString(),
        }),
      );

      setPlacementPerformance(performanceData);
    } catch (error) {
      console.error(
        "Error fetching placement performance:",
        JSON.stringify(error, null, 2),
      );
      console.error("Error details:", error);
      // Use fallback data
      setPlacementPerformance([
        { name: "Top Banner", ctr: "0.0", impressions: "0" },
        { name: "Inline Card", ctr: "0.0", impressions: "0" },
        { name: "Sidebar", ctr: "0.0", impressions: "0" },
        { name: "Footer Banner", ctr: "0.0", impressions: "0" },
      ]);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("advertiser_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to match AdCampaign interface
      const transformedCampaigns = data.map((campaign) => ({
        id: campaign.id,
        advertiserId: campaign.advertiser_id,
        title: campaign.title,
        description: campaign.description,
        mediaUrl: campaign.media_url || "",
        mediaType: campaign.media_type,
        placement: campaign.placement,
        size: campaign.target_audience?.size || "medium",
        targetAudience: campaign.target_audience || {},
        startDate: new Date(campaign.start_date),
        endDate: new Date(campaign.end_date),
        budget: campaign.budget,
        status: campaign.status,
        websiteUrl: campaign.website_url,
        callToAction: campaign.call_to_action,
        createdAt: new Date(campaign.created_at),
      }));

      setCampaigns(transformedCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Start with basic campaign data
      const { data: campaigns, error: campaignsError } = await supabase
        .from("ad_campaigns")
        .select("id, title, budget, status")
        .eq("advertiser_id", user?.id);

      if (campaignsError) {
        console.error(
          "Error fetching campaigns for analytics:",
          campaignsError,
        );
        throw campaignsError;
      }

      if (!campaigns || campaigns.length === 0) {
        setAnalytics({
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalImpressions: 0,
          totalClicks: 0,
          totalViews: 0,
          totalSpend: 0,
          overallCTR: 0,
          campaigns: [],
        });
        return;
      }

      // Fetch ad events for these campaigns
      const campaignIds = campaigns.map((c) => c.id);
      const { data: adEvents, error: eventsError } = await supabase
        .from("ad_events")
        .select("ad_id, type, duration_seconds")
        .in("ad_id", campaignIds);

      if (eventsError) {
        console.error("Error fetching ad events:", eventsError);
        // Continue without events data
      }

      // Calculate analytics manually
      let totalImpressions = 0;
      let totalClicks = 0;
      let totalViews = 0;
      let totalSpend = 0;
      const campaignStats: any[] = [];

      campaigns.forEach((campaign) => {
        const campaignEvents =
          adEvents?.filter((e: any) => e.ad_id === campaign.id) || [];
        const impressions = campaignEvents.filter(
          (e: any) => e.type === "impression",
        ).length;
        const clicks = campaignEvents.filter(
          (e: any) => e.type === "click",
        ).length;
        const views = campaignEvents.filter(
          (e: any) => e.type === "view",
        ).length;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

        totalImpressions += impressions;
        totalClicks += clicks;
        totalViews += views;

        // Calculate spend based on budget and campaign status
        if (campaign.status === "active" || campaign.status === "completed") {
          totalSpend += campaign.budget;
        }

        campaignStats.push({
          campaignId: campaign.id,
          title: campaign.title,
          impressions,
          clicks,
          views,
          ctr: Math.round(ctr * 100) / 100,
          spend: campaign.budget,
        });
      });

      setAnalytics({
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c) => c.status === "active").length,
        totalImpressions,
        totalClicks,
        totalViews,
        totalSpend,
        overallCTR:
          totalImpressions > 0
            ? Math.round((totalClicks / totalImpressions) * 100 * 100) / 100
            : 0,
        campaigns: campaignStats,
      });
    } catch (error) {
      console.error(
        "Error fetching analytics:",
        JSON.stringify(error, null, 2),
      );
      console.error("Error details:", error);
      // Set default analytics if query fails
      setAnalytics({
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalViews: 0,
        totalSpend: 0,
        overallCTR: 0,
        campaigns: [],
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("File selected:", file);

    if (file) {
      console.log("File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // In a real app, you'd upload to a CDN/cloud storage
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        console.log(
          "Image loaded as data URL:",
          imageUrl.substring(0, 100) + "...",
        );
        setOriginalImage(imageUrl);
        setUploadedImage(imageUrl);
        setNewCampaign({ ...newCampaign, mediaUrl: imageUrl });
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      alert("You must be logged in to create a campaign");
      return;
    }

    try {
      // Prepare target audience data from multi-select arrays
      const targetAudience: any = {};

      if (newCampaign.targetAudience.courses.length > 0) {
        targetAudience.courses = newCampaign.targetAudience.courses;
      }
      if (newCampaign.targetAudience.genders.length > 0) {
        targetAudience.genders = newCampaign.targetAudience.genders;
      }
      if (newCampaign.targetAudience.years.length > 0) {
        targetAudience.years = newCampaign.targetAudience.years.map((y) =>
          parseInt(y),
        );
      }
      if (newCampaign.targetAudience.ageGroups.length > 0) {
        targetAudience.ageGroups = newCampaign.targetAudience.ageGroups;
      }
      if (newCampaign.targetAudience.residenceTypes.length > 0) {
        targetAudience.residenceTypes =
          newCampaign.targetAudience.residenceTypes;
      }
      if (newCampaign.targetAudience.interests.length > 0) {
        targetAudience.interests = newCampaign.targetAudience.interests;
      }

      // Add size to target audience
      if (newCampaign.size) {
        targetAudience.size = newCampaign.size;
      }

      // Ensure target audience is null if empty rather than empty object
      const finalTargetAudience =
        Object.keys(targetAudience).length > 0 ? targetAudience : null;

      const mediaUrl = uploadedImage || newCampaign.mediaUrl;
      console.log("Creating campaign with media URL:", mediaUrl);
      console.log("Media URL length:", mediaUrl?.length);
      console.log("Uploaded image state:", uploadedImage);

      // Set default dates if not provided
      const startDate =
        newCampaign.startDate || new Date().toISOString().split("T")[0];
      const endDate =
        newCampaign.endDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]; // 30 days from now

      const campaignData = {
        advertiser_id: user?.id,
        title: newCampaign.title?.trim() || "",
        description: newCampaign.description?.trim() || "",
        media_url: mediaUrl || "",
        media_type: newCampaign.mediaType,
        placement: newCampaign.placement,
        target_audience: finalTargetAudience,
        start_date: startDate,
        end_date: endDate,
        budget: parseFloat(newCampaign.budget) || 0,
        status: "pending", // All new campaigns start as pending for admin approval
        website_url: newCampaign.websiteUrl?.trim() || null,
        call_to_action: newCampaign.callToAction?.trim() || null,
      };

      console.log(
        "Attempting to create campaign with data:",
        JSON.stringify(campaignData, null, 2),
      );
      console.log("User ID:", user?.id);
      console.log(
        "Target audience after filtering:",
        JSON.stringify(targetAudience, null, 2),
      );

      const { error } = await supabase
        .from("ad_campaigns")
        .insert([campaignData]);

      if (error) throw error;

      setCreateDialogOpen(false);
      setNewCampaign({
        title: "",
        description: "",
        mediaUrl: "",
        mediaType: "image",
        placement: "top-banner",
        size: "medium",
        budget: "",
        startDate: "",
        endDate: "",
        websiteUrl: "",
        callToAction: "",
        targetAudience: {
          courses: [],
          genders: [],
          years: [],
          ageGroups: [],
          residenceTypes: [],
          interests: [],
        },
      });
      setUploadedImage(null);
      fetchCampaigns();
      fetchAnalytics();
    } catch (error) {
      console.error("Error creating campaign:", JSON.stringify(error, null, 2));
      console.error("Error details:", error);
      console.error(
        "Campaign data that failed:",
        JSON.stringify(campaignData, null, 2),
      );

      // Show user-friendly error message
      alert(
        `Failed to create campaign: ${error?.message || "Unknown error occurred"}`,
      );
    }
  };

  const updateCampaignStatus = async (campaignId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("ad_campaigns")
        .update({
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaignId)
        .eq("advertiser_id", user?.id); // Ensure advertiser can only update their own campaigns

      if (error) throw error;

      fetchCampaigns();
      fetchAnalytics();
    } catch (error) {
      console.error("Error updating campaign:", error);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {user.name} Dashboard 📢
            </h1>
            <p className="text-gray-600">
              Create and manage your ad campaigns on the CampusPay platform
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Active Campaigns</p>
                    <p className="text-2xl font-bold">
                      {isLoading ? (
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      ) : (
                        analytics?.activeCampaigns || 0
                      )}
                    </p>
                  </div>
                  <Megaphone className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Impressions</p>
                    <p className="text-2xl font-bold">
                      {isLoading ? (
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      ) : (
                        analytics?.totalImpressions?.toLocaleString() || 0
                      )}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Total Clicks</p>
                    <p className="text-2xl font-bold">
                      {isLoading ? (
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      ) : (
                        analytics?.totalClicks?.toLocaleString() || 0
                      )}
                    </p>
                  </div>
                  <MousePointer className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">CTR</p>
                    <p className="text-2xl font-bold">
                      {isLoading ? (
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      ) : (
                        `${analytics?.overallCTR || 0}%`
                      )}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={activeTab === "campaigns" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("campaigns")}
              className={
                activeTab === "campaigns"
                  ? "bg-white shadow-sm"
                  : "hover:bg-gray-200"
              }
            >
              Campaigns
            </Button>
            <Button
              variant={activeTab === "analytics" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("analytics")}
              className={
                activeTab === "analytics"
                  ? "bg-white shadow-sm"
                  : "hover:bg-gray-200"
              }
            >
              Analytics
            </Button>
            <Button
              variant={activeTab === "audience" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("audience")}
              className={
                activeTab === "audience"
                  ? "bg-white shadow-sm"
                  : "hover:bg-gray-200"
              }
            >
              Audience
            </Button>
          </div>

          {/* Campaigns Tab */}
          {activeTab === "campaigns" && (
            <div className="space-y-6">
              {campaigns.some((c) => c.status === "pending") && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    You have campaigns awaiting admin approval. Approved
                    campaigns will automatically become active on their start
                    date.
                  </AlertDescription>
                </Alert>
              )}

              {campaigns.some((c) => c.status === "rejected") && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    Some of your campaigns have been rejected. Please review the
                    feedback and create new campaigns with updated content.
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Your Campaigns</CardTitle>
                      <CardDescription>
                        Manage your advertising campaigns
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          fetchCampaigns();
                          fetchAnalytics();
                        }}
                        disabled={isLoading}
                      >
                        <RefreshCw
                          className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                        />
                        Refresh
                      </Button>
                      <Dialog
                        open={createDialogOpen}
                        onOpenChange={setCreateDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Campaign
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Create New Campaign</DialogTitle>
                            <DialogDescription>
                              Set up your advertising campaign with targeting
                              options
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={handleCreateCampaign}
                            className="space-y-4 pr-2"
                          >
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="title">
                                  Campaign Title (Optional)
                                </Label>
                                <Input
                                  id="title"
                                  placeholder="Enter campaign title"
                                  value={newCampaign.title}
                                  onChange={(e) =>
                                    setNewCampaign({
                                      ...newCampaign,
                                      title: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="budget">Budget (₹)</Label>
                                <Input
                                  id="budget"
                                  type="number"
                                  placeholder="Enter budget amount"
                                  value={newCampaign.budget}
                                  onChange={(e) =>
                                    setNewCampaign({
                                      ...newCampaign,
                                      budget: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="description">
                                Description (Optional)
                              </Label>
                              <Textarea
                                id="description"
                                placeholder="Enter campaign description"
                                value={newCampaign.description}
                                onChange={(e) =>
                                  setNewCampaign({
                                    ...newCampaign,
                                    description: e.target.value,
                                  })
                                }
                              />
                            </div>

                            <div className="space-y-4">
                              <Label htmlFor="image">Campaign Media</Label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <Input
                                    id="image"
                                    type="file"
                                    accept="image/*,video/*,.gif"
                                    onChange={handleImageUpload}
                                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                  />
                                  <p className="text-xs text-gray-500">
                                    Upload media for your ad. Image will be
                                    automatically sized for your selected
                                    placement.
                                  </p>
                                </div>
                                {(uploadedImage || newCampaign.mediaUrl) && (
                                  <div className="space-y-4">
                                    <div className="relative">
                                      <Label className="text-sm font-medium">
                                        Live Preview
                                      </Label>
                                      <div className="mt-2 border-2 border-dashed border-purple-200 rounded-lg p-4 bg-purple-50">
                                        <div className="w-full flex justify-center">
                                          <div
                                            className={`border border-gray-300 rounded overflow-hidden ${
                                              newCampaign.placement ===
                                                "top-banner" ||
                                              newCampaign.placement ===
                                                "footer-banner"
                                                ? "w-64 h-16"
                                                : newCampaign.placement ===
                                                    "sidebar"
                                                  ? "w-32 h-48"
                                                  : newCampaign.placement ===
                                                      "inline-card"
                                                    ? "w-48 h-36"
                                                    : newCampaign.placement ===
                                                        "interstitial"
                                                      ? "w-36 h-64"
                                                      : "w-32 h-32"
                                            }`}
                                          >
                                            {(
                                              uploadedImage ||
                                              newCampaign.mediaUrl
                                            )?.startsWith("data:video/") ||
                                            newCampaign.mediaType ===
                                              "video" ? (
                                              <video
                                                src={
                                                  uploadedImage ||
                                                  newCampaign.mediaUrl
                                                }
                                                className="w-full h-full object-cover"
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                              />
                                            ) : (
                                              <img
                                                src={
                                                  uploadedImage ||
                                                  newCampaign.mediaUrl
                                                }
                                                alt="Ad Preview"
                                                className="w-full h-full object-cover"
                                              />
                                            )}
                                          </div>
                                        </div>
                                        <p className="text-xs text-center text-gray-500 mt-2">
                                          {newCampaign.placement
                                            .replace(/-/g, " ")
                                            .replace(/\b\w/g, (l) =>
                                              l.toUpperCase(),
                                            )}{" "}
                                          Preview
                                        </p>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full bg-purple-50 hover:bg-purple-100 border-purple-200"
                                        onClick={() => setShowCropModal(true)}
                                        disabled={!originalImage}
                                      >
                                        ✨ Smart Crop for{" "}
                                        {newCampaign.placement
                                          .replace(/-/g, " ")
                                          .replace(/\b\w/g, (l) =>
                                            l.toUpperCase(),
                                          )}
                                      </Button>
                                      <p className="text-xs text-gray-500">
                                        AI-powered cropping optimized for your
                                        placement
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {(uploadedImage || newCampaign.mediaUrl) && (
                                <div className="mt-2">
                                  <img
                                    src={uploadedImage}
                                    alt="Campaign preview"
                                    className="w-32 h-20 object-cover rounded-lg border"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="space-y-6">
                              {/* Placement Selection with Preview */}
                              <div className="space-y-4">
                                <Label className="text-lg font-semibold">
                                  Choose Ad Placement & Size
                                </Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  {[
                                    {
                                      value: "top-banner",
                                      label: "Top Banner",
                                      size: "large",
                                      aspectRatio: "16:4",
                                    },
                                    {
                                      value: "sidebar",
                                      label: "Sidebar",
                                      size: "small",
                                      aspectRatio: "1:1.5",
                                    },
                                    {
                                      value: "inline-card",
                                      label: "Inline Card",
                                      size: "medium",
                                      aspectRatio: "4:3",
                                    },
                                    {
                                      value: "footer-banner",
                                      label: "Footer Banner",
                                      size: "large",
                                      aspectRatio: "16:3",
                                    },
                                    {
                                      value: "interstitial",
                                      label: "Interstitial",
                                      size: "extra-large",
                                      aspectRatio: "9:16",
                                    },
                                    {
                                      value: "floating-cta",
                                      label: "Floating CTA",
                                      size: "small",
                                      aspectRatio: "1:1",
                                    },
                                  ].map((placement) => (
                                    <div
                                      key={placement.value}
                                      className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                        newCampaign.placement ===
                                        placement.value
                                          ? "border-purple-500 bg-purple-50"
                                          : "border-gray-200 hover:border-gray-300"
                                      }`}
                                      onClick={() =>
                                        setNewCampaign({
                                          ...newCampaign,
                                          placement: placement.value as any,
                                          size: placement.size as any,
                                        })
                                      }
                                    >
                                      <div className="text-center">
                                        <div
                                          className={`mx-auto mb-2 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 ${
                                            placement.aspectRatio === "16:4"
                                              ? "w-full h-8"
                                              : placement.aspectRatio === "16:3"
                                                ? "w-full h-10"
                                                : placement.aspectRatio ===
                                                    "1:1.5"
                                                  ? "w-12 h-18"
                                                  : placement.aspectRatio ===
                                                      "4:3"
                                                    ? "w-16 h-12"
                                                    : placement.aspectRatio ===
                                                        "9:16"
                                                      ? "w-16 h-28"
                                                      : "w-12 h-12"
                                          }`}
                                        >
                                          {uploadedImage ||
                                          newCampaign.mediaUrl ? (
                                            (
                                              uploadedImage ||
                                              newCampaign.mediaUrl
                                            )?.startsWith("data:video/") ||
                                            newCampaign.mediaType ===
                                              "video" ? (
                                              <video
                                                src={
                                                  uploadedImage ||
                                                  newCampaign.mediaUrl
                                                }
                                                className="w-full h-full object-cover rounded"
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                              />
                                            ) : (
                                              <img
                                                src={
                                                  uploadedImage ||
                                                  newCampaign.mediaUrl
                                                }
                                                alt="Preview"
                                                className="w-full h-full object-cover rounded"
                                              />
                                            )
                                          ) : (
                                            <span className="text-xs">
                                              Preview
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm font-medium">
                                          {placement.label}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {placement.size} •{" "}
                                          {placement.aspectRatio}
                                        </p>
                                      </div>
                                      {newCampaign.placement ===
                                        placement.value && (
                                        <div className="absolute top-2 right-2">
                                          <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Media Type Selection */}
                              <div className="space-y-2">
                                <Label htmlFor="mediaType">Media Type</Label>
                                <Select
                                  value={newCampaign.mediaType}
                                  onValueChange={(value) =>
                                    setNewCampaign({
                                      ...newCampaign,
                                      mediaType: value as any,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="image">Image</SelectItem>
                                    <SelectItem value="gif">GIF</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="html">HTML</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="startDate">
                                  Start Date (Optional)
                                </Label>
                                <Input
                                  id="startDate"
                                  type="date"
                                  value={newCampaign.startDate}
                                  onChange={(e) =>
                                    setNewCampaign({
                                      ...newCampaign,
                                      startDate: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="endDate">
                                  End Date (Optional)
                                </Label>
                                <Input
                                  id="endDate"
                                  type="date"
                                  value={newCampaign.endDate}
                                  onChange={(e) =>
                                    setNewCampaign({
                                      ...newCampaign,
                                      endDate: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="websiteUrl">
                                  Website URL (Optional)
                                </Label>
                                <Input
                                  id="websiteUrl"
                                  type="url"
                                  placeholder="https://example.com"
                                  value={newCampaign.websiteUrl}
                                  onChange={(e) =>
                                    setNewCampaign({
                                      ...newCampaign,
                                      websiteUrl: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="callToAction">
                                  Call to Action Button (Optional)
                                </Label>
                                <Select
                                  value={newCampaign.callToAction}
                                  onValueChange={(value) =>
                                    setNewCampaign({
                                      ...newCampaign,
                                      callToAction:
                                        value === "none" ? "" : value,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="Learn More">
                                      Learn More
                                    </SelectItem>
                                    <SelectItem value="Order Now">
                                      Order Now
                                    </SelectItem>
                                    <SelectItem value="Shop Now">
                                      Shop Now
                                    </SelectItem>
                                    <SelectItem value="Visit Store">
                                      Visit Store
                                    </SelectItem>
                                    <SelectItem value="Get Offer">
                                      Get Offer
                                    </SelectItem>
                                    <SelectItem value="Sign Up">
                                      Sign Up
                                    </SelectItem>
                                    <SelectItem value="Download">
                                      Download
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <Label>Target Audience (Optional)</Label>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Courses
                                  </Label>
                                  <MultiSelect
                                    options={[
                                      {
                                        value: "Computer Science",
                                        label: "Computer Science",
                                      },
                                      {
                                        value: "Business Administration",
                                        label: "Business Administration",
                                      },
                                      {
                                        value: "Mechanical Engineering",
                                        label: "Mechanical Engineering",
                                      },
                                      {
                                        value: "Civil Engineering",
                                        label: "Civil Engineering",
                                      },
                                      {
                                        value: "Electronics",
                                        label: "Electronics",
                                      },
                                      { value: "Arts", label: "Arts" },
                                    ]}
                                    selected={
                                      newCampaign.targetAudience.courses
                                    }
                                    onSelectionChange={(courses) =>
                                      setNewCampaign({
                                        ...newCampaign,
                                        targetAudience: {
                                          ...newCampaign.targetAudience,
                                          courses,
                                        },
                                      })
                                    }
                                    placeholder="Select courses..."
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Gender
                                  </Label>
                                  <MultiSelect
                                    options={[
                                      { value: "male", label: "Male" },
                                      { value: "female", label: "Female" },
                                      { value: "other", label: "Other" },
                                    ]}
                                    selected={
                                      newCampaign.targetAudience.genders
                                    }
                                    onSelectionChange={(genders) =>
                                      setNewCampaign({
                                        ...newCampaign,
                                        targetAudience: {
                                          ...newCampaign.targetAudience,
                                          genders,
                                        },
                                      })
                                    }
                                    placeholder="Select genders..."
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Academic Years
                                  </Label>
                                  <MultiSelect
                                    options={[
                                      { value: "1", label: "Year 1" },
                                      { value: "2", label: "Year 2" },
                                      { value: "3", label: "Year 3" },
                                      { value: "4", label: "Year 4" },
                                      { value: "5", label: "Year 5+" },
                                    ]}
                                    selected={newCampaign.targetAudience.years}
                                    onSelectionChange={(years) =>
                                      setNewCampaign({
                                        ...newCampaign,
                                        targetAudience: {
                                          ...newCampaign.targetAudience,
                                          years,
                                        },
                                      })
                                    }
                                    placeholder="Select years..."
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Age Groups
                                  </Label>
                                  <MultiSelect
                                    options={[
                                      { value: "18-20", label: "18-20 years" },
                                      { value: "21-23", label: "21-23 years" },
                                      { value: "24-26", label: "24-26 years" },
                                      { value: "27+", label: "27+ years" },
                                    ]}
                                    selected={
                                      newCampaign.targetAudience.ageGroups
                                    }
                                    onSelectionChange={(ageGroups) =>
                                      setNewCampaign({
                                        ...newCampaign,
                                        targetAudience: {
                                          ...newCampaign.targetAudience,
                                          ageGroups,
                                        },
                                      })
                                    }
                                    placeholder="Select age groups..."
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Residence Type
                                  </Label>
                                  <MultiSelect
                                    options={[
                                      {
                                        value: "hostel",
                                        label: "Hostel Students",
                                      },
                                      {
                                        value: "day-scholar",
                                        label: "Day Scholars",
                                      },
                                      { value: "pg", label: "PG/Rental" },
                                      {
                                        value: "home",
                                        label: "Living at Home",
                                      },
                                    ]}
                                    selected={
                                      newCampaign.targetAudience.residenceTypes
                                    }
                                    onSelectionChange={(residenceTypes) =>
                                      setNewCampaign({
                                        ...newCampaign,
                                        targetAudience: {
                                          ...newCampaign.targetAudience,
                                          residenceTypes,
                                        },
                                      })
                                    }
                                    placeholder="Select residence types..."
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Interests
                                  </Label>
                                  <MultiSelect
                                    options={[
                                      { value: "sports", label: "Sports" },
                                      {
                                        value: "technology",
                                        label: "Technology",
                                      },
                                      {
                                        value: "arts",
                                        label: "Arts & Culture",
                                      },
                                      { value: "food", label: "Food & Dining" },
                                      { value: "fashion", label: "Fashion" },
                                      { value: "travel", label: "Travel" },
                                      { value: "gaming", label: "Gaming" },
                                      { value: "music", label: "Music" },
                                      { value: "fitness", label: "Fitness" },
                                      {
                                        value: "books",
                                        label: "Books & Reading",
                                      },
                                    ]}
                                    selected={
                                      newCampaign.targetAudience.interests
                                    }
                                    onSelectionChange={(interests) =>
                                      setNewCampaign({
                                        ...newCampaign,
                                        targetAudience: {
                                          ...newCampaign.targetAudience,
                                          interests,
                                        },
                                      })
                                    }
                                    placeholder="Select interests..."
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit">Create Campaign</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-500">
                        Loading campaigns...
                      </span>
                    </div>
                  ) : campaigns.length === 0 ? (
                    <div className="text-center py-12">
                      <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Campaigns Yet
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Create your first advertising campaign to reach your
                        audience
                      </p>
                      <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Campaign
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {campaigns.map((campaign) => (
                        <div
                          key={campaign.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">
                                {campaign.title}
                              </h3>
                              <p className="text-gray-600 text-sm">
                                {campaign.description}
                              </p>
                              <div className="flex items-center space-x-4 mt-2">
                                <Badge variant="secondary">
                                  {campaign.placement}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  ₹{campaign.budget}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {new Date(
                                    campaign.startDate,
                                  ).toLocaleDateString()}{" "}
                                  -{" "}
                                  {new Date(
                                    campaign.endDate,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
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
                                {campaign.status === "active" && (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                {campaign.status === "pending" && (
                                  <Clock className="h-3 w-3 mr-1" />
                                )}
                                {campaign.status === "rejected" && (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                {campaign.status}
                              </Badge>
                              {campaign.status === "active" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    updateCampaignStatus(campaign.id, "paused")
                                  }
                                >
                                  <Pause className="h-4 w-4" />
                                </Button>
                              )}
                              {campaign.status === "paused" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    updateCampaignStatus(campaign.id, "active")
                                  }
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {analytics &&
                            analytics.campaigns.find(
                              (c: any) => c.campaignId === campaign.id,
                            ) && (
                              <div className="grid grid-cols-4 gap-4 pt-3 border-t">
                                {(() => {
                                  const campaignAnalytics =
                                    analytics.campaigns.find(
                                      (c: any) => c.campaignId === campaign.id,
                                    );
                                  return (
                                    <>
                                      <div className="text-center">
                                        <p className="text-lg font-bold">
                                          {campaignAnalytics.impressions}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Impressions
                                        </p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-lg font-bold">
                                          {campaignAnalytics.clicks}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Clicks
                                        </p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-lg font-bold">
                                          {campaignAnalytics.ctr}%
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          CTR
                                        </p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-lg font-bold">
                                          ₹{campaignAnalytics.spend}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Spent
                                        </p>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{analytics.totalSpend}
                        </p>
                        <p className="text-sm text-gray-600">Total Spend</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {analytics.overallCTR}%
                        </p>
                        <p className="text-sm text-gray-600">Overall CTR</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.campaigns
                      .sort((a: any, b: any) => b.ctr - a.ctr)
                      .slice(0, 5)
                      .map((campaign: any) => (
                        <div
                          key={campaign.campaignId}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{campaign.title}</p>
                            <p className="text-sm text-gray-600">
                              {campaign.impressions} impressions
                            </p>
                          </div>
                          <Badge variant="secondary">{campaign.ctr}% CTR</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Audience Tab */}
          {activeTab === "audience" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Audience Demographics</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchAudienceDemographics}
                      disabled={isLoading}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </div>
                  {audienceDemographics && (
                    <CardDescription>
                      Total Students:{" "}
                      {audienceDemographics.totalStudents.toLocaleString()}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {audienceDemographics ? (
                    <div className="space-y-4">
                      {audienceDemographics.courseDistribution
                        .slice(0, 6)
                        .map((course: any, index: number) => (
                          <div key={course.name}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{course.name}</span>
                              <span>
                                {course.percentage}% ({course.count} students)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  index === 0
                                    ? "bg-blue-600"
                                    : index === 1
                                      ? "bg-green-600"
                                      : index === 2
                                        ? "bg-purple-600"
                                        : index === 3
                                          ? "bg-orange-600"
                                          : index === 4
                                            ? "bg-pink-600"
                                            : "bg-gray-600"
                                }`}
                                style={{ width: `${course.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      {audienceDemographics.courseDistribution.length === 0 && (
                        <p className="text-gray-500 text-center">
                          No demographic data available
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Ad Placement Performance</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchPlacementPerformance}
                      disabled={isLoading}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {placementPerformance.map((placement, index) => (
                      <div
                        key={placement.name}
                        className="flex justify-between items-center p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{placement.name}</p>
                          <p className="text-sm text-gray-600">
                            {placement.impressions} impressions
                          </p>
                        </div>
                        <Badge variant="secondary">{placement.ctr}% CTR</Badge>
                      </div>
                    ))}
                    {placementPerformance.length === 0 && (
                      <p className="text-gray-500 text-center">
                        No placement data available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
