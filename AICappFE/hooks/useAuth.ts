import { useEffect, useState } from "react";
import { AuthService, User } from "../services/AuthService";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      console.log("🔍 Checking auth status...");

      const loggedIn = await AuthService.isLoggedIn();
      const userData = await AuthService.getUser();
      const token = await AuthService.getToken();

      console.log("📊 Auth Status:", {
        isLoggedIn: loggedIn,
        hasUser: !!userData,
        hasToken: !!token,
        user: userData ? { id: userData.id, email: userData.email } : null,
      });

      setIsLoggedIn(loggedIn);
      setUser(userData);
    } catch (error) {
      console.error("❌ Error checking auth status:", error);
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refreshAuthStatus = () => {
    checkAuthStatus();
  };

  return {
    user,
    isLoading,
    isLoggedIn,
    logout,
    refreshAuthStatus,
  };
}
