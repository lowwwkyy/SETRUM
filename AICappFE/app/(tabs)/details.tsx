import { DATA_1M } from "@/components/Utils/data";
import { Ionicons } from "@expo/vector-icons";
import { Box } from "@gluestack-ui/themed";
import { LinearGradient, useFont, vec } from "@shopify/react-native-skia";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Area,
  CartesianChart,
  Line,
  useChartPressState,
  type CartesianChartRenderArg,
} from "victory-native";

const inter = require("@/assets/fonts/Roboto-Regular.ttf");

export default function DetailsScreen() {
  const font = useFont(inter, 12);

  // Budget data with state
  const [monthlyBudget, setMonthlyBudget] = useState(500000);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [budgetInput, setBudgetInput] = useState("500000");
  const spentAmount = 251900;
  const remainingAmount = monthlyBudget - spentAmount;
  const spentPercentage = (spentAmount / monthlyBudget) * 100;

  // Generate spending data based on actual consumption data
  const spendingData = useMemo(() => {
    // Convert energy consumption to cost (IDR per kWh = 1500)
    const costPerKwh = 1500;
    const baseBudget = 500000; // Use fixed base budget to prevent infinite loop
    return DATA_1M.slice(0, 16).map((item, index) => ({
      day: index + 1,
      actualSpent: item.highTmp * costPerKwh * 0.12, // Scale down for realistic spending
      forecastSpent:
        (baseBudget / 30) * (index + 1) + (Math.random() * 5000 - 2500), // Budget line with variance
      forecastOverspend: item.highTmp * costPerKwh * 0.18, // Higher spending forecast
    }));
  }, []); // Remove monthlyBudget dependency to prevent infinite loop

  const [selectedChart, setSelectedChart] = useState<
    "spent" | "forecast" | "overspend"
  >("spent");

  const { state } = useChartPressState({
    x: spendingData.length - 1,
    y: {
      value: spendingData[spendingData.length - 1]?.actualSpent || 0,
    },
  });

  // Get current chart data based on selection
  const currentChartData = useMemo(() => {
    return spendingData.map((item) => ({
      day: item.day,
      value:
        selectedChart === "spent"
          ? item.actualSpent
          : selectedChart === "forecast"
          ? item.forecastSpent
          : item.forecastOverspend,
    }));
  }, [spendingData, selectedChart]);

  // Calculate daily averages
  const dailyAverage = spentAmount / 16; // Assuming 16 days have passed
  const dailyRecommended = monthlyBudget / 30;

  // Handle budget editing
  const handleEditBudget = () => {
    console.log("Edit budget button pressed");
    // Use simple string conversion instead of locale formatting
    setBudgetInput(monthlyBudget.toString());
    setIsEditModalVisible(true);
  };

  const handleSaveBudget = () => {
    console.log("Save budget pressed, input:", budgetInput);
    // Remove commas and non-numeric characters, then convert to number
    const cleanInput = budgetInput.replace(/[^0-9]/g, "");
    const newBudget = parseInt(cleanInput);

    console.log("Parsed budget:", newBudget);

    if (newBudget && newBudget > 0) {
      setMonthlyBudget(newBudget);
      setIsEditModalVisible(false);
      console.log("Budget updated to:", newBudget);
      Alert.alert(
        "Success",
        `Budget has been updated to IDR ${newBudget.toLocaleString("id-ID")}!`
      );
    } else {
      Alert.alert(
        "Error",
        "Please enter a valid budget amount (must be greater than 0)"
      );
    }
  };

  const handleCancelEdit = () => {
    console.log("Cancel edit pressed");
    setBudgetInput(monthlyBudget.toString());
    setIsEditModalVisible(false);
  };

  const formatCurrency = (amount: string) => {
    // Remove all non-numeric characters
    const numericValue = amount.replace(/[^0-9]/g, "");
    return numericValue;
  };

  const handleBudgetInputChange = (text: string) => {
    console.log("Input changed:", text);
    const cleaned = formatCurrency(text);
    console.log("Cleaned:", cleaned);
    setBudgetInput(cleaned);
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.title}>Budget Overview</Text>
        <Text style={styles.monthLabel}>JULY 2025</Text>

        {/* Debug button - temporary */}
        <TouchableOpacity
          style={{
            backgroundColor: "#007AFF",
            padding: 10,
            borderRadius: 5,
            marginBottom: 10,
            alignItems: "center",
          }}
          onPress={() => {
            console.log("Debug button pressed");
            Alert.alert("Debug", "Button working!");
          }}
        >
          <Text style={{ color: "white" }}>Test Button (Debug)</Text>
        </TouchableOpacity>

        {/* Budget Progress Section */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <View style={styles.budgetAmountContainer}>
              <Text style={styles.budgetAmount}>
                IDR {monthlyBudget.toLocaleString("id-ID")}.00
              </Text>
              {monthlyBudget !== 500000 && (
                <View style={styles.modifiedIndicator}>
                  <Text style={styles.modifiedText}>Modified</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.budgetChange}
              onPress={handleEditBudget}
              onPressIn={() => console.log("Button press in")}
              onPressOut={() => console.log("Button press out")}
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="pencil" size={18} color="#007AFF" />
              <Text style={styles.changeText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View
                style={[styles.progressFill, { width: `${spentPercentage}%` }]}
              />
            </View>
          </View>

          {/* Spent and Remaining */}
          <View style={styles.budgetDetails}>
            <View style={styles.budgetItem}>
              <Text style={styles.budgetLabel}>
                IDR {spentAmount.toLocaleString("id-ID")}.00
              </Text>
              <Text style={styles.budgetSubLabel}>Spent</Text>
            </View>
            <View style={styles.budgetItem}>
              <Text style={styles.budgetLabel}>
                IDR {remainingAmount.toLocaleString("id-ID")}.00
              </Text>
              <Text style={styles.budgetSubLabel}>Remains</Text>
            </View>
          </View>
        </View>

        {/* Trend Section */}
        <View style={styles.trendSection}>
          <Text style={styles.sectionTitle}>Trend</Text>

          {/* Warning Alert */}
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={20} color="#FF6B6B" />
            <Text style={styles.warningText}>16/07 You risk overspending!</Text>
          </View>

          {/* Chart Legend */}
          <View style={styles.chartLegend}>
            <TouchableOpacity
              style={[
                styles.legendItem,
                selectedChart === "spent" && styles.activeLegend,
              ]}
              onPress={() => setSelectedChart("spent")}
            >
              <View
                style={[styles.legendDot, { backgroundColor: "#4CAF50" }]}
              />
              <Text style={styles.legendText}>Spent</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.legendItem,
                selectedChart === "forecast" && styles.activeLegend,
              ]}
              onPress={() => setSelectedChart("forecast")}
            >
              <View
                style={[styles.legendDot, { backgroundColor: "#2196F3" }]}
              />
              <Text style={styles.legendText}>Forecast</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.legendItem,
                selectedChart === "overspend" && styles.activeLegend,
              ]}
              onPress={() => setSelectedChart("overspend")}
            >
              <View
                style={[styles.legendDot, { backgroundColor: "#FF6B6B" }]}
              />
              <Text style={styles.legendText}>Forecast overspend</Text>
            </TouchableOpacity>
          </View>

          {/* Chart */}
          <Box style={styles.chartContainer}>
            <CartesianChart
              data={currentChartData}
              xKey="day"
              yKeys={["value"]}
              domainPadding={{ top: 30 }}
              axisOptions={{
                font,
                labelColor: "black",
                lineColor: "#E0E0E0",
              }}
              chartPressState={state}
            >
              {({
                points,
                chartBounds,
              }: CartesianChartRenderArg<
                { day: number; value: number },
                "value"
              >) => (
                <>
                  <Line
                    points={points.value}
                    color={
                      selectedChart === "spent"
                        ? "#4CAF50"
                        : selectedChart === "forecast"
                        ? "#2196F3"
                        : "#FF6B6B"
                    }
                    strokeWidth={3}
                    animate={{ type: "timing", duration: 500 }}
                  />
                  <Area
                    points={points.value}
                    y0={chartBounds.bottom}
                    animate={{ type: "timing", duration: 500 }}
                  >
                    <LinearGradient
                      start={vec(chartBounds.bottom, 200)}
                      end={vec(chartBounds.bottom, chartBounds.bottom)}
                      colors={[
                        selectedChart === "spent"
                          ? "#4CAF50"
                          : selectedChart === "forecast"
                          ? "#2196F3"
                          : "#FF6B6B",
                        selectedChart === "spent"
                          ? "#4CAF5050"
                          : selectedChart === "forecast"
                          ? "#2196F350"
                          : "#FF6B6B50",
                      ]}
                    />
                  </Area>
                </>
              )}
            </CartesianChart>
          </Box>
        </View>

        {/* Daily Stats */}
        <View style={styles.dailyStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              IDR {Math.round(dailyAverage).toLocaleString("id-ID")}.50
            </Text>
            <Text style={styles.statLabel}>Daily average</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              IDR {Math.round(dailyRecommended).toLocaleString("id-ID")}.50
            </Text>
            <Text style={styles.statLabel}>Daily recommended</Text>
          </View>
        </View>
      </ScrollView>

      {/* Budget Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCancelEdit}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={() => {}} // Prevent modal close when tapping content
          >
            <Text style={styles.modalTitle}>Edit Monthly Budget</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Budget Amount (IDR)</Text>
              <TextInput
                style={styles.budgetInput}
                value={budgetInput}
                onChangeText={handleBudgetInputChange}
                placeholder="Enter budget amount"
                keyboardType="numeric"
                maxLength={20}
                autoFocus={true}
                selectTextOnFocus={true}
                returnKeyType="done"
                onSubmitEditing={handleSaveBudget}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveBudget}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    marginBottom: 8,
  },
  monthLabel: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  budgetCard: {
    backgroundColor: "white",
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
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  budgetAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "black",
  },
  budgetAmountContainer: {
    flex: 1,
  },
  modifiedIndicator: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  modifiedText: {
    fontSize: 10,
    color: "white",
    fontWeight: "600",
  },
  budgetChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0F8FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  changeText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBackground: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 4,
  },
  budgetDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  budgetItem: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
    marginBottom: 5,
  },
  budgetSubLabel: {
    fontSize: 14,
    color: "#666",
  },
  trendSection: {
    backgroundColor: "white",
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
    marginBottom: 15,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#F87171",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 10,
  },
  warningText: {
    fontSize: 14,
    color: "#DC2626",
    fontWeight: "500",
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeLegend: {
    backgroundColor: "#F3F4F6",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  chartContainer: {
    height: 250,
    marginBottom: 20,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 10,
  },
  dailyStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
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
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  budgetInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "black",
    backgroundColor: "#F9FAFB",
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
