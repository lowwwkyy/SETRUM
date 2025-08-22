import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DeviceService } from "@/services/DeviceService";

interface AddDeviceModalProps {
  visible: boolean;
  onClose: () => void;
  onDeviceAdded: () => void;
}

const DEVICE_TYPES = [
  { type: "refrigerator", name: "Refrigerator", icon: "snow-outline" },
  { type: "washing_machine", name: "Washing Machine", icon: "water-outline" },
  { type: "dishwasher", name: "Dishwasher", icon: "restaurant-outline" },
  { type: "microwave", name: "Microwave", icon: "radio-outline" },
  { type: "oven", name: "Oven", icon: "flame-outline" },
  { type: "stove", name: "Stove", icon: "flame-outline" },
  {
    type: "air_conditioner",
    name: "Air Conditioner",
    icon: "thermometer-outline",
  },
  { type: "heater", name: "Heater", icon: "thermometer-outline" },
  { type: "television", name: "Television", icon: "tv-outline" },
  { type: "computer", name: "Computer", icon: "desktop-outline" },
  { type: "laptop", name: "Laptop", icon: "laptop-outline" },
  {
    type: "phone_charger",
    name: "Phone Charger",
    icon: "battery-charging-outline",
  },
  { type: "lighting", name: "Lighting", icon: "bulb-outline" },
  { type: "fan", name: "Fan", icon: "leaf-outline" },
  { type: "vacuum_cleaner", name: "Vacuum Cleaner", icon: "brush-outline" },
  { type: "blender", name: "Blender", icon: "nutrition-outline" },
  { type: "toaster", name: "Toaster", icon: "cafe-outline" },
  { type: "coffee_maker", name: "Coffee Maker", icon: "cafe-outline" },
  { type: "other", name: "Other", icon: "help-outline" },
];

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  visible,
  onClose,
  onDeviceAdded,
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddDevice = async () => {
    if (!selectedType) {
      Alert.alert("Error", "Please select a device type");
      return;
    }

    try {
      setIsAdding(true);
      console.log("🔧 Creating device with type:", selectedType);

      const deviceData = {
        type: selectedType,
        isOn: false,
      };

      console.log("📤 Sending device data:", deviceData);
      const result = await DeviceService.createDevice(deviceData);
      console.log("✅ Device created successfully:", result);

      Alert.alert("Success", "Device added successfully!");
      setSelectedType(null);
      onDeviceAdded();
      onClose();
    } catch (error) {
      console.error("❌ Error adding device:", error);
      Alert.alert("Error", "Failed to add device. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.title}>Add New Device</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.subtitle}>Select Device Type:</Text>

            <View style={styles.deviceGrid}>
              {DEVICE_TYPES.slice(0, 6).map((device) => (
                <TouchableOpacity
                  key={device.type}
                  style={[
                    styles.deviceOption,
                    selectedType === device.type && styles.selectedOption,
                  ]}
                  onPress={() => setSelectedType(device.type)}
                >
                  <Ionicons
                    name={device.icon as any}
                    size={32}
                    color={selectedType === device.type ? "#4285F4" : "#666"}
                    style={styles.deviceIcon}
                  />
                  <Text
                    style={[
                      styles.deviceName,
                      selectedType === device.type && styles.selectedDeviceName,
                    ]}
                  >
                    {device.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Footer Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.addButton, !selectedType && styles.disabledButton]}
              onPress={handleAddDevice}
              disabled={!selectedType || isAdding}
            >
              <Text style={styles.addButtonText}>
                {isAdding ? "Adding..." : "Add Device"}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  closeButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
    marginRight: 30, // Kompensasi untuk tombol close
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    textAlign: "left",
  },
  deviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  deviceOption: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  selectedOption: {
    backgroundColor: "#e3f2fd",
    borderColor: "#4285F4",
  },
  deviceIcon: {
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
  selectedDeviceName: {
    color: "#4285F4",
    fontWeight: "600",
  },
  footer: {
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  addButton: {
    backgroundColor: "#4285F4",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    width: "100%",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Legacy styles untuk fallback
  placeholder: {
    width: 34,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  deviceOptionText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500",
  },
  selectedOptionText: {
    color: "#4285F4",
    fontWeight: "600",
  },
});
