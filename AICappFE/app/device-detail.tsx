import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { DeviceService } from "@/services/DeviceService";
import { ElectricityUsageService } from "@/services/ElectricityUsageService";
import { RealTimeConsumptionService } from "@/services/RealTimeConsumptionService";

// Device power consumption mapping (in watts)
const DEVICE_POWER_CONSUMPTION: { [key: string]: number } = {
  tv: 150, // Television
  television: 150,
  ac: 2000, // Air Conditioner
  "air-conditioner": 2000,
  refrigerator: 400, // Refrigerator
  fridge: 400,
  "washing-machine": 500, // Washing Machine
  washer: 500,
  microwave: 1000, // Microwave
  oven: 1000,
  fan: 75, // Fan
  light: 60, // Light Bulb
  lamp: 60,
  computer: 300, // Computer
  pc: 300,
  laptop: 65, // Laptop
  charger: 25, // Phone Charger
  "phone-charger": 25,
  default: 100, // Default consumption
};

// Function to get device power consumption in watts
const getDevicePowerConsumption = (deviceType: string): number => {
  const type = deviceType?.toLowerCase().replace(/\s+/g, "-") || "default";
  return DEVICE_POWER_CONSUMPTION[type] || DEVICE_POWER_CONSUMPTION["default"];
};

// Function to calculate kWh from watts and hours
const calculateKwh = (watts: number, hours: number): number => {
  return (watts * hours) / 1000; // Convert watts to kWh
};

// Function to calculate realistic consumption based on device type and duration
const calculateRealisticConsumption = (
  deviceType: string,
  durationHours: number
): number => {
  const watts = getDevicePowerConsumption(deviceType);
  return calculateKwh(watts, durationHours);
};

const getDeviceIcon = (type: string) => {
  const iconMap: { [key: string]: string } = {
    tv: "tv",
    television: "tv",
    ac: "snow",
    "air-conditioner": "snow",
    refrigerator: "cube",
    fridge: "cube",
    "washing-machine": "water",
    washer: "water",
    microwave: "radio",
    oven: "radio",
    fan: "refresh",
    light: "bulb",
    lamp: "bulb",
    computer: "desktop",
    pc: "desktop",
    laptop: "laptop",
    charger: "battery-charging",
    "phone-charger": "battery-charging",
  };
  return iconMap[type?.toLowerCase()] || "flash";
};

const formatDate = (dateString: string) => {
  if (!dateString) return "Unknown Date";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

export default function DeviceDetail() {
  const { deviceId } = useLocalSearchParams();
  const [device, setDevice] = useState<any>(null);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [currentConsumption, setCurrentConsumption] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Real-time consumption update interval
  useEffect(() => {
    let interval: any;

    if (device?.isOn) {
      interval = setInterval(() => {
        const current = RealTimeConsumptionService.getCurrentConsumption(
          deviceId as string
        );
        setCurrentConsumption(current);
      }, 1000); // Update every second
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [device?.isOn, deviceId]);

  const loadDeviceDetail = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔍 Loading device detail for deviceId:", deviceId);

      if (!deviceId) {
        console.error("❌ No deviceId provided");
        Alert.alert("Error", "No device ID provided");
        setLoading(false);
        return;
      }

      // Load device info
      const devices = await DeviceService.getUserDevices();
      console.log("📱 All devices:", devices);
      console.log("🔍 Looking for deviceId:", deviceId);

      const currentDevice = devices.find(
        (d: any) => d.deviceId === deviceId || d._id === deviceId
      );
      console.log("🎯 Found device:", currentDevice);
      setDevice(currentDevice);

      // Load usage data
      const usage = await ElectricityUsageService.getUserUsage();
      console.log("📊 All usage data:", usage);

      let deviceUsage = usage.filter(
        (u: any) => u.deviceId === deviceId || u.deviceId === currentDevice?._id
      );
      console.log("📊 Filtered device usage:", deviceUsage);

      // Generate realistic sample data based on device type if no usage found
      if (deviceUsage.length === 0 && currentDevice) {
        console.log("📊 No usage data found, generating realistic sample data");
        const deviceType =
          currentDevice.deviceType || currentDevice.type || "default";
        const now = new Date();

        deviceUsage = Array.from({ length: 3 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - i);

          // Calculate realistic consumption based on device type
          let usageHours;

          // Different usage patterns for different devices
          if (
            deviceType.toLowerCase().includes("refrigerator") ||
            deviceType.toLowerCase().includes("fridge")
          ) {
            // Refrigerator runs 24/7
            usageHours = 24;
          } else if (
            deviceType.toLowerCase().includes("ac") ||
            deviceType.toLowerCase().includes("air-conditioner")
          ) {
            // AC runs 8-12 hours per day
            usageHours = 8 + Math.random() * 4; // 8-12 hours
          } else if (
            deviceType.toLowerCase().includes("light") ||
            deviceType.toLowerCase().includes("lamp")
          ) {
            // Lights run 6-10 hours per day
            usageHours = 6 + Math.random() * 4; // 6-10 hours
          } else if (
            deviceType.toLowerCase().includes("tv") ||
            deviceType.toLowerCase().includes("television")
          ) {
            // TV runs 4-8 hours per day
            usageHours = 4 + Math.random() * 4; // 4-8 hours
          } else if (deviceType.toLowerCase().includes("charger")) {
            // Phone charger runs 2-4 hours per day
            usageHours = 2 + Math.random() * 2; // 2-4 hours
          } else {
            // Default: other devices run 3-6 hours per day
            usageHours = 3 + Math.random() * 3; // 3-6 hours
          }

          const dailyKwh = calculateRealisticConsumption(
            deviceType,
            usageHours
          );

          return {
            _id: `realistic-${i}`,
            userId: currentDevice.userId || "dummy-user",
            deviceId: deviceId as string,
            date: date.toISOString(),
            dailyKwh: dailyKwh,
            deviceType: deviceType,
            usageHours: usageHours,
            createdAt: date.toISOString(),
            updatedAt: date.toISOString(),
          };
        }).reverse(); // Reverse to have oldest first
      }

      // Sort by date for proper cumulative calculation
      const sortedUsage = deviceUsage.sort(
        (a: any, b: any) =>
          new Date(a.date || a.createdAt).getTime() -
          new Date(b.date || b.createdAt).getTime()
      );

      // Calculate cumulative consumption for each entry
      let cumulativeKwh = 0;
      const usageWithCumulative = sortedUsage.map((item: any) => {
        const dailyConsumption = item.dailyKwh || item.consumption || 0;
        cumulativeKwh += dailyConsumption;
        return {
          ...item,
          dailyConsumption,
          cumulativeKwh,
        };
      });

      setUsageData(usageWithCumulative);

      // Calculate total consumption
      const total = usageWithCumulative.reduce(
        (sum: number, item: any) => sum + (item.dailyConsumption || 0),
        0
      );
      console.log("📊 Total consumption:", total);
      setTotalConsumption(total);
    } catch (error) {
      console.error("❌ Error loading device detail:", error);
      Alert.alert("Error", "Failed to load device details");
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    if (deviceId) {
      loadDeviceDetail();
    } else {
      console.error("❌ No deviceId provided in useEffect");
      setLoading(false);
    }
  }, [deviceId, loadDeviceDetail]);

  const handleToggleDevice = async () => {
    if (!device) return;

    try {
      setActionLoading(true);
      const newStatus = !device.isOn;
      const deviceIdToUse = device.deviceId || device._id;

      // Start or stop real-time tracking based on new status
      if (newStatus) {
        // Starting device - begin tracking consumption
        console.log("🔋 Starting real-time consumption tracking");
        await RealTimeConsumptionService.startTracking(deviceIdToUse, device);
      } else {
        // Stopping device - save current consumption and stop tracking
        console.log("🛑 Stopping real-time consumption tracking");
        await RealTimeConsumptionService.stopTracking(deviceIdToUse);
      }

      await DeviceService.updateDevice(deviceIdToUse, {
        isOn: newStatus,
      });

      setDevice({ ...device, isOn: newStatus });

      Alert.alert(
        "Success",
        newStatus
          ? "Device turned ON - tracking consumption started"
          : "Device turned OFF - consumption saved"
      );

      // Reload data to show updated consumption
      setTimeout(() => {
        loadDeviceDetail();
      }, 1000);
    } catch (error) {
      console.error("Error toggling device:", error);
      Alert.alert("Error", "Failed to toggle device");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDevice = async () => {
    if (!device) return;

    Alert.alert(
      "Delete Device",
      `Are you sure you want to delete "${device.deviceName || device.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              const deviceIdToUse = device.deviceId || device._id;

              // Stop tracking if device is on
              if (device.isOn) {
                await RealTimeConsumptionService.stopTracking(deviceIdToUse);
              }

              await DeviceService.deleteDevice(deviceIdToUse);
              Alert.alert("Success", "Device deleted successfully");
              router.back();
            } catch (error) {
              console.error("Error deleting device:", error);
              Alert.alert("Error", "Failed to delete device");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading device details...</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>Device not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get device power specs for display
  const devicePowerWatts = getDevicePowerConsumption(
    device.deviceType || device.type || "default"
  );
  const estimatedCostPerHour = (devicePowerWatts / 1000) * 1700;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Device Info Card */}
        <View style={styles.deviceCard}>
          <View style={styles.deviceHeader}>
            <View style={styles.deviceIconContainer}>
              <Ionicons
                name={getDeviceIcon(device.type) as any}
                size={32}
                color={device.isOn ? "#4CAF50" : "#888"}
              />
            </View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>
                {device.deviceName || device.name || "Unknown Device"}
              </Text>
              <Text style={styles.deviceType}>
                {device.deviceType ||
                  device.type?.replace("-", " ") ||
                  "Unknown Type"}
              </Text>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: device.isOn ? "#4CAF50" : "#ff6b6b" },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: device.isOn ? "#4CAF50" : "#ff6b6b" },
                  ]}
                >
                  {device.isOn ? "Online" : "Offline"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Power Specifications Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Power Specifications</Text>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Power Rating:</Text>
            <Text style={styles.specValue}>{devicePowerWatts}W</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Est. Cost/Hour:</Text>
            <Text style={styles.specValue}>
              IDR {estimatedCostPerHour.toFixed(3)}
            </Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Device Type:</Text>
            <Text style={styles.specValue}>
              {device.deviceType || device.type || "Unknown"}
            </Text>
          </View>

          {/* Special notice for high consumption devices */}
          {(device.deviceType?.toLowerCase().includes("refrigerator") ||
            device.deviceType?.toLowerCase().includes("fridge") ||
            device.type?.toLowerCase().includes("refrigerator") ||
            device.type?.toLowerCase().includes("fridge")) && (
            <View style={styles.warningSection}>
              <View style={styles.warningIcon}>
                <Ionicons name="information-circle" size={16} color="#FF9500" />
              </View>
              <Text style={styles.warningText}>
                Refrigerators run 24/7, resulting in higher daily consumption
                (~9.6 kWh/day)
              </Text>
            </View>
          )}
        </View>

        {/* Consumption Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Power Consumption</Text>
          <Text style={styles.totalConsumption}>
            {(totalConsumption || 0).toFixed(3)} kWh
          </Text>
          <Text style={styles.summarySubtitle}>
            Total consumption • {usageData.length} records
          </Text>

          {/* Real-time consumption display */}
          {device.isOn && (
            <View style={styles.realTimeSection}>
              <Text style={styles.realTimeTitle}>Current Session</Text>
              <Text style={styles.realTimeConsumption}>
                {currentConsumption.toFixed(3)} kWh
              </Text>
              <Text style={styles.realTimeSubtitle}>
                Live consumption (this session)
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.toggleButton,
              device.isOn && styles.turnOffButton,
            ]}
            onPress={handleToggleDevice}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={device.isOn ? "power" : "power-outline"}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.actionButtonText}>
                  Turn {device.isOn ? "OFF" : "ON"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteDevice}
            disabled={actionLoading}
          >
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Delete Device</Text>
          </TouchableOpacity>
        </View>

        {/* Usage History */}
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Usage History</Text>

          {usageData.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="bar-chart-outline" size={48} color="#666" />
              <Text style={styles.emptyHistoryText}>
                No usage data available
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {usageData.slice(0, 10).map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>
                      {formatDate(
                        item.date || item.timestamp || item.createdAt
                      )}
                    </Text>
                    <Text style={styles.historyDevice}>
                      Daily: {(item.dailyConsumption || 0).toFixed(3)} kWh
                    </Text>
                    {item.usageHours && (
                      <Text style={styles.historyHours}>
                        {item.usageHours.toFixed(1)} hours usage
                      </Text>
                    )}
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyConsumption}>
                      {(item.cumulativeKwh || 0).toFixed(3)} kWh
                    </Text>
                    <Text style={styles.historyCumulativeLabel}>
                      Cumulative
                    </Text>
                  </View>
                </View>
              ))}

              {usageData.length > 10 && (
                <Text style={styles.moreRecords}>
                  and {usageData.length - 10} more records...
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    color: "#333",
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  errorText: {
    color: "#333",
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#4285F4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  deviceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deviceHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  deviceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    color: "#333",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  deviceType: {
    color: "#666",
    fontSize: 14,
    marginBottom: 8,
    textTransform: "capitalize",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    color: "#333",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  specLabel: {
    color: "#666",
    fontSize: 14,
  },
  specValue: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  totalConsumption: {
    color: "#4285F4",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  summarySubtitle: {
    color: "#666",
    fontSize: 14,
  },
  realTimeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  realTimeTitle: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  realTimeConsumption: {
    color: "#4CAF50",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  realTimeSubtitle: {
    color: "#666",
    fontSize: 12,
  },
  actionContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toggleButton: {
    backgroundColor: "#4CAF50",
  },
  turnOffButton: {
    backgroundColor: "#ff6b6b",
  },
  deleteButton: {
    backgroundColor: "#ff4444",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  historyTitle: {
    color: "#333",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  emptyHistory: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyHistoryText: {
    color: "#999",
    fontSize: 16,
    marginTop: 12,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  historyDevice: {
    color: "#666",
    fontSize: 12,
  },
  historyHours: {
    color: "#999",
    fontSize: 11,
    marginTop: 2,
  },
  historyRight: {
    alignItems: "flex-end",
  },
  historyConsumption: {
    color: "#4285F4",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  historyCumulativeLabel: {
    color: "#999",
    fontSize: 10,
  },
  moreRecords: {
    color: "#999",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  // Warning section styles
  warningSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  warningIcon: {
    marginRight: 8,
  },
  warningText: {
    color: "#FF9500",
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});
