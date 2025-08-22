import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthenticatedWrapper } from "@/components/AuthenticatedWrapper";
import { ThresholdSettingsModal } from "@/components/ThresholdSettingsModal";
import {
  AlertService,
  AlertThreshold,
  AlertSettings,
} from "@/services/AlertService";

export default function AlertPage() {
  const router = useRouter();
  const [alertSettings, setAlertSettings] = useState<AlertSettings | null>(
    null
  );
  const [selectedThreshold, setSelectedThreshold] =
    useState<AlertThreshold | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadAlertSettings();
  }, []);

  const loadAlertSettings = async () => {
    try {
      const settings = await AlertService.getAlertSettings();
      setAlertSettings(settings);
    } catch (error) {
      console.error("Error loading alert settings:", error);
    }
  };

  const handleThresholdPress = (threshold: AlertThreshold) => {
    setSelectedThreshold(threshold);
    setModalVisible(true);
  };

  const handleSaveThreshold = async (updatedThreshold: AlertThreshold) => {
    try {
      await AlertService.updateThreshold(updatedThreshold.id, updatedThreshold);
      await loadAlertSettings();
      Alert.alert("Success", "Threshold updated successfully");
    } catch (error) {
      console.error("Error saving threshold:", error);
      Alert.alert("Error", "Failed to update threshold");
    }
  };

  const handleToggleNotifications = async () => {
    if (!alertSettings) return;

    try {
      const newState = !alertSettings.notificationsEnabled;
      await AlertService.toggleNotifications(newState);
      await loadAlertSettings();

      if (newState) {
        const hasPermission =
          await AlertService.requestNotificationPermissions();
        if (!hasPermission) {
          Alert.alert(
            "Permission Required",
            "Please enable notifications in your device settings to receive alerts."
          );
        }
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
      Alert.alert("Error", "Failed to toggle notifications");
    }
  };

  const sendTestNotification = async () => {
    try {
      await AlertService.sendTestNotification();
      Alert.alert("Test Sent", "Check your notifications!");
    } catch (error) {
      console.error("Error sending test notification:", error);
      Alert.alert(
        "Error",
        "Failed to send test notification. Please check your notification permissions."
      );
    }
  };

  const renderThresholdItem = (threshold: AlertThreshold) => (
    <TouchableOpacity
      key={threshold.id}
      style={styles.settingItem}
      onPress={() => handleThresholdPress(threshold)}
    >
      <View style={styles.settingContent}>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{threshold.title}</Text>
          <Text style={styles.settingSubtitle}>
            Current: {threshold.value} {threshold.unit}
            {!threshold.enabled && " (Disabled)"}
          </Text>
        </View>
        <View style={styles.settingRight}>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <AuthenticatedWrapper showBudgetValidation={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Alerts</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Alert Settings */}
          <View style={styles.alertSettings}>
            <View style={styles.alertsHeader}>
              <View>
                <Text style={styles.alertsLabel}>Alert Settings</Text>
                <Text style={styles.enableAllText}>
                  Configure your alert thresholds
                </Text>
              </View>
              <TouchableOpacity
                style={styles.testButton}
                onPress={sendTestNotification}
              >
                <Ionicons
                  name="notifications-outline"
                  size={16}
                  color="#3B82F6"
                />
                <Text style={styles.testButtonText}>Test</Text>
              </TouchableOpacity>
            </View>

            {/* Notifications Toggle */}
            <TouchableOpacity
              style={styles.notificationToggle}
              onPress={handleToggleNotifications}
            >
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Enable Notifications</Text>
                <View
                  style={[
                    styles.toggle,
                    alertSettings?.notificationsEnabled && styles.toggleActive,
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      alertSettings?.notificationsEnabled &&
                        styles.toggleThumbActive,
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Alert Thresholds Section */}
          {alertSettings && (
            <View style={styles.section}>
              {alertSettings.thresholds.map((threshold) => (
                <View key={threshold.id}>{renderThresholdItem(threshold)}</View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Threshold Settings Modal */}
        <ThresholdSettingsModal
          visible={modalVisible}
          threshold={selectedThreshold}
          onClose={() => setModalVisible(false)}
          onSave={handleSaveThreshold}
        />
      </View>
    </AuthenticatedWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  alertSettings: {
    marginBottom: 24,
  },
  alertsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  alertsLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  enableAllText: {
    fontSize: 14,
    color: "#6B7280",
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  testButtonText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600",
    marginLeft: 4,
  },
  notificationToggle: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: "#3B82F6",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  section: {
    marginBottom: 24,
  },
  settingItem: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  settingSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
});
