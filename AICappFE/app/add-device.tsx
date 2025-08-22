import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DeviceService } from "../services/DeviceService";
import { router } from "expo-router";
// import * as Haptics from "expo-haptics"; // Temporarily disabled

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

export default function AddDevicePage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Helper function for safe haptic feedback
  const triggerHaptic = (type: "selection" | "impact" | "success") => {
    // Temporarily disable haptic feedback for debugging
    console.log(`Haptic ${type} triggered (disabled for debugging)`);
    // TODO: Re-enable when haptic issue is resolved
  };

  const handleAddDevice = async () => {
    if (!selectedType) {
      Alert.alert("Error", "Please select a device type");
      return;
    }

    try {
      setIsAdding(true);
      // Haptic feedback for button press
      triggerHaptic("impact");

      console.log("🔧 Creating device with type:", selectedType);
      const deviceData = {
        type: selectedType,
        isOn: false,
      };

      console.log("📤 Sending device data:", deviceData);
      const result = await DeviceService.createDevice(deviceData);
      console.log("✅ Device created successfully:", result);

      // Success haptic feedback
      triggerHaptic("success");

      Alert.alert("Success", "Device added successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Navigate back to home page - useFocusEffect will handle the reload
            router.replace("/(tabs)");
          },
        },
      ]);
    } catch (error) {
      console.error("❌ Error adding device:", error);
      Alert.alert("Error", "Failed to add device. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Add New Device</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Subtitle */}
        <Text style={styles.subtitle}>Select Device Type:</Text>

        {/* Device Grid */}
        <View style={styles.deviceGrid}>
          {DEVICE_TYPES.map((device) => (
            <TouchableOpacity
              key={device.type}
              style={[
                styles.deviceOption,
                selectedType === device.type && styles.selectedOption,
              ]}
              onPress={() => {
                triggerHaptic("selection");
                setSelectedType(device.type);
              }}
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
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addButton, !selectedType && styles.disabledButton]}
          onPress={handleAddDevice}
          disabled={!selectedType || isAdding}
        >
          {isAdding ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.addButtonText, { marginLeft: 8 }]}>
                Adding...
              </Text>
            </View>
          ) : (
            <Text style={styles.addButtonText}>Add Device</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  backButton: {
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
    marginRight: 34, // Kompensasi untuk tombol back
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  },
  deviceOption: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e5e5e5",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
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
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
