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
      return "https://1bde337fa39d.ngrok-free.app/api";
    }
  } else {
    // Production - URL production yang sama
    return "https://1bde337fa39d.ngrok-free.app/api";
  }
};

const API_BASE_URL = getApiBaseUrl();

export interface Device {
  _id: string;
  deviceId?: string;
  userId: string;
  type: string;
  isOn: boolean;
  createdAt: string;
  updatedAt: string;

  deviceName?: string;
  deviceType?: string;
  status?: "on" | "off";
  brand?: string;
  model?: string;
  wattage?: number;
  location?: string;
  installationDate?: string;
  description?: string;
}

export interface ElectricityUsage {
  _id: string;
  userId: string;
  deviceId: string;
  date: string;
  dailyKwh: number;
  hourlyBreakdown?: number[];
  avgTemp?: number;
  peakHours?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DeviceUsageSummary {
  device: Device;
  totalKwh: number;
  avgDailyKwh: number;
  lastUsageDate: string;
  usageData: ElectricityUsage[];
}

export class DeviceService {
  private static async getAuthToken(): Promise<string | null> {
    return await AuthService.getToken();
  }

  private static transformDevice(backendDevice: any): Device {
    const deviceTypeMap: { [key: string]: string } = {
      refrigerator: "Refrigerator",
      washing_machine: "Washing Machine",
      dishwasher: "Dishwasher",
      microwave: "Microwave",
      oven: "Oven",
      stove: "Stove",
      air_conditioner: "Air Conditioner",
      heater: "Heater",
      television: "TV",
      computer: "Computer",
      laptop: "Laptop",
      phone_charger: "Phone Charger",
      lighting: "Lighting",
      fan: "Fan",
      vacuum_cleaner: "Vacuum Cleaner",
      blender: "Blender",
      toaster: "Toaster",
      coffee_maker: "Coffee Maker",
      other: "Other Device",
    };

    const deviceName =
      deviceTypeMap[backendDevice.type] ||
      backendDevice.type ||
      "Unknown Device";

    return {
      ...backendDevice,
      deviceId: backendDevice._id,
      deviceName: deviceName,
      deviceType: deviceName,
      status: backendDevice.isOn ? "on" : "off",
      wattage: this.getDefaultWattage(backendDevice.type),
      brand: "Generic",
      location: "Home",
    };
  }

  private static getDefaultWattage(deviceType: string): number {
    const wattageMap: { [key: string]: number } = {
      refrigerator: 200,
      washing_machine: 500,
      dishwasher: 1500,
      microwave: 1000,
      oven: 2500,
      stove: 2000,
      air_conditioner: 1500,
      heater: 1200,
      television: 150,
      computer: 300,
      laptop: 65,
      phone_charger: 10,
      lighting: 60,
      fan: 75,
      vacuum_cleaner: 1000,
      blender: 400,
      toaster: 800,
      coffee_maker: 1000,
      other: 100,
    };

    return wattageMap[deviceType] || 100;
  }

  static async getUserDevices(): Promise<Device[]> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await fetch(`${API_BASE_URL}/device`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          const devices = data.devices || data;

          if (Array.isArray(devices)) {
            return devices
              .filter(
                (device) =>
                  device &&
                  typeof device === "object" &&
                  device._id &&
                  device.type
              )
              .map((device) => this.transformDevice(device));
          } else {
            console.warn("API returned non-array device data:", devices);
            return [];
          }
        } catch (jsonError: any) {
          console.error(
            "Invalid JSON response from server:",
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

        if (
          response.status === 401 &&
          (errorData.message === "Token is not valid" ||
            errorData.message === "No token, authorization denied")
        ) {
          console.log("🔒 Token invalid, clearing auth data...");
          await AuthService.logout();
          throw {
            status: 401,
            message: "Authentication expired. Please login again.",
          };
        }

        throw new Error(errorData.message || "Failed to fetch devices");
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
      throw error;
    }
  }

  static async getDevicesByType(type: string): Promise<Device[]> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await fetch(`${API_BASE_URL}/device/type/${type}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.devices || data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch devices by type");
      }
    } catch (error) {
      console.error("Error fetching devices by type:", error);
      throw error;
    }
  }

  static async createDevice(deviceData: {
    type: string;
    isOn: boolean;
  }): Promise<Device> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await fetch(`${API_BASE_URL}/device`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deviceData),
      });

      if (response.ok) {
        const data = await response.json();
        return this.transformDevice(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create device");
      }
    } catch (error) {
      console.error("Error creating device:", error);
      throw error;
    }
  }

  static async updateDevice(
    deviceId: string,
    updateData: Partial<Device>
  ): Promise<Device> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await fetch(`${API_BASE_URL}/device/${deviceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        return data.device || data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update device");
      }
    } catch (error) {
      console.error("Error updating device:", error);
      throw error;
    }
  }

  static async deleteDevice(deviceId: string): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await fetch(`${API_BASE_URL}/device/${deviceId}`, {
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
        throw new Error(errorData.message || "Failed to delete device");
      }
    } catch (error) {
      console.error("Error deleting device:", error);
      throw error;
    }
  }
}
