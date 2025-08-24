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
      // Mobile (iOS/Android) dengan Expo - menggunakan ngrok URL terbaru
      return "https://1bde337fa39d.ngrok-free.app/api";
    }
  } else {
    // Production - URL production yang sama
    return "https://1bde337fa39d.ngrok-free.app/api";
  }
};

const API_BASE_URL = getApiBaseUrl();

export interface DailyRecommendation {
  currentUsage: number;
  recommendedUsage: number;
  dailyBudget: number;
  recommendations: string[];
  status: "under_budget" | "on_track" | "over_budget";
  savings?: number;
  overspending?: number;
}

export interface BudgetForecast {
  monthly_forecast: number[];
  predictions: {
    next_month: number;
    confidence_interval: [number, number];
  };
  recommendations: string[];
  model_info: {
    model_type: string;
    accuracy: number;
  };
}

export class ForecastService {
  private static async getAuthToken(): Promise<string | null> {
    return await AuthService.getToken();
  }

  static async getDailyRecommendation(
    currentUsage: number,
    monthlyBudget: number
  ): Promise<DailyRecommendation> {
    try {
      console.log("🤖 ForecastService - Getting daily recommendation...");
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await fetch(`${API_BASE_URL}/forecast/daily`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          currentUsage,
          monthlyBudget,
        }),
      });

      console.log("🤖 Daily recommendation response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("🤖 Daily recommendation success:", data);

        // Backend returns: { success: true, horizonDays: 1, forecast: [{ date: "...", daily_recommendation: number }] }
        // Convert to DailyRecommendation interface
        if (data.success && data.forecast && data.forecast.length > 0) {
          const forecastData = data.forecast[0];
          const recommendedUsage = forecastData.daily_recommendation || 0;
          const dailyBudget = monthlyBudget / 30;

          // Determine status based on usage vs budget
          let status: "under_budget" | "on_track" | "over_budget" = "on_track";
          const currentCost = currentUsage * 1700;

          if (currentCost < dailyBudget * 0.8) {
            status = "under_budget";
          } else if (currentCost > dailyBudget * 1.1) {
            status = "over_budget";
          }

          // Generate recommendations based on status
          let recommendations: string[] = [];
          let savings: number | undefined;
          let overspending: number | undefined;

          if (status === "under_budget") {
            savings = dailyBudget - currentCost;
            recommendations = [
              "Great job! You're using energy efficiently.",
              "Consider investing in energy-efficient appliances with your savings.",
              "Maintain current usage patterns to stay within budget.",
            ];
          } else if (status === "over_budget") {
            overspending = currentCost - dailyBudget;
            recommendations = [
              "Consider reducing air conditioning usage by 2-3 hours daily to save approximately IDR 200-300 per day.",
              "Switch to energy-efficient LED bulbs in high-usage areas to reduce lighting costs by 20-30%.",
              "Optimize your refrigerator temperature to 3-4°C to maintain efficiency while reducing energy consumption.",
            ];
          } else {
            recommendations = [
              "You're on track with your energy budget.",
              "Consider small optimizations like unplugging unused devices.",
              "Monitor high-consumption appliances during peak hours.",
            ];
          }

          const result: DailyRecommendation = {
            currentUsage,
            recommendedUsage,
            dailyBudget,
            recommendations,
            status,
          };

          if (savings !== undefined) result.savings = savings;
          if (overspending !== undefined) result.overspending = overspending;

          return result;
        }

        // Fallback if response format is unexpected
        throw new Error("Invalid response format from server");
      } else {
        const errorText = await response.text();
        console.log("🤖 Daily recommendation error response:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`
          );
        }
        throw new Error(
          errorData.message || "Failed to get daily recommendation"
        );
      }
    } catch (error) {
      console.error("🤖 Error getting daily recommendation:", error);

      // Fallback to simple calculation if API fails
      const daysInMonth = 30;
      const dailyBudget = monthlyBudget / daysInMonth;
      const recommendedUsage = dailyBudget / 1700; // Convert IDR to kWh

      return {
        currentUsage,
        recommendedUsage,
        dailyBudget,
        recommendations: [
          currentUsage > recommendedUsage
            ? "Consider reducing usage to stay within budget"
            : "You're on track with your energy consumption",
        ],
        status: currentUsage > recommendedUsage ? "over_budget" : "on_track",
        overspending:
          currentUsage > recommendedUsage
            ? (currentUsage - recommendedUsage) * 1700
            : undefined,
        savings:
          currentUsage < recommendedUsage
            ? (recommendedUsage - currentUsage) * 1700
            : undefined,
      };
    }
  }

  static async getBudgetForecast(): Promise<BudgetForecast> {
    try {
      console.log("🤖 ForecastService - Getting budget forecast...");
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await fetch(`${API_BASE_URL}/forecast/budget`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      console.log("🤖 Budget forecast response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("🤖 Budget forecast success:", data);
        return data;
      } else {
        const errorText = await response.text();
        console.log("🤖 Budget forecast error response:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`
          );
        }
        throw new Error(errorData.message || "Failed to get budget forecast");
      }
    } catch (error) {
      console.error("🤖 Error getting budget forecast:", error);
      throw error;
    }
  }
}
