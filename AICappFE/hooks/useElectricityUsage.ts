import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import {
  ElectricityUsageService,
  UsageSummary,
} from "../services/ElectricityUsageService";
import { ElectricityUsage } from "../services/DeviceService";
import { useAuth } from "./useAuth";
import { showSessionExpiredAlert } from "../utils/alertUtils";

export const useElectricityUsage = () => {
  const [usage, setUsage] = useState<ElectricityUsage[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const isFetchingRef = useRef(false);

  const fetchUsageData = useCallback(async () => {
    if (!isLoggedIn || isFetchingRef.current) {
      setUsage([]);
      setSummary(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    isFetchingRef.current = true;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch usage data and summary in parallel
      const [usageData, summaryData] = await Promise.all([
        ElectricityUsageService.getUserUsage(),
        ElectricityUsageService.getUsageSummary().catch(() => null), // Summary is optional
      ]);

      setUsage(usageData);
      setSummary(summaryData);
    } catch (error: any) {
      console.error("❌ Error fetching usage data:", error);

      // Check if error is token invalid
      if (
        error?.message === "Token is not valid" ||
        (error?.status === 401 && error?.message?.includes("Token"))
      ) {
        showSessionExpiredAlert(async () => {
          await logout();
          router.replace("/(tabs)/login");
        });
        return;
      }

      setError(error?.message || "Failed to fetch usage data");
      setUsage([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [isLoggedIn, logout, router]);

  const fetchFilteredUsage = useCallback(
    async (deviceId?: string, startDate?: Date, endDate?: Date) => {
      if (!isLoggedIn) {
        return [];
      }

      try {
        setIsLoading(true);
        setError(null);

        const filteredData = await ElectricityUsageService.getFilteredUsage(
          deviceId,
          startDate,
          endDate
        );

        return filteredData;
      } catch (error: any) {
        console.error("❌ Error fetching filtered usage:", error);

        // Check if error is token invalid - inline to avoid dependency issues
        if (
          error?.message === "Token is not valid" ||
          (error?.status === 401 && error?.message?.includes("Token"))
        ) {
          showSessionExpiredAlert(async () => {
            await logout();
            router.replace("/(tabs)/login");
          });
          return [];
        }

        setError(error?.message || "Failed to fetch filtered usage data");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [isLoggedIn, logout, router] // Only depend on basic values
  );

  useEffect(() => {
    // Only call when isLoggedIn changes (not when fetchUsageData changes)
    const loadData = async () => {
      if (!isLoggedIn || isFetchingRef.current) {
        setUsage([]);
        setSummary(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      isFetchingRef.current = true;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch usage data and summary in parallel
        const [usageData, summaryData] = await Promise.all([
          ElectricityUsageService.getUserUsage(),
          ElectricityUsageService.getUsageSummary().catch(() => null), // Summary is optional
        ]);

        setUsage(usageData);
        setSummary(summaryData);
      } catch (error: any) {
        console.error("❌ Error fetching usage data:", error);

        // Check if error is token invalid - inline to avoid dependency issues
        if (
          error?.message === "Token is not valid" ||
          (error?.status === 401 && error?.message?.includes("Token"))
        ) {
          showSessionExpiredAlert(async () => {
            await logout();
            router.replace("/(tabs)/login");
          });
          return;
        }

        setError(error?.message || "Failed to fetch usage data");
        setUsage([]);
        setSummary(null);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    loadData();
  }, [isLoggedIn, logout, router]); // Only depend on basic values

  const refreshUsage = () => {
    fetchUsageData();
  };

  return {
    usage,
    summary,
    isLoading,
    error,
    refreshUsage,
    fetchFilteredUsage,
  };
};
