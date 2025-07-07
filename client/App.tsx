import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import StudentDashboard from "./pages/StudentDashboard";
import StudentWallet from "./pages/StudentWallet";
import CampusNews from "./pages/CampusNews";
import StudentProfile from "./pages/StudentProfile";
import ScanAndPay from "./pages/ScanAndPay";
import StudentCoupons from "./pages/StudentCoupons";
import VendorDashboard from "./pages/VendorDashboard";
import VendorReports from "./pages/VendorReports";
import StorekeeperDashboard from "./pages/StorekeeperDashboard";
import AdvertiserDashboard from "./pages/AdvertiserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/wallet"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentWallet />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/news"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <CampusNews />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/scan-pay"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <ScanAndPay />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/coupons"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentCoupons />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor"
        element={
          <ProtectedRoute allowedRoles={["vendor"]}>
            <VendorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/reports"
        element={
          <ProtectedRoute allowedRoles={["vendor"]}>
            <VendorReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/storekeeper"
        element={
          <ProtectedRoute allowedRoles={["storekeeper"]}>
            <StorekeeperDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advertiser"
        element={
          <ProtectedRoute allowedRoles={["advertiser"]}>
            <AdvertiserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
