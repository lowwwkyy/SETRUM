import { Box, Button, Text } from "@gluestack-ui/themed";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";

export default function DetailsScreen() {
  const { type } = useLocalSearchParams();

  const isHighConsumption = type === "high";

  return (
    <SafeAreaView style={styles.container}>
      <Box style={styles.content}>
        <Text style={styles.title}>
          {isHighConsumption ? "High Consumption" : "Low Consumption"} Details
        </Text>

        <Box style={styles.infoContainer}>
          <Text style={styles.label}>Type:</Text>
          <Text style={styles.value}>
            {isHighConsumption ? "High Energy Usage" : "Low Energy Usage"}
          </Text>

          <Text style={styles.label}>Current Reading:</Text>
          <Text style={styles.value}>
            {isHighConsumption ? "15.30 kWh" : "0.50 kWh"}
          </Text>

          <Text style={styles.label}>Status:</Text>
          <Text
            style={[
              styles.value,
              { color: isHighConsumption ? "#dc2626" : "#16a34a" },
            ]}
          >
            {isHighConsumption ? "Alert: High Usage" : "Normal Usage"}
          </Text>

          <Text style={styles.label}>Recommendation:</Text>
          <Text style={styles.description}>
            {isHighConsumption
              ? "Consider turning off unused appliances and check for energy-efficient alternatives."
              : "Great job! Your energy consumption is within normal range."}
          </Text>
        </Box>

        <Button style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </Button>
      </Box>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 20,
    textAlign: "center",
  },
  infoContainer: {
    backgroundColor: "white",
    borderRadius: 12,
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
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 15,
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    color: "#1f2937",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 24,
    marginTop: 5,
  },
  backButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: "center",
    marginTop: 20,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
