import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useDeviceData } from "../hooks/useDeviceData";
import { DeviceService } from "../services/DeviceService";
import { ElectricityUsageService } from "../services/ElectricityUsageService";

export const DeviceTestComponent = () => {
  const { devices, usageSummary, loading, error, refreshData, hasDevices } =
    useDeviceData();

  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
  };

  const testCreateDevice = async () => {
    try {
      addTestResult("Testing device creation...");
      const newDevice = await DeviceService.createDevice({
        type: "lighting",
        isOn: true,
      });
      addTestResult(
        `✅ Device created: ${newDevice.type} (ID: ${newDevice._id})`
      );
    } catch (err) {
      addTestResult(
        `❌ Error creating device: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const testGetUsageSummary = async () => {
    try {
      addTestResult("Testing usage summary...");
      const summary = await ElectricityUsageService.getUsageSummary();
      addTestResult(
        `✅ Usage summary: ${summary.totalKwh} kWh total, ${summary.avgDailyKwh} kWh avg daily`
      );
    } catch (err) {
      addTestResult(
        `❌ Error getting usage summary: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const testGetAllUsage = async () => {
    try {
      addTestResult("Testing get all usage...");
      const usage = await ElectricityUsageService.getUserUsage();
      addTestResult(`✅ Found ${usage.length} usage records`);
      if (usage.length > 0) {
        const latest = usage[usage.length - 1];
        addTestResult(`   Latest: ${latest.dailyKwh} kWh on ${latest.date}`);
      }
    } catch (err) {
      addTestResult(
        `❌ Error getting usage: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Device API Test</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Data Summary</Text>
        <Text style={styles.info}>Loading: {loading ? "Yes" : "No"}</Text>
        <Text style={styles.info}>
          Has Devices: {hasDevices ? "Yes" : "No"}
        </Text>
        <Text style={styles.info}>Device Count: {devices.length}</Text>
        {error && <Text style={styles.error}>Error: {error}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Real Devices</Text>
        {devices.map((device, index) => (
          <View key={device._id} style={styles.deviceItem}>
            <Text style={styles.deviceName}>{device.deviceName}</Text>
            <Text style={styles.deviceInfo}>Type: {device.deviceType}</Text>
            <Text style={styles.deviceInfo}>Wattage: {device.wattage}W</Text>
            <Text style={styles.deviceInfo}>Status: {device.status}</Text>
            <Text style={styles.deviceInfo}>
              Today: {device.todayUsage.toFixed(2)} kWh
            </Text>
            <Text style={styles.deviceInfo}>
              Monthly: {device.monthlyUsage.toFixed(2)} kWh
            </Text>
          </View>
        ))}

        {!hasDevices && !loading && (
          <Text style={styles.info}>No devices found. Try creating one!</Text>
        )}
      </View>

      {usageSummary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage Summary</Text>
          <Text style={styles.info}>Total: {usageSummary.totalKwh} kWh</Text>
          <Text style={styles.info}>
            Daily Avg: {usageSummary.avgDailyKwh} kWh
          </Text>
          <Text style={styles.info}>Peak Day: {usageSummary.peakDay}</Text>
          <Text style={styles.info}>
            Peak Usage: {usageSummary.peakKwh} kWh
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Tests</Text>
        <TouchableOpacity style={styles.button} onPress={testCreateDevice}>
          <Text style={styles.buttonText}>Test Create Device</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testGetUsageSummary}>
          <Text style={styles.buttonText}>Test Usage Summary</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testGetAllUsage}>
          <Text style={styles.buttonText}>Test Get All Usage</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={refreshData}>
          <Text style={styles.buttonText}>Refresh Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.testResult}>
            {result}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  info: {
    fontSize: 14,
    marginBottom: 4,
    color: "#666",
  },
  error: {
    fontSize: 14,
    color: "#ff0000",
    marginBottom: 4,
  },
  deviceItem: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  deviceInfo: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  button: {
    backgroundColor: "#4285F4",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  clearButton: {
    backgroundColor: "#ff6b6b",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  testResult: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: "monospace",
    color: "#333",
  },
});
