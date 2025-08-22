import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  provider: "google" | "email";
}

const AUTH_STORAGE_KEY = "@auth_user";
const TOKEN_STORAGE_KEY = "@auth_token";

export class AuthService {
  static async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Error saving user:", error);
    }
  }

  static async getUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  }

  static async saveToken(token: string): Promise<void> {
    try {
      console.log(
        "💾 Saving token to storage:",
        token.substring(0, 50) + "..."
      );
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      console.log("✅ Token saved successfully");
    } catch (error) {
      console.error("Error saving token:", error);
    }
  }

  static async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      console.log(
        "🔑 Retrieved token from storage:",
        token ? "EXISTS" : "NULL"
      );
      if (token) {
        console.log("🔑 Token preview:", token.substring(0, 50) + "...");
      }
      return token;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }

  static async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([AUTH_STORAGE_KEY, TOKEN_STORAGE_KEY]);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }

  static async isLoggedIn(): Promise<boolean> {
    try {
      console.log("🔐 Checking if user is logged in...");

      const user = await this.getUser();
      const token = await this.getToken();

      console.log(
        "👤 User data:",
        user
          ? { id: user.id, email: user.email, provider: user.provider }
          : "null"
      );
      console.log("🎫 Token:", token ? "exists" : "null");

      if (!user || !token) {
        console.log("❌ Missing user or token");
        return false;
      }

      // Check if token is expired
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const isExpired = payload.exp < currentTime;

        if (isExpired) {
          console.log("⏰ Token is expired, clearing auth data...");
          await this.logout();
          return false;
        }

        console.log("✅ Token is still valid");
      } catch {
        console.log("❌ Invalid token format, clearing auth data...");
        await this.logout();
        return false;
      }

      const isLoggedIn = !!(user && token);
      console.log("✅ IsLoggedIn result:", isLoggedIn);

      return isLoggedIn;
    } catch (error) {
      console.error("❌ Error checking login status:", error);
      return false;
    }
  }
}

// API Service untuk backend communication
export class ApiService {
  // Fungsi untuk mendapatkan BASE_URL yang tepat untuk Expo
  private static getBaseUrl(): string {
    if (__DEV__) {
      // Untuk development dengan Expo
      if (Platform.OS === "web") {
        // Web (Expo Web) - bisa gunakan localhost
        return "http://localhost:3000";
      } else {
        // Mobile (iOS/Android) dengan Expo - menggunakan ngrok
        return "https://1ea4168934f3.ngrok-free.app";
      }
    } else {
      // Production - URL production yang sama
      return "https://1ea4168934f3.ngrok-free.app";
    }
  }
  static readonly BASE_URL = ApiService.getBaseUrl();

  static async loginWithGoogle(
    idToken: string
  ): Promise<{ user: User; token: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/auth/google/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      return {
        user: {
          id: data.user.id,
          name: data.user.displayName,
          email: data.user.email,
          provider: "google",
        },
        token: data.token,
      };
    } catch (error) {
      console.error("Google login API error:", error);
      throw error;
    }
  }

  static async loginWithEmail(
    email: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    try {
      console.log("🚀 Attempting login to:", this.BASE_URL);
      console.log("📧 Email:", email);

      const response = await fetch(`${this.BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log("❌ Error response:", errorData);
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      console.log("✅ Login successful:", {
        userId: data.userId,
        displayName: data.displayName,
      });

      return {
        user: {
          id: data.userId,
          name: data.displayName,
          email: email,
          provider: "email",
        },
        token: data.token,
      };
    } catch (error) {
      console.error("Email login API error:", error);
      throw error;
    }
  }

  static async registerWithEmail(
    email: string,
    password: string,
    displayName: string
  ): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          displayName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Registration API error:", error);
      throw error;
    }
  }

  static async refreshToken(token: string): Promise<{ token: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Token refresh API error:", error);
      throw error;
    }
  }
}
