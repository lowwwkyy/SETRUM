import { AuthService } from "./AuthService";
import { Platform } from "react-native";

// Fungsi untuk mendapatkan API Base URL yang tepat untuk Expo
const getApiBaseUrl = (): string => {
  if (__DEV__) {
    // Untuk development dengan Expo
    if (Platform.OS === "web") {
      // Web (Expo Web) - bisa gunakan localhost
      return "http://localhost:3000/api";
    } else {
      // Mobile (iOS/Android) dengan Expo - menggunakan ngrok
      return "https://1ea4168934f3.ngrok-free.app/api";
    }
  } else {
    // Production - URL production yang sama
    return "https://1ea4168934f3.ngrok-free.app/api";
  }
};

const API_BASE_URL = getApiBaseUrl();

export interface Budget {
  _id: string;
  userId: string;
  year: number;
  month: number;
  amount: number;
  pricePerKwh?: number;
  currency?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export class BudgetService {
  private static async getAuthToken(): Promise<string | null> {
    return await AuthService.getToken();
  }

  static async getUserBudget(): Promise<Budget | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("No auth token found");
      }

      // Get current date for year and month
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

      const response = await fetch(
        `${API_BASE_URL}/budget?year=${year}&month=${month}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data;
      } else if (response.status === 404) {
        // No budget found
        return null;
      } else {
        // Handle authentication errors
        if (response.status === 401) {
          console.log("🔒 Budget API: Token invalid, clearing auth data...");
          await AuthService.logout();
          throw new Error("Authentication expired. Please login again.");
        }
        throw new Error("Failed to fetch budget");
      }
    } catch (error) {
      console.error("Error fetching budget:", error);
      return null;
    }
  }

  static async createBudget(amount: number): Promise<Budget> {
    try {
      console.log("🏦 BudgetService.createBudget called with amount:", amount);
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("No auth token found");
      }

      // Get current date for year and month
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

      console.log("🏦 Creating budget for:", { year, month, amount });

      const response = await fetch(`${API_BASE_URL}/budget`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year,
          month,
          amount,
        }),
      });

      console.log("🏦 Create budget response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("🏦 Create budget success:", data);
        return data;
      } else {
        const errorText = await response.text();
        console.log("🏦 Create budget error response:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`
          );
        }
        throw new Error(errorData.message || "Failed to create budget");
      }
    } catch (error) {
      console.error("🏦 Error creating budget:", error);
      throw error;
    }
  }

  static async updateBudget(budgetId: string, amount: number): Promise<Budget> {
    try {
      console.log("🏦 BudgetService.updateBudget called with:", {
        budgetId,
        amount,
      });
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("No auth token found");
      }

      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      console.log("🏦 Updating budget for:", { year, month, amount });

      // Use POST method as backend uses the same endpoint for create and update
      const response = await fetch(`${API_BASE_URL}/budget`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year,
          month,
          amount,
        }),
      });

      console.log("🏦 Update budget response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("🏦 Update budget success:", data);
        return data;
      } else {
        const errorText = await response.text();
        console.log("🏦 Update budget error response:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`
          );
        }
        throw new Error(errorData.message || "Failed to update budget");
      }
    } catch (error) {
      console.error("🏦 Error updating budget:", error);
      throw error;
    }
  }

  static async hasBudget(): Promise<boolean> {
    try {
      const budget = await this.getUserBudget();
      return budget !== null;
    } catch (error) {
      console.error("Error checking budget:", error);
      return false;
    }
  }
}
