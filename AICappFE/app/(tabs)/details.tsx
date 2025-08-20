import { Ionicons } from "@expo/vector-icons";
import { Box } from "@gluestack-ui/themed";
import { useFont } from "@shopify/react-native-skia";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CartesianChart,
  Line,
  useChartPressState,
  type CartesianChartRenderArg,
} from "victory-native";
import { BudgetService } from "@/services/BudgetService";

const inter = require("@/assets/fonts/Roboto-Regular.ttf");

export default function DetailsScreen() {
  const font = useFont(inter, 12);

  // Budget validation from API
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [budgetId, setBudgetId] = useState<string | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [budgetInput, setBudgetInput] = useState("0");
  const [loadingBudget, setLoadingBudget] = useState(true);

  // Load budget from API on component mount
  useEffect(() => {
    loadUserBudget();
  }, []);

  const loadUserBudget = async () => {
    try {
      setLoadingBudget(true);
      const budget = await BudgetService.getUserBudget();
      if (budget && budget.amount) {
        setMonthlyBudget(budget.amount);
        setBudgetInput(budget.amount.toString());
        setBudgetId(budget._id);
      } else {
        setMonthlyBudget(0);
        setBudgetInput("0");
        setBudgetId(null);
      }
    } catch (error) {
      console.log("Error loading budget:", error);
      setMonthlyBudget(0);
      setBudgetInput("0");
      setBudgetId(null);
    } finally {
      setLoadingBudget(false);
    }
  };

  useEffect(() => {
    console.log("Modal state changed to:", isEditModalVisible);
  }, [isEditModalVisible]);

  const budgetForecastData = useMemo(() => {
    // Return empty data if no budget is set
    if (monthlyBudget === 0 || !monthlyBudget) {
      return [
        { day: 1, value: 0, type: "actual", date: "Aug-01" },
        { day: 2, value: 0, type: "actual", date: "Aug-02" },
        { day: 3, value: 0, type: "actual", date: "Aug-03" },
        { day: 4, value: 0, type: "actual", date: "Aug-04" },
        { day: 5, value: 0, type: "actual", date: "Aug-05" },
      ];
    }

    return [
      { day: 1, value: 50, type: "actual", date: "Aug-01" },
      { day: 2, value: 95, type: "actual", date: "Aug-02" },
      { day: 3, value: 145, type: "actual", date: "Aug-03" },
      { day: 4, value: 200, type: "actual", date: "Aug-04" },
      { day: 5, value: 260, type: "actual", date: "Aug-05" },
      { day: 6, value: 320, type: "actual", date: "Aug-06" },
      { day: 7, value: 385, type: "actual", date: "Aug-07" },
      { day: 8, value: 450, type: "actual", date: "Aug-08" },
      { day: 9, value: 520, type: "actual", date: "Aug-09" },
      { day: 10, value: 590, type: "actual", date: "Aug-10" },
      { day: 11, value: 665, type: "actual", date: "Aug-11" },
      { day: 12, value: 740, type: "actual", date: "Aug-12" },
      { day: 13, value: 820, type: "actual", date: "Aug-13" },
      { day: 14, value: 900, type: "actual", date: "Aug-14" },
      { day: 15, value: 980, type: "actual", date: "Aug-15" },
      { day: 16, value: 1070, type: "actual", date: "Aug-16" },

      // Forecasted usage (blue) - Days 17-21
      { day: 17, value: 1150, type: "forecast", date: "Aug-17" },
      { day: 18, value: 1220, type: "forecast", date: "Aug-18" },
      { day: 19, value: 1290, type: "forecast", date: "Aug-19" },
      { day: 20, value: 1360, type: "forecast", date: "Aug-20" },
      { day: 21, value: 1430, type: "forecast", date: "Aug-21" },

      // Over budget (red) - Days 22-31
      { day: 22, value: 1510, type: "overBudget", date: "Aug-22" },
      { day: 23, value: 1590, type: "overBudget", date: "Aug-23" },
      { day: 24, value: 1670, type: "overBudget", date: "Aug-24" },
      { day: 25, value: 1750, type: "overBudget", date: "Aug-25" },
      { day: 26, value: 1830, type: "overBudget", date: "Aug-26" },
      { day: 27, value: 1910, type: "overBudget", date: "Aug-27" },
      { day: 28, value: 1990, type: "overBudget", date: "Aug-28" },
      { day: 29, value: 2070, type: "overBudget", date: "Aug-29" },
      { day: 30, value: 2150, type: "overBudget", date: "Aug-30" },
      { day: 31, value: 2230, type: "overBudget", date: "Aug-31" },
    ];
  }, [monthlyBudget]);

  const { state } = useChartPressState({
    x: budgetForecastData.length - 1,
    y: {
      value: 2230,
    },
  });

  const spentAmount = monthlyBudget === 0 ? 0 : 1070;
  const remainingAmount = monthlyBudget - spentAmount;
  const spentPercentage =
    monthlyBudget === 0 ? 0 : (spentAmount / monthlyBudget) * 100;

  const dailyAverage = monthlyBudget === 0 ? 0 : spentAmount / 16;
  const dailyRecommended = monthlyBudget === 0 ? 0 : monthlyBudget / 30;

  const handleEditBudget = () => {
    console.log("Edit budget button pressed!");
    console.log("Current modal state:", isEditModalVisible);
    setBudgetInput(monthlyBudget.toString());
    setIsEditModalVisible(true);
    console.log("Modal should now be set to true");
  };

  const handleSaveBudget = async () => {
    console.log("Save budget pressed, input:", budgetInput);
    const cleanInput = budgetInput.replace(/[^0-9]/g, "");
    const newBudget = parseInt(cleanInput);

    console.log("Parsed budget:", newBudget);

    if (newBudget && newBudget > 0) {
      try {
        // Save to API
        if (monthlyBudget === 0 || !budgetId) {
          // Create new budget
          await BudgetService.createBudget(newBudget);
        } else {
          // Update existing budget
          await BudgetService.updateBudget(budgetId, newBudget);
        }

        setMonthlyBudget(newBudget);
        setIsEditModalVisible(false);
        console.log("Budget updated to:", newBudget);
        Alert.alert(
          "Success",
          `Budget has been updated to IDR ${newBudget.toLocaleString("id-ID")}!`
        );

        // Reload budget data
        await loadUserBudget();
      } catch (error) {
        console.error("Error saving budget:", error);
        Alert.alert("Error", "Failed to save budget. Please try again.");
      }
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
        <Text style={styles.title}>Budget Overview</Text>
        <Text style={styles.monthLabel}>JULY 2025</Text>

        {loadingBudget ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading budget...</Text>
          </View>
        ) : (
          <>
            <View style={styles.budgetCard}>
              <View style={styles.budgetHeader}>
                <View style={styles.budgetAmountContainer}>
                  <Text style={styles.budgetAmount}>
                    {monthlyBudget === 0
                      ? "IDR 0.00"
                      : `IDR ${monthlyBudget.toLocaleString("id-ID")}.00`}
                  </Text>
                  {monthlyBudget === 0 ? (
                    <View style={styles.noBudgetIndicator}>
                      <Text style={styles.noBudgetText}>Not Set</Text>
                    </View>
                  ) : (
                    monthlyBudget !== 500000 && (
                      <View style={styles.modifiedIndicator}>
                        <Text style={styles.modifiedText}>Modified</Text>
                      </View>
                    )
                  )}
                </View>
                <TouchableOpacity
                  style={styles.budgetChange}
                  onPress={handleEditBudget}
                >
                  <Ionicons name="pencil" size={18} color="#007AFF" />
                  <Text style={styles.changeText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${spentPercentage}%` },
                    ]}
                  />
                </View>
              </View>

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
            <View style={styles.trendSection}>
              <Text style={styles.sectionTitle}>Trend</Text>

              <View style={styles.warningCard}>
                <Ionicons name="warning" size={20} color="#FF6B6B" />
                <Text style={styles.warningText}>
                  16/07 You risk overspending!
                </Text>
              </View>

              {/* Chart */}
              <Box style={styles.chartContainer}>
                <Text style={styles.sectionTitle}>
                  Monthly Energy Budget Forecast
                </Text>
                <CartesianChart
                  data={budgetForecastData}
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
                    {
                      day: number;
                      value: number;
                      type: string;
                      date: string;
                    },
                    "value"
                  >) => {
                    const actualPoints = points.value.filter(
                      (_, i) => budgetForecastData[i]?.type === "actual"
                    );
                    const forecastPoints = points.value.filter(
                      (_, i) => budgetForecastData[i]?.type === "forecast"
                    );
                    const overBudgetPoints = points.value.filter(
                      (_, i) => budgetForecastData[i]?.type === "overBudget"
                    );

                    return (
                      <>
                        <Line
                          points={[
                            {
                              x: chartBounds.left,
                              y: chartBounds.top + 150,
                              xValue: 1,
                              yValue: 1500,
                            },
                            {
                              x: chartBounds.right,
                              y: chartBounds.top + 150,
                              xValue: 31,
                              yValue: 1500,
                            },
                          ]}
                          color="#6B7280"
                          strokeWidth={2}
                        />

                        <Line
                          points={[
                            {
                              x:
                                chartBounds.left +
                                (16 * (chartBounds.right - chartBounds.left)) /
                                  31,
                              y: chartBounds.top,
                              xValue: 17,
                              yValue: 0,
                            },
                            {
                              x:
                                chartBounds.left +
                                (16 * (chartBounds.right - chartBounds.left)) /
                                  31,
                              y: chartBounds.bottom,
                              xValue: 17,
                              yValue: 2500,
                            },
                          ]}
                          color="#9CA3AF"
                          strokeWidth={1}
                        />

                        <Line
                          points={[
                            {
                              x:
                                chartBounds.left +
                                (21 * (chartBounds.right - chartBounds.left)) /
                                  31,
                              y: chartBounds.top,
                              xValue: 22,
                              yValue: 0,
                            },
                            {
                              x:
                                chartBounds.left +
                                (21 * (chartBounds.right - chartBounds.left)) /
                                  31,
                              y: chartBounds.bottom,
                              xValue: 22,
                              yValue: 2500,
                            },
                          ]}
                          color="#F87171"
                          strokeWidth={1}
                        />

                        {actualPoints.length > 0 && (
                          <Line
                            points={actualPoints}
                            color="#22c55e"
                            strokeWidth={4}
                            animate={{ type: "timing", duration: 500 }}
                          />
                        )}

                        {actualPoints.length > 0 &&
                          forecastPoints.length > 0 && (
                            <Line
                              points={[
                                actualPoints[actualPoints.length - 1],
                                forecastPoints[0],
                              ]}
                              color="#22c55e"
                              strokeWidth={4}
                              animate={{ type: "timing", duration: 500 }}
                            />
                          )}

                        {forecastPoints.length > 0 && (
                          <Line
                            points={forecastPoints}
                            color="#3b82f6"
                            strokeWidth={4}
                            animate={{ type: "timing", duration: 500 }}
                          />
                        )}

                        {forecastPoints.length > 0 &&
                          overBudgetPoints.length > 0 && (
                            <Line
                              points={[
                                forecastPoints[forecastPoints.length - 1],
                                overBudgetPoints[0],
                              ]}
                              color="#3b82f6"
                              strokeWidth={4}
                              animate={{ type: "timing", duration: 500 }}
                            />
                          )}

                        {overBudgetPoints.length > 0 && (
                          <Line
                            points={overBudgetPoints}
                            color="#ef4444"
                            strokeWidth={4}
                            animate={{ type: "timing", duration: 500 }}
                          />
                        )}
                      </>
                    );
                  }}
                </CartesianChart>

                <View style={styles.chartLegendContainer}>
                  <View style={styles.chartLegendItem}>
                    <View
                      style={[
                        styles.chartLegendDot,
                        { backgroundColor: "#22c55e" },
                      ]}
                    />
                    <Text style={styles.chartLegendText}>
                      Actual Cumulative Usage
                    </Text>
                  </View>
                  <View style={styles.chartLegendItem}>
                    <View
                      style={[
                        styles.chartLegendDot,
                        { backgroundColor: "#3b82f6" },
                      ]}
                    />
                    <Text style={styles.chartLegendText}>
                      Forecasted Cumulative Usage
                    </Text>
                  </View>
                  <View style={styles.chartLegendItem}>
                    <View
                      style={[
                        styles.chartLegendDot,
                        { backgroundColor: "#6B7280" },
                      ]}
                    />
                    <Text style={styles.chartLegendText}>
                      Budget Limit (1500 kWh)
                    </Text>
                  </View>
                  <View style={styles.chartLegendItem}>
                    <View
                      style={[
                        styles.chartLegendDot,
                        { backgroundColor: "#ef4444" },
                      ]}
                    />
                    <Text style={styles.chartLegendText}>Over Budget</Text>
                  </View>
                  <View style={styles.chartLegendItem}>
                    <View
                      style={[
                        styles.chartLegendDot,
                        {
                          backgroundColor: "#ef4444",
                          height: 2,
                          width: 12,
                          borderRadius: 0,
                        },
                      ]}
                    />
                    <Text style={styles.chartLegendText}>
                      Forecast Start Date
                    </Text>
                  </View>
                </View>
              </Box>
            </View>

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

            {/* AI Recommendation Section */}
            <View style={styles.aiRecommendationContainer}>
              <View style={styles.aiRecommendationHeader}>
                <Ionicons name="bulb" size={24} color="#4F46E5" />
                <Text style={styles.aiRecommendationTitle}>
                  AI Recommendation
                </Text>
              </View>
              <View style={styles.aiRecommendationContent}>
                <Text style={styles.aiRecommendationText}>
                  Based on your current energy usage pattern, you&apos;re on
                  track to exceed your monthly budget by 15%. Here are some
                  personalized recommendations:
                </Text>
                <View style={styles.recommendationItem}>
                  <View style={styles.recommendationBullet} />
                  <Text style={styles.recommendationText}>
                    Consider reducing air conditioning usage by 2-3 hours daily
                    to save approximately IDR 200-300 per day.
                  </Text>
                </View>
                <View style={styles.recommendationItem}>
                  <View style={styles.recommendationBullet} />
                  <Text style={styles.recommendationText}>
                    Switch to energy-efficient LED bulbs in high-usage areas to
                    reduce lighting costs by 20-30%.
                  </Text>
                </View>
                <View style={styles.recommendationItem}>
                  <View style={styles.recommendationBullet} />
                  <Text style={styles.recommendationText}>
                    Optimize your refrigerator temperature to 3-4°C to maintain
                    efficiency while reducing energy consumption.
                  </Text>
                </View>
                <Text style={styles.aiRecommendationFooter}>
                  💡 Following these recommendations could help you stay within
                  budget and save up to IDR 450 monthly.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {isEditModalVisible && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleCancelEdit}
          />
          <View style={styles.modalContent}>
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
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: 30,
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
    height: 350,
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

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 320,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 15,
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
  chartLegendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 10,
    flexWrap: "wrap",
  },
  chartLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  chartLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  chartLegendText: {
    fontSize: 12,
    color: "#6B7280",
  },
  // AI Recommendation Styles
  aiRecommendationContainer: {
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
    borderLeftWidth: 4,
    borderLeftColor: "#4F46E5",
  },
  aiRecommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  aiRecommendationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginLeft: 8,
  },
  aiRecommendationContent: {
    gap: 12,
  },
  aiRecommendationText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  recommendationBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4F46E5",
    marginTop: 7,
    marginRight: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    flex: 1,
  },
  aiRecommendationFooter: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
    marginTop: 8,
    padding: 12,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    textAlign: "center",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  noBudgetIndicator: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  noBudgetText: {
    fontSize: 12,
    color: "#D97706",
    fontWeight: "600",
  },
});
