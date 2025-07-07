import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Wallet,
  Store,
  Megaphone,
  Settings,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getRoleIcon = () => {
    switch (user.role) {
      case "student":
        return <Wallet className="h-5 w-5" />;
      case "vendor":
        return <Store className="h-5 w-5" />;
      case "advertiser":
        return <Megaphone className="h-5 w-5" />;
      case "admin":
        return <Settings className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getRoleColor = () => {
    switch (user.role) {
      case "student":
        return "text-blue-600";
      case "vendor":
        return "text-green-600";
      case "advertiser":
        return "text-purple-600";
      case "admin":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <nav
      className={cn(
        "bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50",
        className,
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                CampusPay
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
              <div
                className={cn("flex items-center space-x-2", getRoleColor())}
              >
                {getRoleIcon()}
                <span className="text-sm font-medium capitalize">
                  {user.role}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user.name}</span>
                {user.walletBalance !== undefined && (
                  <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    ₹{user.walletBalance?.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              className="text-gray-600 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
