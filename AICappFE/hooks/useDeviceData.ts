import { useState, useEffect, useCallback, useRef } from "react";
import { DeviceService, Device } from "../services/DeviceService";
import {
  ElectricityUsageService,
  UsageSummary,
} from "../services/ElectricityUsageService";
import { useAuth } from "./useAuth";
import { router } from "expo-router";
import { Alert } from "react-native";
import { showSessionExpiredAlert } from "../utils/alertUtils";

export interface DeviceWithUsage extends Device {
  todayUsage: number;
  monthlyUsage: number;
}

export const useDeviceData = () => {
  const { isLoggedIn, logout } = useAuth();
  const [devices, setDevices] = useState<DeviceWithUsage[]>([]);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchDeviceData = useCallback(async () => {
    if (!isLoggedIn || isFetchingRef.current) return;

    isFetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      // Fetch devices and usage summary in parallel
      const [devicesData, summaryData] = await Promise.all([
        DeviceService.getUserDevices(),
        ElectricityUsageService.getUsageSummary(),
      ]);

      console.log("📱 Fetched devices data:", devicesData);
      console.log("⚡ Fetched usage summary:", summaryData);

      // Get usage data for each device
      const devicesWithUsage: DeviceWithUsage[] = await Promise.all(
        devicesData
          .filter((device) => device && device._id && device.type) // Filter out invalid devices
          .map(async (device) => {
            try {
              // Get today's usage
              const today = new Date();
              const todayUsage = await ElectricityUsageService.getFilteredUsage(
                device._id,
                today,
                today
              );

              // Get this month's usage
              const startOfMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
              );
              const monthlyUsage =
                await ElectricityUsageService.getFilteredUsage(
                  device._id,
                  startOfMonth,
                  today
                );

              return {
                ...device,
                todayUsage: todayUsage.reduce(
                  (sum, usage) => sum + usage.dailyKwh,
                  0
                ),
                monthlyUsage: monthlyUsage.reduce(
                  (sum, usage) => sum + usage.dailyKwh,
                  0
                ),
              };
            } catch (deviceError) {
              console.warn(
                `Error fetching usage for device ${device.deviceName}:`,
                deviceError
              );
              return {
                ...device,
                todayUsage: 0,
                monthlyUsage: 0,
              };
            }
          })
      );

      setDevices(devicesWithUsage);
      setUsageSummary(summaryData);
    } catch (err) {
      console.error("Error fetching device data:", err);

      // Check if it's a token error
      if (err instanceof Error && err.message.includes("Token is not valid")) {
        console.log("🔄 Token invalid, triggering auto-logout");
        showSessionExpiredAlert(async () => {
          await logout();
          router.replace("/(tabs)/login");
        });
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to fetch device data"
        );
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [isLoggedIn, logout]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await fetchDeviceData();
    setRefreshing(false);
  }, [fetchDeviceData]);

  const getDeviceUsageForChart = useCallback(
    async (deviceId?: string, timeFrame: "1W" | "1M" | "3M" = "1M") => {
      if (!isLoggedIn) return [];

      try {
        const currentDate = new Date();
        let startDate: Date;

        switch (timeFrame) {
          case "1W":
            startDate = new Date(
              currentDate.getTime() - 7 * 24 * 60 * 60 * 1000
            );
            break;
          case "1M":
            startDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              1
            );
            break;
          case "3M":
            startDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth() - 2,
              1
            );
            break;
          default:
            startDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              1
            );
        }

        const usageData = await ElectricityUsageService.getFilteredUsage(
          deviceId,
          startDate,
          currentDate
        );

        // Convert to chart format
        const chartData = usageData.map((usage, index) => ({
          day: index + 1,
          highTmp: usage.dailyKwh,
        }));

        return chartData;
      } catch (err) {
        console.error("Error fetching chart data:", err);
        return [];
      }
    },
    [isLoggedIn]
  );

  const createDevice = useCallback(
    async (deviceData: { type: string; isOn: boolean }) => {
      try {
        const newDevice = await DeviceService.createDevice(deviceData);
        await refreshData(); // Refresh the data after creating
        return newDevice;
      } catch (err) {
        console.error("Error creating device:", err);
        throw err;
      }
    },
    [refreshData]
  );

  const updateDevice = useCallback(
    async (deviceId: string, deviceData: Partial<Device>) => {
      try {
        const updatedDevice = await DeviceService.updateDevice(
          deviceId,
          deviceData
        );
        await refreshData(); // Refresh the data after updating
        return updatedDevice;
      } catch (err) {
        console.error("Error updating device:", err);
        throw err;
      }
    },
    [refreshData]
  );

  const deleteDevice = useCallback(
    async (deviceId: string) => {
      try {
        await DeviceService.deleteDevice(deviceId);
        await refreshData(); // Refresh the data after deleting
      } catch (err) {
        console.error("Error deleting device:", err);
        throw err;
      }
    },
    [refreshData]
  );

  // Fetch data when authenticated
  useEffect(() => {
    const loadDeviceData = async () => {
      if (!isLoggedIn || isFetchingRef.current) {
        if (!isLoggedIn) {
          // Reset data when not authenticated
          setDevices([]);
          setUsageSummary(null);
          setError(null);
        }
        return;
      }

      isFetchingRef.current = true;

      try {
        setLoading(true);
        setError(null);

        // Fetch devices and usage summary in parallel
        const [devicesData, summaryData] = await Promise.all([
          DeviceService.getUserDevices(),
          ElectricityUsageService.getUsageSummary().catch(() => null),
        ]);

        // Transform devices to include usage data
        const devicesWithUsage: DeviceWithUsage[] = devicesData.map(
          (device) => ({
            ...device,
            todayUsage: 0, // This should be calculated based on actual data
            monthlyUsage: 0, // This should be calculated based on actual data
          })
        );

        setDevices(devicesWithUsage);
        setUsageSummary(summaryData);
      } catch (err: any) {
        console.error("Error loading device data:", err);

        // Check if error is token invalid - inline to avoid dependency issues
        if (
          err?.message === "Token is not valid" ||
          (err?.status === 401 && err?.message?.includes("Token"))
        ) {
          Alert.alert(
            "Session Expired",
            "Your session has expired. Please login again.",
            [
              {
                text: "OK",
                onPress: async () => {
                  await logout();
                  router.replace("/(tabs)/login");
                },
              },
            ]
          );
          return;
        }

        setError(
          err instanceof Error ? err.message : "Failed to fetch device data"
        );
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    loadDeviceData();
  }, [isLoggedIn, logout]); // Only depend on isLoggedIn and logout

  return {
    devices,
    usageSummary,
    loading,
    error,
    refreshing,
    refreshData,
    getDeviceUsageForChart,
    createDevice,
    updateDevice,
    deleteDevice,
    hasDevices: devices.length > 0,
  };
};
