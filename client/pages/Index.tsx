import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Wallet,
  Store,
  Megaphone,
  Settings,
  Users,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";
import { UserRole } from "@shared/api";

export default function Index() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login({ identifier, password, role });
      if (success) {
        // Navigate based on role
        switch (role) {
          case "student":
            navigate("/student");
            break;
          case "vendor":
            navigate("/vendor");
            break;
          case "storekeeper":
            navigate("/storekeeper");
            break;
          case "advertiser":
            navigate("/advertiser");
            break;
          case "admin":
            navigate("/admin");
            break;
        }
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    {
      value: "student" as UserRole,
      label: "Student",
      icon: Wallet,
      description: "Access your campus wallet and make payments",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      value: "vendor" as UserRole,
      label: "Vendor",
      icon: Store,
      description: "Manage your store and accept payments",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      value: "storekeeper" as UserRole,
      label: "Storekeeper",
      icon: Users,
      description: "POS system and inventory management",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      value: "advertiser" as UserRole,
      label: "Advertiser",
      icon: Megaphone,
      description: "Create and manage ad campaigns",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      value: "admin" as UserRole,
      label: "Admin",
      icon: Settings,
      description: "Platform administration and analytics",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  const currentRoleOption = roleOptions.find((option) => option.value === role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="pt-8 pb-6">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <CreditCard className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              CampusPay
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The smart campus payment platform with NFC/RFID support, digital
            wallets, and targeted advertising
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-center">
          <div className="text-center p-4 flex flex-col justify-center -ml-px">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">NFC Payments</h3>
            <p className="text-sm text-gray-600">
              Fast, secure contactless transactions
            </p>
          </div>

          <div className="text-center p-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Secure & Reliable
            </h3>
            <p className="text-sm text-gray-600">
              Enterprise-grade security and analytics
            </p>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-md mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to access your CampusPay dashboard
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Login as</Label>
                  <Select
                    value={role}
                    onValueChange={(value: UserRole) => setRole(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center space-x-2">
                              <Icon className={`h-4 w-4 ${option.color}`} />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {currentRoleOption && (
                    <p className="text-xs text-gray-500">
                      {currentRoleOption.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="identifier">Email Address</Label>
                  <Input
                    id="identifier"
                    type="email"
                    placeholder="Enter your email address"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
