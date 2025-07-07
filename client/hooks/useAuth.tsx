import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, UserRole, LoginRequest, LoginResponse } from "@shared/api";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth on app load
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // Check if there's an active Supabase Auth session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
        localStorage.removeItem("campuspay_user");
        return;
      }

      if (session?.user) {
        // Get user profile from users table
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profileError || !userProfile) {
          console.error("Error fetching user profile:", profileError);
          localStorage.removeItem("campuspay_user");
          return;
        }

        const user: User = {
          id: userProfile.id,
          email: userProfile.email || session.user.email,
          phone: userProfile.phone,
          role: userProfile.role,
          name: userProfile.name,
          college: userProfile.college,
          course: userProfile.course,
          year: userProfile.year,
          gender: userProfile.gender,
          walletBalance: userProfile.wallet_balance,
          rfidId: userProfile.rfid_id,
          collegeId: userProfile.college_id,
          rewardPoints: userProfile.reward_points,
          adConsent: userProfile.ad_consent,
          parentContact: userProfile.parent_contact,
          vendorId: userProfile.vendor_id,
          createdAt: new Date(userProfile.created_at),
        };

        setUser(user);
        localStorage.setItem("campuspay_user", JSON.stringify(user));
      } else {
        // No session, check localStorage as fallback
        const storedUser = localStorage.getItem("campuspay_user");
        if (storedUser) {
          localStorage.removeItem("campuspay_user"); // Clear stale data
        }
      }
    } catch (error) {
      console.error("Check user error:", error);
      localStorage.removeItem("campuspay_user");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Authenticate with Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: credentials.identifier,
          password: credentials.password,
        });

      if (authError) {
        console.error("Authentication failed:", authError.message);
        return false;
      }

      if (!authData.user) {
        console.error("No user data returned from authentication");
        return false;
      }

      // Get user profile from users table
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        return false;
      }

      if (!userProfile) {
        console.error("User profile not found in users table");
        return false;
      }

      const user: User = {
        id: userProfile.id,
        email: userProfile.email || authData.user.email,
        phone: userProfile.phone,
        role: userProfile.role,
        name: userProfile.name,
        college: userProfile.college,
        course: userProfile.course,
        year: userProfile.year,
        gender: userProfile.gender,
        walletBalance: userProfile.wallet_balance,
        rfidId: userProfile.rfid_id,
        collegeId: userProfile.college_id,
        rewardPoints: userProfile.reward_points,
        adConsent: userProfile.ad_consent,
        parentContact: userProfile.parent_contact,
        vendorId: userProfile.vendor_id,
        createdAt: new Date(userProfile.created_at),
      };

      setUser(user);
      localStorage.setItem("campuspay_user", JSON.stringify(user));
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("campuspay_user");
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
