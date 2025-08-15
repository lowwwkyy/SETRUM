import { DATA_1M, DATA_1W, DATA_3M } from "@/components/Utils/data";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { COLORMODES } from "@gluestack-style/react/lib/typescript/types";
import { Box } from "@gluestack-ui/themed";
import {
  Circle,
  LinearGradient,
  Text as SKText,
  useFont,
  vec,
} from "@shopify/react-native-skia";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture } from "react-native-gesture-handler";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import {
  Area,
  CartesianChart,
  Line,
  useChartPressState,
  type CartesianActionsHandle,
  type CartesianChartRenderArg,
} from "victory-native";

const inter = require("@/assets/fonts/Roboto-Regular.ttf");
const interBold = require("@/assets/fonts/Roboto-Bold.ttf");

export default function AppPage() {
  const font = useFont(inter, 12);
  const chartFont = useFont(interBold, 30);

  // Get the latest value from the initial data
  const getLatestValue = (data: typeof DATA_1M) => {
    return data.length > 0 ? data[data.length - 1].highTmp : 0;
  };

  const { state, isActive } = useChartPressState({
    x: DATA_1M.length - 1, // Set to last index
    y: { highTmp: getLatestValue(DATA_1M) }, // Set to latest value
  });
  const colorMode = useColorScheme() as COLORMODES;
  const [chartData, setChartData] = useState(DATA_1M);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<
    "1W" | "1M" | "3M"
  >("1M");
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const chartRef = useRef<CartesianActionsHandle<typeof state>>(null);

  // Update state when chartData changes to show latest value
  useEffect(() => {
    if (chartData.length > 0) {
      const latestValue = chartData[chartData.length - 1].highTmp;
      const latestIndex = chartData.length - 1;

      // Update the state values and reset tooltip
      state.x.value.value = latestIndex;
      state.y.highTmp.value.value = latestValue;
      state.isActive.value = false; // Reset tooltip setiap kali data berubah
    }
  }, [chartData, state.x.value, state.y.highTmp.value, state.isActive]);

  // Custom tap gesture for instant selection
  const tapGesture = Gesture.Tap().onStart((e) => {
    state.isActive.value = true;
    chartRef.current?.handleTouch(state, e.x, e.y);
  });

  const composedGesture = Gesture.Race(tapGesture);

  const value = useDerivedValue(() => {
    // Jika chart sedang tidak aktif (tidak ada interaksi), tampilkan nilai terakhir
    if (!state.isActive.value) {
      const latestValue =
        chartData.length > 0 ? chartData[chartData.length - 1].highTmp : 0;
      return latestValue.toFixed(2) + " kWh";
    }
    // Jika chart aktif (ada interaksi), tampilkan nilai yang dipilih
    return state.y.highTmp.value.value.toFixed(2) + " kWh";
  }, [state, chartData]);

  // Callback untuk handling perubahan timeframe
  const handleTimeFrameChange = (timeFrame: "1W" | "1M" | "3M") => {
    const timeFrameData = {
      "1W": DATA_1W,
      "1M": DATA_1M,
      "3M": DATA_3M,
    };

    const newData = timeFrameData[timeFrame];
    setChartData(newData);
    setSelectedTimeFrame(timeFrame);

    if (newData.length > 0) {
      const latestValue = newData[newData.length - 1].highTmp;
      const latestIndex = newData.length - 1;

      // Reset tooltip dan set state ke nilai terakhir
      setTimeout(() => {
        state.x.value.value = latestIndex;
        state.y.highTmp.value.value = latestValue;
        state.isActive.value = false; // Reset tooltip (sembunyikan)
      }, 100); // Small delay to ensure chart is updated
    }
  };

  const labelColor = colorMode === "dark" ? "black" : "white";
  const lineColor = colorMode === "dark" ? "gray" : "white";

  // Generate device-specific chart data
  const generateDeviceData = (
    deviceName: string,
    timeFrame: "1W" | "1M" | "3M"
  ) => {
    const baseData = {
      "1W": DATA_1W,
      "1M": DATA_1M,
      "3M": DATA_3M,
    }[timeFrame];

    // Device multipliers to create realistic individual device patterns
    // Base data shows ~150kWh daily average, so ~1050kWh weekly
    // To get target 100kWh weekly total, we need much smaller multipliers
    // Target: AC=35kWh, Heater=25kWh, Refrigerator=25kWh, Lighting=15kWh (100kWh total)
    const deviceMultipliers: { [key: string]: number } = {
      "Air Conditioner": 0.33, // 35kWh ÷ 1050kWh ≈ 0.33%
      Heater: 0.24, // 25kWh ÷ 1050kWh ≈ 0.24%
      Refrigerator: 0.24, // 25kWh ÷ 1050kWh ≈ 0.24%
      Lighting: 0.14, // 15kWh ÷ 1050kWh ≈ 0.14%
    };

    const multiplier = deviceMultipliers[deviceName] || 0.25;

    return baseData.map((item, index) => ({
      ...item,
      highTmp: Math.round(item.highTmp * multiplier * 100) / 100, // Round to 2 decimal places
    }));
  };

  // Update chart data when device or timeframe changes
  useEffect(() => {
    const getCurrentChartData = () => {
      if (selectedDevice) {
        return generateDeviceData(selectedDevice, selectedTimeFrame);
      }
      // Return total consumption data when no device is selected
      const timeFrameData = {
        "1W": DATA_1W,
        "1M": DATA_1M,
        "3M": DATA_3M,
      };
      return timeFrameData[selectedTimeFrame];
    };

    const newData = getCurrentChartData();
    setChartData(newData);
  }, [selectedDevice, selectedTimeFrame]);

  // Handle device selection
  const handleDevicePress = (deviceName: string) => {
    if (selectedDevice === deviceName) {
      // If clicking the same device, deselect it (show total consumption)
      setSelectedDevice(null);
    } else {
      // Select the new device
      setSelectedDevice(deviceName);
    }
  };

  // Get current devices data based on selected timeframe
  const devicesData = useMemo(() => {
    // Dynamic devices data based on timeframe
    const getDevicesData = (timeFrame: "1W" | "1M" | "3M") => {
      // Calculate total consumption for each device in the selected timeframe
      const getDeviceTotalConsumption = (deviceName: string) => {
        // Generate device-specific data for the timeframe
        const deviceData = generateDeviceData(deviceName, timeFrame);

        // Calculate total consumption by summing all data points in the timeframe
        const totalConsumption = deviceData.reduce(
          (sum, item) => sum + item.highTmp,
          0
        );

        return totalConsumption;
      };

      return [
        {
          name: "Air Conditioner",
          consumption: `${
            Math.round(getDeviceTotalConsumption("Air Conditioner") * 100) / 100
          } kWh`,
          icon: "snow" as const,
        },
        {
          name: "Heater",
          consumption: `${
            Math.round(getDeviceTotalConsumption("Heater") * 100) / 100
          } kWh`,
          icon: "flame" as const,
        },
        {
          name: "Refrigerator",
          consumption: `${
            Math.round(getDeviceTotalConsumption("Refrigerator") * 100) / 100
          } kWh`,
          icon: "thermometer" as const,
        },
        {
          name: "Lighting",
          consumption: `${
            Math.round(getDeviceTotalConsumption("Lighting") * 100) / 100
          } kWh`,
          icon: "bulb" as const,
        },
      ];
    };

    return getDevicesData(selectedTimeFrame);
  }, [selectedTimeFrame]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>
        {selectedDevice
          ? `${selectedDevice} - Energy Usage`
          : "Energy Dashboard"}
      </Text>

      <Box
        width="100%"
        $dark-bg="$black"
        $light-bg="$white"
        flex={1}
        alignItems="center"
        paddingHorizontal={5}
        paddingVertical={30}
      >
        <Box paddingTop={7} width="95%" height={400}>
          <CartesianChart
            data={chartData}
            xKey="day"
            yKeys={["highTmp"]}
            domainPadding={{ top: 30 }}
            axisOptions={{
              font,
              labelColor,
              lineColor,
            }}
            chartPressState={state}
            customGestures={composedGesture}
            actionsRef={chartRef}
          >
            {({
              points,
              chartBounds,
            }: CartesianChartRenderArg<
              { day: number; highTmp: number },
              "highTmp"
            >) => (
              <>
                <SKText
                  x={chartBounds.left + 15}
                  y={35}
                  font={chartFont}
                  text={value}
                  color={labelColor}
                  style={"fill"}
                />
                <Line
                  points={points.highTmp}
                  color="lightgreen"
                  strokeWidth={3}
                  animate={{ type: "timing", duration: 500 }}
                />
                <Area
                  points={points.highTmp}
                  y0={chartBounds.bottom}
                  animate={{ type: "timing", duration: 500 }}
                >
                  <LinearGradient
                    start={vec(chartBounds.bottom, 200)}
                    end={vec(chartBounds.bottom, chartBounds.bottom)}
                    colors={["green", "#90ee9050"]}
                  />
                </Area>

                {isActive ? (
                  <ToolTip x={state.x.position} y={state.y.highTmp.position} />
                ) : null}
              </>
            )}
          </CartesianChart>
        </Box>

        {/* Custom Bottom Section with Time Frame Buttons and Devices */}
        <Box marginTop={5} paddingTop={10} width="95%" justifyContent="center">
          {/* Time Frame Buttons */}
          <View style={styles.timeFrameContainer}>
            {(["1W", "1M", "3M"] as const).map((timeFrame) => (
              <TouchableOpacity
                key={timeFrame}
                onPress={() => handleTimeFrameChange(timeFrame)}
                style={[
                  styles.timeFrameButton,
                  selectedTimeFrame === timeFrame
                    ? styles.activeTimeFrame
                    : styles.inactiveTimeFrame,
                ]}
              >
                <Text
                  style={[
                    styles.timeFrameText,
                    selectedTimeFrame === timeFrame
                      ? styles.activeTimeFrameText
                      : styles.inactiveTimeFrameText,
                  ]}
                >
                  {timeFrame === "1W"
                    ? "1 Week"
                    : timeFrame === "1M"
                    ? "1 Month"
                    : "3 Months"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Devices Section */}
          <View style={styles.devicesSection}>
            <Text style={styles.sectionTitle}>
              {selectedDevice ? `${selectedDevice} Usage` : "Devices"}
            </Text>
            <View style={styles.devicesGrid}>
              {devicesData.map((device, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleDevicePress(device.name)}
                  style={[
                    styles.deviceCard,
                    selectedDevice === device.name && styles.selectedDeviceCard,
                  ]}
                >
                  <View style={styles.deviceIconContainer}>
                    <Ionicons
                      name={device.icon}
                      size={24}
                      color={
                        selectedDevice === device.name ? "#4285F4" : "black"
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.deviceName,
                      selectedDevice === device.name &&
                        styles.selectedDeviceName,
                    ]}
                  >
                    {device.name}
                  </Text>
                  <Text
                    style={[
                      styles.deviceConsumption,
                      selectedDevice === device.name &&
                        styles.selectedDeviceConsumption,
                    ]}
                  >
                    {device.consumption}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Box>
      </Box>
    </ScrollView>
  );
}
function ToolTip({ x, y }: { x: SharedValue<number>; y: SharedValue<number> }) {
  return <Circle cx={x} cy={y} r={8} color={"grey"} opacity={0.8} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: 40,
    paddingHorizontal: 10,
  },
  backButton: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    marginBottom: 16,
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
  },
  bottomSection: {
    padding: 16,
  },
  timeFrameContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 10,
    gap: 10,
    marginBottom: 20,
  },
  timeFrameButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 8,
  },
  activeTimeFrame: {
    backgroundColor: "black",
  },
  inactiveTimeFrame: {
    backgroundColor: "transparent",
  },
  timeFrameText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeTimeFrameText: {
    color: "white",
  },
  inactiveTimeFrameText: {
    color: "black",
  },
  devicesSection: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
    marginBottom: 15,
  },
  devicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  deviceCard: {
    width: "48%",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deviceIconContainer: {
    width: 50,
    height: 50,
    // backgroundColor: "grey",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: "600",
    color: "black",
    textAlign: "center",
    marginBottom: 5,
  },
  deviceConsumption: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
  },
  selectedDeviceCard: {
    backgroundColor: "#e8f0fe",
    borderColor: "#4285F4",
    borderWidth: 2,
  },
  selectedDeviceName: {
    color: "#4285F4",
  },
  selectedDeviceConsumption: {
    color: "#4285F4",
  },
});
