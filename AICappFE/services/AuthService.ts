import AsyncStorage from "@react-native-async-storage/async-storage";

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
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch (error) {
      console.error("Error saving token:", error);
    }
  }

  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
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
      const user = await this.getUser();
      const token = await this.getToken();
      return !!(user && token);
    } catch (error) {
      console.error("Error checking login status:", error);
      return false;
    }
  }
}

// API Service untuk backend communication
export class ApiService {
  static readonly BASE_URL = "https://your-backend-api.com"; // Ganti dengan URL backend Anda

  static async loginWithGoogle(
    accessToken: string,
    userInfo: any
  ): Promise<{ user: User; token: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          userInfo,
        }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      return data;
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

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Email login API error:", error);
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
