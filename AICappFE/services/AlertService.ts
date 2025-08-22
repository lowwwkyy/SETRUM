import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import Constants from "expo-constants";

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === "expo";

export interface AlertThreshold {
  id: string;
  type: "total" | "high" | "low";
  title: string;
  value: number;
  unit: string;
  enabled: boolean;
}

export interface AlertSettings {
  thresholds: AlertThreshold[];
  notificationsEnabled: boolean;
}

const ALERT_SETTINGS_KEY = "alert_settings";

// Show warning about Expo Go limitations
if (isExpoGo) {
  console.warn(
    "Push notifications are not supported in Expo Go. Use development build for full functionality."
  );
}

export class AlertService {
  static async getDefaultSettings(): Promise<AlertSettings> {
    return {
      thresholds: [
        {
          id: "total-threshold",
          type: "total",
          title: "Total Consumption Threshold",
          value: 1000,
          unit: "kWh",
          enabled: true,
        },
        {
          id: "high-threshold",
          type: "high",
          title: "High Consumption Threshold",
          value: 800,
          unit: "kWh",
          enabled: true,
        },
        {
          id: "low-threshold",
          type: "low",
          title: "Low Consumption Threshold",
          value: 200,
          unit: "kWh",
          enabled: true,
        },
      ],
      notificationsEnabled: true,
    };
  }

  static async getAlertSettings(): Promise<AlertSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(ALERT_SETTINGS_KEY);
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
      return this.getDefaultSettings();
    } catch (error) {
      console.error("Error getting alert settings:", error);
      return this.getDefaultSettings();
    }
  }

  static async saveAlertSettings(settings: AlertSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(ALERT_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving alert settings:", error);
      throw error;
    }
  }

  static async updateThreshold(
    thresholdId: string,
    updates: Partial<AlertThreshold>
  ): Promise<void> {
    try {
      const settings = await this.getAlertSettings();
      const thresholdIndex = settings.thresholds.findIndex(
        (t) => t.id === thresholdId
      );

      if (thresholdIndex !== -1) {
        settings.thresholds[thresholdIndex] = {
          ...settings.thresholds[thresholdIndex],
          ...updates,
        };
        await this.saveAlertSettings(settings);
      }
    } catch (error) {
      console.error("Error updating threshold:", error);
      throw error;
    }
  }

  static async toggleNotifications(enabled: boolean): Promise<void> {
    try {
      const settings = await this.getAlertSettings();
      settings.notificationsEnabled = enabled;
      await this.saveAlertSettings(settings);
    } catch (error) {
      console.error("Error toggling notifications:", error);
      throw error;
    }
  }

  static async requestNotificationPermissions(): Promise<boolean> {
    if (isExpoGo) {
      Alert.alert(
        "Notification Info",
        "Push notifications are not supported in Expo Go. Use a development build to test notifications.",
        [{ text: "OK" }]
      );
      return false;
    }

    try {
      // Dynamic import for notifications
      const { getPermissionsAsync, requestPermissionsAsync } = await import(
        "expo-notifications"
      );

      const { status: existingStatus } = await getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === "granted";
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      Alert.alert(
        "Notification Error",
        "Failed to request notification permissions. Please enable them in device settings.",
        [{ text: "OK" }]
      );
      return false;
    }
  }

  static async sendTestNotification(): Promise<void> {
    if (isExpoGo) {
      Alert.alert(
        "Test Notification",
        "This is a simulated test notification. In a development build, this would be a real push notification.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const hasPermission = await this.requestNotificationPermissions();
      if (!hasPermission) {
        throw new Error("Notification permissions not granted");
      }

      // Dynamic import for notifications
      const { scheduleNotificationAsync } = await import("expo-notifications");

      await scheduleNotificationAsync({
        content: {
          title: "Alert Test",
          body: "This is a test notification from SETRUM",
          data: { type: "test" },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
      Alert.alert(
        "Notification Error",
        "Failed to send test notification. Make sure notifications are enabled in your device settings.",
        [{ text: "OK" }]
      );
      throw error;
    }
  }

  static async checkConsumptionAndAlert(
    currentConsumption: number,
    consumptionType: "total" | "high" | "low"
  ): Promise<void> {
    try {
      const settings = await this.getAlertSettings();
      if (!settings.notificationsEnabled) return;

      const relevantThreshold = settings.thresholds.find(
        (t) => t.type === consumptionType && t.enabled
      );

      if (!relevantThreshold) return;

      let shouldAlert = false;
      let alertMessage = "";

      switch (consumptionType) {
        case "total":
        case "high":
          if (currentConsumption >= relevantThreshold.value) {
            shouldAlert = true;
            alertMessage = `${relevantThreshold.title}: ${currentConsumption} ${relevantThreshold.unit} exceeds threshold of ${relevantThreshold.value} ${relevantThreshold.unit}`;
          }
          break;
        case "low":
          if (currentConsumption <= relevantThreshold.value) {
            shouldAlert = true;
            alertMessage = `${relevantThreshold.title}: ${currentConsumption} ${relevantThreshold.unit} is below threshold of ${relevantThreshold.value} ${relevantThreshold.unit}`;
          }
          break;
      }

      if (shouldAlert) {
        if (isExpoGo) {
          // Show alert dialog in Expo Go since push notifications aren't supported
          Alert.alert("SETRUM Alert", alertMessage, [{ text: "OK" }]);
        } else {
          const hasPermission = await this.requestNotificationPermissions();
          if (hasPermission) {
            try {
              // Dynamic import for notifications
              const { scheduleNotificationAsync } = await import(
                "expo-notifications"
              );

              await scheduleNotificationAsync({
                content: {
                  title: "SETRUM Alert",
                  body: alertMessage,
                  data: {
                    type: "consumption_alert",
                    thresholdType: consumptionType,
                    value: currentConsumption,
                    threshold: relevantThreshold.value,
                  },
                },
                trigger: null,
              });
            } catch (error) {
              console.error("Error sending notification:", error);
              // Fallback to alert dialog
              Alert.alert("SETRUM Alert", alertMessage, [{ text: "OK" }]);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking consumption and alerting:", error);
    }
  }

  static async getAlertHistory(): Promise<any[]> {
    // This would typically fetch from a backend API
    // For now, return mock data
    return [
      {
        id: "1",
        type: "total",
        title: "Total",
        description: "High-level consumption exceeded threshold",
        time: "10:30 AM",
        day: "Today",
        value: 1200,
        threshold: 1000,
      },
      {
        id: "2",
        type: "low",
        title: "Low",
        description: "Consumption below threshold",
        time: "9:15 AM",
        day: "Today",
        value: 150,
        threshold: 200,
      },
    ];
  }
}
