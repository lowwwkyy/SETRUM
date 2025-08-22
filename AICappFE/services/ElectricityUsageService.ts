import { AuthService } from "./AuthService";
import { Platform } from "react-native";
import { ElectricityUsage, Device, DeviceService } from "./DeviceService";

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

export interface UsageSummary {
  totalKwh: number;
  avgDailyKwh: number;
  peakDay: string;
  peakKwh: number;
  last7Days: ElectricityUsage[];
}

export interface DeviceUsageData {
  device: Device;
  usage: ElectricityUsage[];
  totalKwh: number;
  avgDailyKwh: number;
}

export class ElectricityUsageService {
  private static async getAuthToken(): Promise<string | null> {
    return await AuthService.getToken();
  }

  static async getUserUsage(): Promise<ElectricityUsage[]> {
    try {
      console.log("⚡ ElectricityUsageService - Fetching user usage...");
      const token = await this.getAuthToken();
      console.log("⚡ ElectricityUsageService - Token available:", !!token);

      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await fetch(`${API_BASE_URL}/usage`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log(
        "⚡ ElectricityUsageService - Response status:",
        response.status
      );
      console.log("⚡ ElectricityUsageService - Response ok:", response.ok);

      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          console.log("⚡ ElectricityUsageService - Success data:", data);
          return data.usage || data;
        } catch (jsonError: any) {
          console.error(
            "Invalid JSON response from usage service:",
            text.substring(0, 100)
          );
          console.error("JSON Parse Error:", jsonError.message);
          throw new Error("Server returned invalid JSON response");
        }
      } else {
        const text = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch {
          console.error(
            "Server error response (non-JSON):",
            text.substring(0, 100)
          );
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`
          );
        }
        console.log("⚡ ElectricityUsageService - Error response:", errorData);

        // Check for token invalid error
        if (
          response.status === 401 &&
          errorData.message === "Token is not valid"
        ) {
          throw { status: 401, message: "Token is not valid" };
        }

        throw new Error(errorData.message || "Failed to fetch usage data");
      }
    } catch (error) {
      console.error(
        "⚡ ElectricityUsageService - Error fetching usage data:",
        error
      );
      throw error;
    }
  }

  // Get usage data with optional filters
  static async getFilteredUsage(
    deviceId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ElectricityUsage[]> {
    try {
      console.log("⚡ ElectricityUsageService - Fetching filtered usage...", {
        deviceId,
        startDate,
        endDate,
      });
      const token = await this.getAuthToken();
      console.log("⚡ ElectricityUsageService - Token available:", !!token);

      if (!token) {
        throw new Error("No auth token found");
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (deviceId) params.append("deviceId", deviceId);
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());

      const queryString = params.toString();
      const url = `${API_BASE_URL}/usage${
        queryString ? `?${queryString}` : ""
      }`;

      console.log("⚡ ElectricityUsageService - Request URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log(
        "⚡ ElectricityUsageService - Filtered response status:",
        response.status
      );
      console.log(
        "⚡ ElectricityUsageService - Filtered response ok:",
        response.ok
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          "⚡ ElectricityUsageService - Filtered success data:",
          data
        );
        return data.usage || data;
      } else {
        const errorData = await response.json();
        console.log(
          "⚡ ElectricityUsageService - Filtered error response:",
          errorData
        );

        // Check for token invalid error
        if (
          response.status === 401 &&
          errorData.message === "Token is not valid"
        ) {
          throw { status: 401, message: "Token is not valid" };
        }

        throw new Error(
          errorData.message || "Failed to fetch filtered usage data"
        );
      }
    } catch (error) {
      console.error(
        "⚡ ElectricityUsageService - Error fetching filtered usage:",
        error
      );
      throw error;
    }
  }

  static async getUsageSummary(): Promise<UsageSummary> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await fetch(`${API_BASE_URL}/usage/summary`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch usage summary");
      }
    } catch (error) {
      console.error("Error fetching usage summary:", error);
      throw error;
    }
  }

  static async getDailyTotalKwh(): Promise<
    { date: string; totalKwh: number }[]
  > {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await fetch(`${API_BASE_URL}/usage/daily-total`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.dailyTotals || data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch daily totals");
      }
    } catch (error) {
      console.error("Error fetching daily totals:", error);
      throw error;
    }
  }

  static async getUsageByDateRange(
    startDate: string,
    endDate: string
  ): Promise<ElectricityUsage[]> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await fetch(
        `${API_BASE_URL}/usage/date-range?startDate=${startDate}&endDate=${endDate}`,
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
        return data.usage || data;
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch usage by date range"
        );
      }
    } catch (error) {
      console.error("Error fetching usage by date range:", error);
      throw error;
    }
  }

  static async getUsageByDevice(deviceId: string): Promise<ElectricityUsage[]> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await fetch(`${API_BASE_URL}/usage/device/${deviceId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.usage || data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch device usage");
      }
    } catch (error) {
      console.error("Error fetching device usage:", error);
      throw error;
    }
  }

  // Get chart data based on timeframe (1W, 1M, 3M)
  static async getChartDataByTimeFrame(
    timeFrame: "1W" | "1M" | "3M"
  ): Promise<{ day: number; highTmp: number }[]> {
    try {
      console.log("⚡ Getting chart data for timeframe:", timeFrame);

      // First check if user has any devices
      const devices = await DeviceService.getUserDevices();
      console.log("⚡ Found devices for chart:", devices.length);

      // If no devices, return empty data immediately
      if (devices.length === 0) {
        console.log("⚡ No devices found, returning empty chart data");
        const daysCount = timeFrame === "1W" ? 7 : timeFrame === "1M" ? 30 : 90;
        const emptyData: { day: number; highTmp: number }[] = [];
        for (let i = 1; i <= daysCount; i++) {
          emptyData.push({ day: i, highTmp: 0 });
        }
        return emptyData;
      }

      const endDate = new Date();
      let startDate = new Date();

      // Calculate start date based on timeframe
      switch (timeFrame) {
        case "1W":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "1M":
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case "3M":
          startDate.setMonth(endDate.getMonth() - 3);
          break;
      }

      console.log("⚡ Getting usage data for date range:", {
        startDate,
        endDate,
      });

      const usageData = await this.getFilteredUsage(
        undefined,
        startDate,
        endDate
      );

      console.log("⚡ Usage data retrieved:", usageData.length, "records");

      // Group usage data by date and sum daily kWh
      const dailyUsage = new Map<string, number>();

      usageData.forEach((usage) => {
        const date = new Date(usage.date).toISOString().split("T")[0];
        const currentTotal = dailyUsage.get(date) || 0;
        dailyUsage.set(date, currentTotal + usage.dailyKwh);
      });

      // Convert to chart format with proper day indexing based on timeframe
      const daysCount = timeFrame === "1W" ? 7 : timeFrame === "1M" ? 30 : 90;
      const chartData: { day: number; highTmp: number }[] = [];

      // Initialize array with correct number of days
      for (let i = 1; i <= daysCount; i++) {
        chartData.push({ day: i, highTmp: 0 });
      }

      // Fill in actual data where available
      const sortedDates = Array.from(dailyUsage.keys()).sort();

      sortedDates.forEach((date, index) => {
        // Only use data within the timeframe range
        if (index < daysCount) {
          chartData[index] = {
            day: index + 1,
            highTmp: dailyUsage.get(date) || 0,
          };
        }
      });

      // If no usage data found, return sample realistic data based on timeframe
      if (dailyUsage.size === 0) {
        console.log("⚡ No usage data found, generating sample data for chart");

        // Generate realistic sample data based on average device usage
        for (let i = 0; i < daysCount; i++) {
          const baseConsumption = 1.5; // Base 1.5 kWh per day
          const variation = Math.random() * 1.0; // Random variation up to 1 kWh
          const dailyKwh = baseConsumption + variation;

          chartData[i] = {
            day: i + 1,
            highTmp: parseFloat(dailyKwh.toFixed(3)),
          };
        }
      }

      console.log(
        `⚡ Chart data processed for ${timeFrame}: ${
          chartData.length
        } points, max day: ${Math.max(...chartData.map((d) => d.day))}`
      );
      console.log("⚡ Chart data sample:", chartData.slice(0, 3));
      return chartData;
    } catch (error) {
      console.error("Error getting chart data:", error);
      // Return sample data on error instead of empty data
      const daysCount = timeFrame === "1W" ? 7 : timeFrame === "1M" ? 30 : 90;
      const sampleData: { day: number; highTmp: number }[] = [];

      for (let i = 1; i <= daysCount; i++) {
        const baseConsumption = 1.2;
        const variation = Math.random() * 0.8;
        sampleData.push({
          day: i,
          highTmp: parseFloat((baseConsumption + variation).toFixed(3)),
        });
      }

      return sampleData;
    }
  }

  // Get device usage data with chart format
  static async getDeviceChartData(
    deviceId: string,
    timeFrame: "1W" | "1M" | "3M"
  ): Promise<{ day: number; highTmp: number }[]> {
    try {
      const endDate = new Date();
      let startDate = new Date();

      // Calculate start date based on timeframe
      switch (timeFrame) {
        case "1W":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "1M":
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case "3M":
          startDate.setMonth(endDate.getMonth() - 3);
          break;
      }

      console.log("⚡ Getting device chart data:", { deviceId, timeFrame });

      const usageData = await this.getFilteredUsage(
        deviceId,
        startDate,
        endDate
      );

      // Group usage data by date
      const dailyUsage = new Map<string, number>();

      usageData.forEach((usage) => {
        const date = new Date(usage.date).toISOString().split("T")[0];
        const currentTotal = dailyUsage.get(date) || 0;
        dailyUsage.set(date, currentTotal + usage.dailyKwh);
      });

      // Convert to chart format
      const chartData: { day: number; highTmp: number }[] = [];
      const sortedDates = Array.from(dailyUsage.keys()).sort();

      sortedDates.forEach((date, index) => {
        chartData.push({
          day: index + 1,
          highTmp: dailyUsage.get(date) || 0,
        });
      });

      // If no data, return empty data based on timeframe
      if (chartData.length === 0) {
        const daysCount = timeFrame === "1W" ? 7 : timeFrame === "1M" ? 30 : 90;
        for (let i = 1; i <= daysCount; i++) {
          chartData.push({ day: i, highTmp: 0 });
        }
      }

      return chartData;
    } catch (error) {
      console.error("Error getting device chart data:", error);
      // Return empty data on error
      const daysCount = timeFrame === "1W" ? 7 : timeFrame === "1M" ? 30 : 90;
      const emptyData: { day: number; highTmp: number }[] = [];
      for (let i = 1; i <= daysCount; i++) {
        emptyData.push({ day: i, highTmp: 0 });
      }
      return emptyData;
    }
  }

  // Get devices with usage summary for home page
  static async getDevicesWithUsageSummary(
    timeFrame: "1W" | "1M" | "3M"
  ): Promise<
    { name: string; consumption: string; icon: string; deviceId: string }[]
  > {
    try {
      console.log("⚡ Getting devices with usage for timeframe:", timeFrame);

      // Get all user devices
      const devices = await DeviceService.getUserDevices();
      console.log("⚡ Found devices:", devices.length);

      if (devices.length === 0) {
        return [];
      }

      const endDate = new Date();
      let startDate = new Date();

      // Calculate start date based on timeframe
      switch (timeFrame) {
        case "1W":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "1M":
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case "3M":
          startDate.setMonth(endDate.getMonth() - 3);
          break;
      }

      // Get usage data for each device
      const devicesWithUsage = await Promise.all(
        devices.map(async (device) => {
          try {
            const usageData = await this.getFilteredUsage(
              device._id,
              startDate,
              endDate
            );

            // Calculate total consumption for the timeframe
            const totalConsumption = usageData.reduce(
              (sum, usage) => sum + usage.dailyKwh,
              0
            );

            // Map device types to icons
            const iconMap: { [key: string]: string } = {
              "Air Conditioner": "snow",
              Heater: "flame",
              Refrigerator: "thermometer",
              Lighting: "bulb",
              "Washing Machine": "water",
              TV: "tv",
              Microwave: "restaurant",
              Computer: "desktop",
              Laptop: "laptop",
              Fan: "refresh",
              Oven: "restaurant-menu",
              Dishwasher: "local-laundry-service",
              "Phone Charger": "battery-charging",
              "Vacuum Cleaner": "build",
              Blender: "local-drink",
              Toaster: "restaurant-menu",
              "Coffee Maker": "local-cafe",
              "Other Device": "electrical-services",
              default: "electrical-services",
            };

            const icon =
              iconMap[device.deviceName || ""] ||
              iconMap[device.deviceType || ""] ||
              iconMap[device.type || ""] ||
              iconMap["default"];

            return {
              name:
                device.deviceName ||
                device.deviceType ||
                device.type ||
                "Unknown Device",
              consumption:
                totalConsumption > 0
                  ? `${totalConsumption.toFixed(2)} kWh`
                  : "No Data",
              icon: icon,
              deviceId: device._id,
            };
          } catch (error) {
            console.error(
              `Error getting usage for device ${
                device.deviceName || device.type
              }:`,
              error
            );
            return {
              name:
                device.deviceName ||
                device.deviceType ||
                device.type ||
                "Unknown Device",
              consumption: "Error loading data",
              icon: "electrical-services",
              deviceId: device._id,
            };
          }
        })
      );

      console.log("⚡ Devices with usage processed:", devicesWithUsage.length);
      return devicesWithUsage;
    } catch (error) {
      console.error("Error getting devices with usage:", error);
      return [];
    }
  }

  static async createUsageRecord(usageData: {
    deviceId: string;
    date: string;
    dailyKwh: number;
    hourlyBreakdown?: number[];
    avgTemp?: number;
    peakHours?: string[];
  }): Promise<ElectricityUsage> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await fetch(`${API_BASE_URL}/usage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(usageData),
      });

      if (response.ok) {
        const data = await response.json();
        return data.usage || data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create usage record");
      }
    } catch (error) {
      console.error("Error creating usage record:", error);
      throw error;
    }
  }

  static async updateUsageRecord(
    usageId: string,
    updateData: Partial<ElectricityUsage>
  ): Promise<ElectricityUsage> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await fetch(`${API_BASE_URL}/usage/${usageId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        return data.usage || data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update usage record");
      }
    } catch (error) {
      console.error("Error updating usage record:", error);
      throw error;
    }
  }

  static async deleteUsageRecord(usageId: string): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await fetch(`${API_BASE_URL}/usage/${usageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete usage record");
      }
    } catch (error) {
      console.error("Error deleting usage record:", error);
      throw error;
    }
  }

  // Helper method to combine devices with their usage data
  static async getDevicesWithUsageData(): Promise<DeviceUsageData[]> {
    try {
      const [devices, usageData] = await Promise.all([
        DeviceService.getUserDevices(),
        this.getUserUsage(),
      ]);

      const deviceUsageMap = new Map<string, ElectricityUsage[]>();

      // Group usage data by device ID
      usageData.forEach((usage) => {
        if (!deviceUsageMap.has(usage.deviceId)) {
          deviceUsageMap.set(usage.deviceId, []);
        }
        deviceUsageMap.get(usage.deviceId)?.push(usage);
      });

      // Combine devices with their usage data
      const devicesWithUsage: DeviceUsageData[] = devices.map((device) => {
        const usage = deviceUsageMap.get(device._id) || [];
        const totalKwh = usage.reduce((sum, u) => sum + u.dailyKwh, 0);
        const avgDailyKwh = usage.length > 0 ? totalKwh / usage.length : 0;

        return {
          device,
          usage,
          totalKwh,
          avgDailyKwh,
        };
      });

      return devicesWithUsage;
    } catch (error) {
      console.error("Error fetching devices with usage:", error);
      throw error;
    }
  }
}
