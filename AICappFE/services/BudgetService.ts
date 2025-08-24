import { AuthService } from "./AuthService";
import { Platform } from "react-native";

const getApiBaseUrl = (): string => {
  if (__DEV__) {
    if (Platform.OS === "web") {
      return "http://localhost:3000/api";
    } else {
      return "https://1bde337fa39d.ngrok-free.app/api";
    }
  } else {
    return "https://1bde337fa39d.ngrok-free.app/api";
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

      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

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
        return null;
      } else {
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

      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

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
