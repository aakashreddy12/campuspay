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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Newspaper,
  Users,
  Calendar,
  Trophy,
  Briefcase,
  GraduationCap,
  Heart,
  Search,
  Filter,
  Clock,
  Eye,
  ThumbsUp,
  MessageCircle,
  X,
  Share,
  BookOpen,
  Music,
  Camera,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AdCampaign } from "@shared/api";
import { supabase } from "@/lib/supabase";

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  publishedAt: Date;
  views: number;
  likes: number;
  comments: number;
  image?: string;
  tags: string[];
  isPinned?: boolean;
}

export default function CampusNews() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [activeAds, setActiveAds] = useState<AdCampaign[]>([]);

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

  // Mock news data
  const [newsItems] = useState<NewsItem[]>([
    {
      id: "1",
      title: "Annual Tech Fest 2024 - Registration Now Open!",
      excerpt:
        "Get ready for the biggest tech event of the year with exciting competitions, workshops, and prizes worth ₹5 lakhs.",
      content: "Full content here...",
      category: "events",
      author: "Tech Committee",
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      views: 1250,
      likes: 89,
      comments: 23,
      image: "https://picsum.photos/400/200?random=1",
      tags: ["technology", "competition", "workshops"],
      isPinned: true,
    },
    {
      id: "2",
      title: "Campus Placement Drive Results - Record Breaking Offers",
      excerpt:
        "This year's placement season saw record-breaking results with the highest package reaching ₹45 LPA.",
      content: "Full content here...",
      category: "placement",
      author: "Placement Cell",
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      views: 2100,
      likes: 156,
      comments: 67,
      image: "https://picsum.photos/400/200?random=2",
      tags: ["placements", "careers", "success"],
      isPinned: true,
    },
    {
      id: "3",
      title: "Photography Club Wins National Competition",
      excerpt:
        "Our photography club secured first place in the national inter-college photography contest.",
      content: "Full content here...",
      category: "clubs",
      author: "Photography Club",
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      views: 850,
      likes: 124,
      comments: 34,
      image: "https://picsum.photos/400/200?random=3",
      tags: ["photography", "competition", "achievement"],
    },
    {
      id: "4",
      title: "New Cafeteria Menu - Healthy Options Added",
      excerpt:
        "The campus cafeteria introduces new healthy meal options including vegan and gluten-free choices.",
      content: "Full content here...",
      category: "general",
      author: "Campus Administration",
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      views: 980,
      likes: 67,
      comments: 18,
      tags: ["food", "health", "campus"],
    },
    {
      id: "5",
      title: "Basketball Team Advances to State Finals",
      excerpt:
        "Our basketball team defeats rival college 78-65 to advance to the state championship finals.",
      content: "Full content here...",
      category: "sports",
      author: "Sports Committee",
      publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      views: 1150,
      likes: 203,
      comments: 45,
      image: "https://picsum.photos/400/200?random=4",
      tags: ["basketball", "sports", "championship"],
    },
    {
      id: "6",
      title: "Mental Health Awareness Week - Free Counseling Sessions",
      excerpt:
        "Join us for Mental Health Awareness Week with free counseling sessions, workshops, and wellness activities.",
      content: "Full content here...",
      category: "wellness",
      author: "Student Wellness Center",
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      views: 756,
      likes: 98,
      comments: 12,
      tags: ["mental health", "wellness", "counseling"],
    },
    {
      id: "7",
      title: "Scholarship Opportunities for Underprivileged Students",
      excerpt:
        "New scholarship program launched to support academically excellent students from underprivileged backgrounds.",
      content: "Full content here...",
      category: "academic",
      author: "Academic Office",
      publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
      views: 1890,
      likes: 234,
      comments: 78,
      tags: ["scholarship", "education", "support"],
    },
    {
      id: "8",
      title: "Music Society Concert - Classical Evening",
      excerpt:
        "Experience a mesmerizing evening of classical music performed by our talented music society members.",
      content: "Full content here...",
      category: "clubs",
      author: "Music Society",
      publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      views: 654,
      likes: 87,
      comments: 15,
      tags: ["music", "classical", "performance"],
    },
  ]);

  const categories = [
    { id: "all", name: "All News", icon: Newspaper, color: "text-gray-600" },
    {
      id: "general",
      name: "General",
      icon: Newspaper,
      color: "text-blue-600",
    },
    { id: "events", name: "Events", icon: Calendar, color: "text-purple-600" },
    { id: "clubs", name: "Clubs", icon: Users, color: "text-green-600" },
    { id: "sports", name: "Sports", icon: Trophy, color: "text-orange-600" },
    {
      id: "placement",
      name: "Placements",
      icon: Briefcase,
      color: "text-indigo-600",
    },
    {
      id: "academic",
      name: "Academic",
      icon: GraduationCap,
      color: "text-red-600",
    },
    {
      id: "wellness",
      name: "Wellness",
      icon: Heart,
      color: "text-pink-600",
    },
  ];

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.icon : Newspaper;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.color : "text-gray-600";
  };

  const filteredNews = newsItems
    .filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory)
        return false;
      if (
        searchTerm &&
        !item.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !item.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !item.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.likes + b.comments - (a.likes + a.comments);
        case "viewed":
          return b.views - a.views;
        default: // latest
          return b.publishedAt.getTime() - a.publishedAt.getTime();
      }
    });

  const pinnedNews = filteredNews.filter((item) => item.isPinned);
  const regularNews = filteredNews.filter((item) => !item.isPinned);

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
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
              <Newspaper className="h-8 w-8 text-purple-600 mx-auto mb-2" />
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-blue-50/30">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link to="/student">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Campus News 📰
          </h1>
          <p className="text-gray-600">
            Stay updated with the latest happenings around campus
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const count = newsItems.filter(
                    (item) =>
                      category.id === "all" || item.category === category.id,
                  ).length;

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
                              : category.color
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

            {/* Trending Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trending Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    "technology",
                    "sports",
                    "placements",
                    "events",
                    "achievement",
                    "competition",
                    "wellness",
                    "scholarship",
                  ].map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-purple-50 hover:border-purple-200"
                      onClick={() => setSearchTerm(tag)}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Sidebar Ad */}
            {activeAds
              .filter((ad) => ad.placement === "sidebar")
              .slice(0, 1)
              .map((ad) => (
                <AdCard key={ad.id} ad={ad} />
              ))}

            {/* News-related Inline Ad */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 relative">
              <div className="flex items-center justify-between mb-3">
                <Badge className="bg-blue-600 text-white text-xs">
                  Sponsored
                </Badge>
                <button className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                📚 Study Resources
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Access premium study materials and notes for all subjects.
                Student discount available.
              </p>
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Browse Materials
              </Button>
            </div>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">This Week</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">New Articles</span>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Views</span>
                  <span className="font-medium">12.5K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Most Popular</span>
                  <span className="font-medium text-purple-600">Events</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search news, events, or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Latest</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="viewed">Most Viewed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Pinned News */}
            {pinnedNews.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  📌 Pinned News
                </h2>
                <div className="grid gap-4">
                  {pinnedNews.map((item) => {
                    const CategoryIcon = getCategoryIcon(item.category);
                    return (
                      <Card
                        key={item.id}
                        className="border-2 border-yellow-200 bg-yellow-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row gap-4">
                            {item.image && (
                              <div className="md:w-48 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                  <CategoryIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                  <span className="text-xs text-purple-600">
                                    Image
                                  </span>
                                </div>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <CategoryIcon
                                    className={`h-5 w-5 ${getCategoryColor(item.category)}`}
                                  />
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {item.category}
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Pinned
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Eye className="h-4 w-4" />
                                    <span>{item.views}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{getTimeAgo(item.publishedAt)}</span>
                                  </div>
                                </div>
                              </div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {item.title}
                              </h3>
                              <p className="text-gray-600 mb-3">
                                {item.excerpt}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <span className="text-sm text-gray-500">
                                    by {item.author}
                                  </span>
                                  <div className="flex space-x-1">
                                    {item.tags.slice(0, 3).map((tag) => (
                                      <Badge
                                        key={tag}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        #{tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3 text-sm text-gray-500">
                                  <button className="flex items-center space-x-1 hover:text-red-600 transition-colors">
                                    <ThumbsUp className="h-4 w-4" />
                                    <span>{item.likes}</span>
                                  </button>
                                  <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                                    <MessageCircle className="h-4 w-4" />
                                    <span>{item.comments}</span>
                                  </button>
                                  <button className="flex items-center space-x-1 hover:text-green-600 transition-colors">
                                    <Share className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Regular News */}
            <div className="space-y-4">
              {pinnedNews.length > 0 && (
                <h2 className="text-xl font-semibold text-gray-900">
                  Latest News
                </h2>
              )}
              <div className="grid gap-6">
                {regularNews.map((item, index) => {
                  const CategoryIcon = getCategoryIcon(item.category);
                  const shouldShowAd =
                    index === 2 &&
                    activeAds.filter((ad) => ad.placement === "inline-card")
                      .length > 0;

                  return (
                    <div key={item.id}>
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
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row gap-4">
                            {item.image && (
                              <div className="md:w-40 h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                  <CategoryIcon className="h-6 w-6 text-gray-600 mx-auto mb-1" />
                                  <span className="text-xs text-gray-600">
                                    Image
                                  </span>
                                </div>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <CategoryIcon
                                    className={`h-4 w-4 ${getCategoryColor(item.category)}`}
                                  />
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {item.category}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Eye className="h-4 w-4" />
                                    <span>{item.views}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{getTimeAgo(item.publishedAt)}</span>
                                  </div>
                                </div>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {item.title}
                              </h3>
                              <p className="text-gray-600 mb-3">
                                {item.excerpt}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <span className="text-sm text-gray-500">
                                    by {item.author}
                                  </span>
                                  <div className="flex space-x-1">
                                    {item.tags.slice(0, 2).map((tag) => (
                                      <Badge
                                        key={tag}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        #{tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3 text-sm text-gray-500">
                                  <button className="flex items-center space-x-1 hover:text-red-600 transition-colors">
                                    <ThumbsUp className="h-4 w-4" />
                                    <span>{item.likes}</span>
                                  </button>
                                  <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                                    <MessageCircle className="h-4 w-4" />
                                    <span>{item.comments}</span>
                                  </button>
                                  <button className="flex items-center space-x-1 hover:text-green-600 transition-colors">
                                    <Share className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>

              {filteredNews.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Newspaper className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No News Found
                    </h3>
                    <p className="text-gray-600">
                      Try adjusting your search or filter criteria
                    </p>
                  </CardContent>
                </Card>
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
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 relative">
                <div className="flex items-center justify-between">
                  <Badge className="bg-blue-600 text-white text-xs absolute top-2 left-2">
                    Sponsored
                  </Badge>
                  <button
                    onClick={() => handleAdClick(ad)}
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
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    {ad.callToAction || "Learn More"}
                  </Button>
                </div>
              </div>
            </div>
          ))}

        {/* Floating News-related Ad */}
        {activeAds
          .filter((ad) => ad.placement === "floating-cta")
          .slice(0, 1)
          .map((ad) => (
            <div key={ad.id} className="fixed bottom-4 left-4 z-50 max-w-sm">
              <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-4 relative">
                <button
                  onClick={() => handleAdClick(ad)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
                <Badge className="bg-blue-600 text-white text-xs mb-2">
                  Sponsored
                </Badge>
                <h4 className="font-semibold text-gray-900 mb-2">{ad.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{ad.description}</p>
                <Button
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700"
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
