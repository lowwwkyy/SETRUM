import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { AuthService } from "../services/AuthService";
import { DeviceService } from "../services/DeviceService";
import { BudgetService } from "../services/BudgetService";

export const TokenDebugComponent = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDebugInfo((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const clearLogs = () => {
    setDebugInfo([]);
  };

  const testAuthToken = async () => {
    try {
      addLog("🔍 Testing auth token...");

      // Get token directly
      const token = await AuthService.getToken();
      addLog(`Token exists: ${!!token}`);

      if (token) {
        addLog(`Token preview: ${token.substring(0, 30)}...`);
        addLog(`Token length: ${token.length}`);

        // Test if token is valid JWT
        try {
          const tokenParts = token.split(".");
          addLog(`Token parts: ${tokenParts.length} (should be 3 for JWT)`);

          if (tokenParts.length === 3) {
            // Decode payload (basic check, not verification)
            const payload = JSON.parse(atob(tokenParts[1]));
            addLog(`Token payload keys: ${Object.keys(payload).join(", ")}`);

            if (payload.exp) {
              const expDate = new Date(payload.exp * 1000);
              const now = new Date();
              addLog(`Token expires: ${expDate.toISOString()}`);
              addLog(`Token expired: ${expDate < now}`);
            }
          }
        } catch (jwtError) {
          addLog(`❌ Token is not valid JWT: ${jwtError}`);
        }
      } else {
        addLog("❌ No token found");
      }

      // Get user info
      const user = await AuthService.getUser();
      addLog(`User exists: ${!!user}`);
      if (user) {
        addLog(`User: ${user.email} (${user.provider})`);
      }
    } catch (error) {
      addLog(`❌ Error testing token: ${error}`);
    }
  };

  const testDeviceAPI = async () => {
    try {
      addLog("📱 Testing Device API...");
      const devices = await DeviceService.getUserDevices();
      addLog(`✅ Device API success: ${devices.length} devices found`);
    } catch (error) {
      addLog(`❌ Device API failed: ${error}`);
    }
  };

  const testBudgetAPI = async () => {
    try {
      addLog("💰 Testing Budget API...");
      const budget = await BudgetService.getUserBudget();
      addLog(`✅ Budget API success: ${budget ? "Budget found" : "No budget"}`);
    } catch (error) {
      addLog(`❌ Budget API failed: ${error}`);
    }
  };

  const testRelogin = async () => {
    try {
      addLog("🔄 Testing re-login...");

      // Clear existing auth
      await AuthService.logout();
      addLog("Cleared existing auth");

      // Try to login again with test credentials
      const response = await fetch(
        "https://0c50c26226de.ngrok-free.app/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
          }),
        }
      );

      addLog(`Re-login response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        addLog("✅ Re-login successful");

        // Save new token
        await AuthService.saveToken(data.token);
        await AuthService.saveUser({
          id: data.userId,
          name: data.displayName,
          email: "test@example.com",
          provider: "email",
        });

        addLog("New token and user saved");
      } else {
        const errorData = await response.json();
        addLog(`❌ Re-login failed: ${errorData.message}`);
      }
    } catch (error) {
      addLog(`❌ Re-login error: ${error}`);
    }
  };

  useEffect(() => {
    addLog("🚀 Token Debug Component loaded");
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Token Debug Panel</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testAuthToken}>
          <Text style={styles.buttonText}>Test Auth Token</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testDeviceAPI}>
          <Text style={styles.buttonText}>Test Device API</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testBudgetAPI}>
          <Text style={styles.buttonText}>Test Budget API</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testRelogin}>
          <Text style={styles.buttonText}>Test Re-login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={clearLogs}>
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Debug Logs:</Text>
        {debugInfo.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
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
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  buttonContainer: {
    marginBottom: 20,
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
  logContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    maxHeight: 400,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  logText: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: "monospace",
    color: "#333",
  },
});
