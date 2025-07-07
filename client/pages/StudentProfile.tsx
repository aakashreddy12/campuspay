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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Eye,
  EyeOff,
  Save,
  Camera,
  Edit,
  Lock,
  Bell,
  CreditCard,
  Heart,
  Users,
  BookOpen,
  Home,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { User as UserType } from "@shared/api";
import { supabase } from "@/lib/supabase";

export default function StudentProfile() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    college: user?.college || "",
    course: user?.course || "",
    year: user?.year || 1,
    gender: user?.gender || "",
    ageGroup: user?.ageGroup || "",
    residenceType: user?.residenceType || "",
    hostelBlock: user?.hostelBlock || "",
    interests: user?.interests || [],
    parentContact: user?.parentContact || "",
    emergencyContact: user?.emergencyContact || "",
    bio: "",
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    showLocation: true,
    dataCollection: true,
    personalizedAds: user?.adConsent || false,
    notifications: {
      email: true,
      push: true,
      sms: false,
      wallet: true,
      promotions: true,
      news: true,
      events: true,
    },
    shareAnalytics: true,
    allowFriendRequests: true,
    showOnlineStatus: true,
  });

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      console.log("Updating profile for user:", user.id);
      console.log("Profile data:", profileData);

      // Update user profile in Supabase
      const { data, error } = await supabase
        .from("users")
        .update({
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          college: profileData.college,
          course: profileData.course,
          year: profileData.year,
          gender: profileData.gender,
          parent_contact: profileData.parentContact,
          ad_consent: privacySettings.personalizedAds,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        setSaveError(error.message || "Failed to update profile");
        return;
      }

      console.log("Profile updated successfully:", data);

      // Update local user state
      const updatedUser = {
        ...user,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        college: profileData.college,
        course: profileData.course,
        year: profileData.year,
        gender: profileData.gender,
        parentContact: profileData.parentContact,
        adConsent: privacySettings.personalizedAds,
      };

      setUser(updatedUser);
      localStorage.setItem("campuspay_user", JSON.stringify(updatedUser));

      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Unexpected error saving profile:", {
        message: error?.message,
        stack: error?.stack,
        error: error,
      });
      setSaveError(error?.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const interestOptions = [
    "Technology",
    "Sports",
    "Music",
    "Arts",
    "Food",
    "Travel",
    "Photography",
    "Gaming",
    "Reading",
    "Dancing",
    "Fitness",
    "Movies",
    "Fashion",
    "Cooking",
    "Business",
    "Science",
  ];

  const toggleInterest = (interest: string) => {
    setProfileData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            My Profile 👤
          </h1>
          <p className="text-gray-600">
            Manage your personal information and privacy settings
          </p>
        </div>

        {saveSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <Save className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Profile updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {saveError && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Error updating profile: {saveError}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                {/* Profile Picture */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <Avatar className="w-24 h-24 mx-auto">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-lg mt-3">{user.name}</h3>
                  <div className="flex items-center justify-center space-x-2 mt-1">
                    <Badge variant="secondary">{user.course}</Badge>
                    <Badge variant="outline">Year {user.year}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{user.college}</p>
                </div>

                {/* Navigation */}
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab("personal")}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                      activeTab === "personal"
                        ? "bg-blue-100 text-blue-900 border border-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <span>Personal Info</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("privacy")}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                      activeTab === "privacy"
                        ? "bg-blue-100 text-blue-900 border border-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <Shield className="h-5 w-5" />
                    <span>Privacy Settings</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                      activeTab === "notifications"
                        ? "bg-blue-100 text-blue-900 border border-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("security")}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                      activeTab === "security"
                        ? "bg-blue-100 text-blue-900 border border-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <Lock className="h-5 w-5" />
                    <span>Security</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Personal Information Tab */}
            {activeTab === "personal" && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Update your personal details and preferences
                      </CardDescription>
                    </div>
                    <Button
                      variant={isEditing ? "outline" : "default"}
                      onClick={() => {
                        setIsEditing(!isEditing);
                        setSaveError(null);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditing ? "Cancel" : "Edit Profile"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            name: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            email: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            phone: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={profileData.gender}
                        onValueChange={(value) =>
                          setProfileData({ ...profileData, gender: value })
                        }
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">
                            Prefer not to say
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Academic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="college">College</Label>
                        <Input
                          id="college"
                          value={profileData.college}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              college: e.target.value,
                            })
                          }
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="course">Course</Label>
                        <Input
                          id="course"
                          value={profileData.course}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              course: e.target.value,
                            })
                          }
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Select
                          value={profileData.year.toString()}
                          onValueChange={(value) =>
                            setProfileData({
                              ...profileData,
                              year: parseInt(value),
                            })
                          }
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Year 1</SelectItem>
                            <SelectItem value="2">Year 2</SelectItem>
                            <SelectItem value="3">Year 3</SelectItem>
                            <SelectItem value="4">Year 4</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Residence Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Residence Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="ageGroup">Age Group</Label>
                        <Select
                          value={profileData.ageGroup}
                          onValueChange={(value) =>
                            setProfileData({ ...profileData, ageGroup: value })
                          }
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select age group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="18-20">18-20 years</SelectItem>
                            <SelectItem value="21-23">21-23 years</SelectItem>
                            <SelectItem value="24+">24+ years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="residenceType">Residence Type</Label>
                        <Select
                          value={profileData.residenceType}
                          onValueChange={(value) =>
                            setProfileData({
                              ...profileData,
                              residenceType: value,
                            })
                          }
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select residence type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hostel">Hostel</SelectItem>
                            <SelectItem value="day-scholar">
                              Day Scholar
                            </SelectItem>
                            <SelectItem value="pg">PG/Rental</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {profileData.residenceType === "hostel" && (
                        <div className="space-y-2">
                          <Label htmlFor="hostelBlock">Hostel Block</Label>
                          <Input
                            id="hostelBlock"
                            value={profileData.hostelBlock}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                hostelBlock: e.target.value,
                              })
                            }
                            disabled={!isEditing}
                            placeholder="e.g., A Block, B Block"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Emergency Contacts
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="parentContact">Parent Contact</Label>
                        <Input
                          id="parentContact"
                          value={profileData.parentContact}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              parentContact: e.target.value,
                            })
                          }
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContact">
                          Emergency Contact
                        </Label>
                        <Input
                          id="emergencyContact"
                          value={profileData.emergencyContact}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              emergencyContact: e.target.value,
                            })
                          }
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Interests */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Interests</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {interestOptions.map((interest) => (
                        <button
                          key={interest}
                          onClick={() => isEditing && toggleInterest(interest)}
                          disabled={!isEditing}
                          className={`p-3 rounded-lg border text-sm transition-all ${
                            profileData.interests.includes(interest)
                              ? "bg-blue-100 border-blue-300 text-blue-900"
                              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                          } ${!isEditing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) =>
                        setProfileData({ ...profileData, bio: e.target.value })
                      }
                      disabled={!isEditing}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Privacy Settings Tab */}
            {activeTab === "privacy" && (
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>
                    Control how your information is shared and used
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Visibility */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Profile Visibility
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Show email address</p>
                          <p className="text-sm text-gray-600">
                            Let others see your email address
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.showEmail}
                          onCheckedChange={(checked) =>
                            setPrivacySettings({
                              ...privacySettings,
                              showEmail: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Show phone number</p>
                          <p className="text-sm text-gray-600">
                            Let others see your phone number
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.showPhone}
                          onCheckedChange={(checked) =>
                            setPrivacySettings({
                              ...privacySettings,
                              showPhone: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Show location</p>
                          <p className="text-sm text-gray-600">
                            Let others see your college and residence info
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.showLocation}
                          onCheckedChange={(checked) =>
                            setPrivacySettings({
                              ...privacySettings,
                              showLocation: checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Data Usage */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Data Usage</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            Personalized advertisements
                          </p>
                          <p className="text-sm text-gray-600">
                            Show ads based on your interests and behavior
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.personalizedAds}
                          onCheckedChange={(checked) =>
                            setPrivacySettings({
                              ...privacySettings,
                              personalizedAds: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Data collection</p>
                          <p className="text-sm text-gray-600">
                            Allow collection of usage data for platform
                            improvement
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.dataCollection}
                          onCheckedChange={(checked) =>
                            setPrivacySettings({
                              ...privacySettings,
                              dataCollection: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Share analytics</p>
                          <p className="text-sm text-gray-600">
                            Share anonymized usage analytics with advertisers
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.shareAnalytics}
                          onCheckedChange={(checked) =>
                            setPrivacySettings({
                              ...privacySettings,
                              shareAnalytics: checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Social Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Allow friend requests</p>
                          <p className="text-sm text-gray-600">
                            Let other students send you friend requests
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.allowFriendRequests}
                          onCheckedChange={(checked) =>
                            setPrivacySettings({
                              ...privacySettings,
                              allowFriendRequests: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Show online status</p>
                          <p className="text-sm text-gray-600">
                            Let others see when you're active on the platform
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.showOnlineStatus}
                          onCheckedChange={(checked) =>
                            setPrivacySettings({
                              ...privacySettings,
                              showOnlineStatus: checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Notification Methods
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email notifications</p>
                          <p className="text-sm text-gray-600">
                            Receive notifications via email
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.notifications.email}
                          onCheckedChange={(checked) =>
                            setPrivacySettings({
                              ...privacySettings,
                              notifications: {
                                ...privacySettings.notifications,
                                email: checked,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Push notifications</p>
                          <p className="text-sm text-gray-600">
                            Receive push notifications on your device
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.notifications.push}
                          onCheckedChange={(checked) =>
                            setPrivacySettings({
                              ...privacySettings,
                              notifications: {
                                ...privacySettings.notifications,
                                push: checked,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">SMS notifications</p>
                          <p className="text-sm text-gray-600">
                            Receive important notifications via SMS
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.notifications.sms}
                          onCheckedChange={(checked) =>
                            setPrivacySettings({
                              ...privacySettings,
                              notifications: {
                                ...privacySettings.notifications,
                                sms: checked,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Notification Types
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Wallet notifications</p>
                          <p className="text-sm text-gray-600">
                            Transaction alerts and low balance warnings
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.notifications.wallet}
                          onCheckedChange={(checked) =>
                            setPrivacySettings({
                              ...privacySettings,
                              notifications: {
                                ...privacySettings.notifications,
                                wallet: checked,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Campus events</p>
                          <p className="text-sm text-gray-600">
                            Notifications about upcoming campus events
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.notifications.events}
                          onCheckedChange={(checked) =>
                            setPrivacySettings({
                              ...privacySettings,
                              notifications: {
                                ...privacySettings.notifications,
                                events: checked,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Campus news</p>
                          <p className="text-sm text-gray-600">
                            Latest news and announcements
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.notifications.news}
                          onCheckedChange={(checked) =>
                            setPrivacySettings({
                              ...privacySettings,
                              notifications: {
                                ...privacySettings.notifications,
                                news: checked,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Promotional offers</p>
                          <p className="text-sm text-gray-600">
                            Special offers and discounts from campus vendors
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.notifications.promotions}
                          onCheckedChange={(checked) =>
                            setPrivacySettings({
                              ...privacySettings,
                              notifications: {
                                ...privacySettings.notifications,
                                promotions: checked,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Account Security</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Change Password</p>
                          <p className="text-sm text-gray-600">
                            Update your account password
                          </p>
                        </div>
                        <Button variant="outline">Change Password</Button>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            Two-Factor Authentication
                          </p>
                          <p className="text-sm text-gray-600">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Button variant="outline">Enable 2FA</Button>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Login Sessions</p>
                          <p className="text-sm text-gray-600">
                            Manage active login sessions
                          </p>
                        </div>
                        <Button variant="outline">View Sessions</Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Data Management</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Download My Data</p>
                          <p className="text-sm text-gray-600">
                            Get a copy of your personal data
                          </p>
                        </div>
                        <Button variant="outline">Request Data</Button>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50">
                        <div>
                          <p className="font-medium text-red-900">
                            Delete Account
                          </p>
                          <p className="text-sm text-red-600">
                            Permanently delete your account and all data
                          </p>
                        </div>
                        <Button variant="destructive">Delete Account</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
