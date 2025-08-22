import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AlertThreshold } from "@/services/AlertService";

interface ThresholdSettingsModalProps {
  visible: boolean;
  threshold: AlertThreshold | null;
  onClose: () => void;
  onSave: (threshold: AlertThreshold) => void;
}

export function ThresholdSettingsModal({
  visible,
  threshold,
  onClose,
  onSave,
}: ThresholdSettingsModalProps) {
  const [value, setValue] = useState(threshold?.value.toString() || "");
  const [enabled, setEnabled] = useState<boolean>(threshold?.enabled || true);

  React.useEffect(() => {
    if (threshold) {
      setValue(threshold.value.toString());
      setEnabled(threshold.enabled);
    }
  }, [threshold]);

  const handleSave = () => {
    if (!threshold) return;

    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue < 0) {
      Alert.alert("Invalid Value", "Please enter a valid positive number");
      return;
    }

    const updatedThreshold: AlertThreshold = {
      ...threshold,
      value: numericValue,
      enabled,
    };

    onSave(updatedThreshold);
    onClose();
  };

  if (!threshold) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Alert Settings</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{threshold.title}</Text>
            <Text style={styles.sectionDescription}>
              Set the threshold value for {threshold.type} consumption alerts
            </Text>
          </View>

          {/* Enable/Disable Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Alerts</Text>
              <Text style={styles.settingSubtitle}>
                Receive notifications when threshold is exceeded
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, enabled && styles.toggleActive]}
              onPress={() => setEnabled(!enabled)}
            >
              <View
                style={[
                  styles.toggleThumb,
                  enabled && styles.toggleThumbActive,
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* Threshold Value Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Threshold Value</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={setValue}
                placeholder="Enter threshold value"
                keyboardType="numeric"
                editable={enabled}
              />
              <Text style={styles.unit}>{threshold.unit}</Text>
            </View>
            <Text style={styles.inputHint}>
              {threshold.type === "low"
                ? "Alert when consumption falls below this value"
                : "Alert when consumption exceeds this value"}
            </Text>
          </View>

          {/* Test Notification */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => {
              Alert.alert(
                "Test Notification",
                `This would send a test notification for ${threshold.title}`,
                [{ text: "OK" }]
              );
            }}
          >
            <Ionicons name="notifications-outline" size={20} color="#3B82F6" />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  saveButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: "#6B7280",
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
  inputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  unit: {
    fontSize: 16,
    color: "#6B7280",
    marginLeft: 8,
  },
  inputHint: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  testButtonText: {
    fontSize: 16,
    color: "#3B82F6",
    fontWeight: "600",
    marginLeft: 8,
  },
});
