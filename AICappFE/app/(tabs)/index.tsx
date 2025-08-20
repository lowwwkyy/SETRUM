import { DATA_1M, DATA_1W, DATA_3M } from "@/components/Utils/data";
import { useColorScheme } from "@/hooks/useColorScheme";
import { AuthenticatedWrapper } from "@/components/AuthenticatedWrapper";
import { useBudgetValidation } from "@/hooks/useBudgetValidation";
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
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture } from "react-native-gesture-handler";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import { router } from "expo-router";
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

  const { hasBudget, isLoading: budgetLoading } = useBudgetValidation();

  const EMPTY_DATA = useMemo(
    () => [
      { day: 1, highTmp: 0 },
      { day: 2, highTmp: 0 },
      { day: 3, highTmp: 0 },
      { day: 4, highTmp: 0 },
      { day: 5, highTmp: 0 },
    ],
    []
  );

  const getChartDataBasedOnBudget = useCallback(
    (timeFrame: "1W" | "1M" | "3M") => {
      if (!hasBudget && !budgetLoading) {
        return EMPTY_DATA;
      }

      const timeFrameData = {
        "1W": DATA_1W,
        "1M": DATA_1M,
        "3M": DATA_3M,
      };
      return timeFrameData[timeFrame];
    },
    [hasBudget, budgetLoading, EMPTY_DATA]
  );

  const { state, isActive } = useChartPressState({
    x: EMPTY_DATA.length - 1,
    y: { highTmp: 0 },
  });
  const colorMode = useColorScheme() as COLORMODES;
  const [chartData, setChartData] = useState(EMPTY_DATA);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<
    "1W" | "1M" | "3M"
  >("1M");
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [currentSliderPage, setCurrentSliderPage] = useState(0);
  const chartRef = useRef<CartesianActionsHandle<typeof state>>(null);
  const sliderRef = useRef<FlatList>(null);

  useEffect(() => {
    const newData = getChartDataBasedOnBudget(selectedTimeFrame);
    setChartData(newData);
  }, [hasBudget, budgetLoading, selectedTimeFrame, getChartDataBasedOnBudget]);

  useEffect(() => {
    if (chartData.length > 0) {
      const latestValue = chartData[chartData.length - 1].highTmp;
      const latestIndex = chartData.length - 1;

      state.x.value.value = latestIndex;
      state.y.highTmp.value.value = latestValue;
      state.isActive.value = false;
    }
  }, [chartData, state.x.value, state.y.highTmp.value, state.isActive]);

  const tapGesture = Gesture.Tap().onStart((e) => {
    state.isActive.value = true;
    chartRef.current?.handleTouch(state, e.x, e.y);
  });

  const composedGesture = Gesture.Race(tapGesture);

  const value = useDerivedValue(() => {
    if (!hasBudget && !budgetLoading) {
      return "No Data Available";
    }

    if (!state.isActive.value) {
      const latestValue =
        chartData.length > 0 ? chartData[chartData.length - 1].highTmp : 0;
      return latestValue.toFixed(2) + " kWh";
    }
    return state.y.highTmp.value.value.toFixed(2) + " kWh";
  }, [state, chartData, hasBudget, budgetLoading]);

  const handleTimeFrameChange = (timeFrame: "1W" | "1M" | "3M") => {
    setSelectedTimeFrame(timeFrame);
    const newData = getChartDataBasedOnBudget(timeFrame);
    setChartData(newData);

    if (newData.length > 0) {
      const latestValue = newData[newData.length - 1].highTmp;
      const latestIndex = newData.length - 1;

      setTimeout(() => {
        state.x.value.value = latestIndex;
        state.y.highTmp.value.value = latestValue;
        state.isActive.value = false;
      }, 100);
    }
  };

  const labelColor = colorMode === "dark" ? "black" : "white";
  const lineColor = colorMode === "dark" ? "gray" : "white";

  const generateDeviceData = useCallback(
    (deviceName: string, timeFrame: "1W" | "1M" | "3M") => {
      // Return empty data if budget not set
      if (!hasBudget && !budgetLoading) {
        return EMPTY_DATA;
      }

      const baseData = {
        "1W": DATA_1W,
        "1M": DATA_1M,
        "3M": DATA_3M,
      }[timeFrame];

      const deviceMultipliers: { [key: string]: number } = {
        "Air Conditioner": 0.33,
        Heater: 0.24,
        Refrigerator: 0.24,
        Lighting: 0.14,
        "Washing Machine": 0.18,
        TV: 0.12,
        Microwave: 0.08,
        Computer: 0.15,
      };

      const multiplier = deviceMultipliers[deviceName] || 0.25;

      return baseData.map((item, index) => ({
        ...item,
        highTmp: Math.round(item.highTmp * multiplier * 100) / 100,
      }));
    },
    [hasBudget, budgetLoading, EMPTY_DATA]
  );

  useEffect(() => {
    const getCurrentChartData = () => {
      if (!hasBudget && !budgetLoading) {
        return EMPTY_DATA;
      }

      if (selectedDevice) {
        return generateDeviceData(selectedDevice, selectedTimeFrame);
      }
      return getChartDataBasedOnBudget(selectedTimeFrame);
    };

    const newData = getCurrentChartData();
    setChartData(newData);
  }, [
    selectedDevice,
    selectedTimeFrame,
    generateDeviceData,
    hasBudget,
    budgetLoading,
    EMPTY_DATA,
    getChartDataBasedOnBudget,
  ]);

  const handleDevicePress = (deviceName: string) => {
    if (selectedDevice === deviceName) {
      setSelectedDevice(null);
    } else {
      setSelectedDevice(deviceName);
    }
  };

  const devicesData = useMemo(() => {
    const getDevicesData = (timeFrame: "1W" | "1M" | "3M") => {
      if (!hasBudget && !budgetLoading) {
        return [
          {
            name: "Air Conditioner",
            consumption: "No Data Available",
            icon: "snow" as const,
          },
          {
            name: "Heater",
            consumption: "No Data Available",
            icon: "flame" as const,
          },
          {
            name: "Refrigerator",
            consumption: "No Data Available",
            icon: "thermometer" as const,
          },
          {
            name: "Lighting",
            consumption: "No Data Available",
            icon: "bulb" as const,
          },
          {
            name: "Washing Machine",
            consumption: "No Data Available",
            icon: "water" as const,
          },
          { name: "TV", consumption: "No Data Available", icon: "tv" as const },
          {
            name: "Microwave",
            consumption: "No Data Available",
            icon: "restaurant" as const,
          },
          {
            name: "Computer",
            consumption: "No Data Available",
            icon: "desktop" as const,
          },
        ];
      }

      const getDeviceTotalConsumption = (deviceName: string) => {
        const deviceData = generateDeviceData(deviceName, timeFrame);

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
        {
          name: "Washing Machine",
          consumption: `${
            Math.round(getDeviceTotalConsumption("Washing Machine") * 100) / 100
          } kWh`,
          icon: "water" as const,
        },
        {
          name: "TV",
          consumption: `${
            Math.round(getDeviceTotalConsumption("TV") * 100) / 100
          } kWh`,
          icon: "tv" as const,
        },
        {
          name: "Microwave",
          consumption: `${
            Math.round(getDeviceTotalConsumption("Microwave") * 100) / 100
          } kWh`,
          icon: "restaurant" as const,
        },
        {
          name: "Computer",
          consumption: `${
            Math.round(getDeviceTotalConsumption("Computer") * 100) / 100
          } kWh`,
          icon: "desktop" as const,
        },
      ];
    };

    return getDevicesData(selectedTimeFrame);
  }, [selectedTimeFrame, hasBudget, budgetLoading, generateDeviceData]);

  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  const devicePages = chunkArray(devicesData, 6);

  return (
    <AuthenticatedWrapper showBudgetValidation={false}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>
          {selectedDevice
            ? `${selectedDevice} - Energy Usage`
            : "Energy Dashboard"}
        </Text>

        {!hasBudget && !budgetLoading && (
          <View style={styles.noBudgetMessage}>
            <Text style={styles.noBudgetText}>
              📊 Set your monthly budget to view energy data and insights
            </Text>
            <TouchableOpacity
              style={styles.setBudgetButton}
              onPress={() => {
                router.push("/(tabs)/details");
              }}
            >
              <Text style={styles.setBudgetButtonText}>Set Budget</Text>
            </TouchableOpacity>
          </View>
        )}

        <Box
          width="100%"
          $dark-bg="$black"
          $light-bg="$white"
          alignItems="center"
          paddingHorizontal={5}
          paddingVertical={30}
        >
          <Box paddingTop={7} width="98%" height={450}>
            <CartesianChart
              data={chartData}
              xKey="day"
              yKeys={["highTmp"]}
              domainPadding={{ top: 100 }}
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
                    <ToolTip
                      x={state.x.position}
                      y={state.y.highTmp.position}
                    />
                  ) : null}
                </>
              )}
            </CartesianChart>
          </Box>

          <Box
            marginTop={5}
            paddingTop={10}
            width="95%"
            justifyContent="center"
          >
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

            <View style={styles.devicesSection}>
              <Text style={styles.sectionTitle}>
                {selectedDevice ? `${selectedDevice} Usage` : "Devices"}
              </Text>

              <FlatList
                ref={sliderRef}
                data={devicePages}
                horizontal
                pagingEnabled
                keyExtractor={(_, index) => `device-page-${index}`}
                showsHorizontalScrollIndicator={false}
                style={styles.deviceSlider}
                snapToInterval={330}
                decelerationRate="fast"
                getItemLayout={(data, index) => ({
                  length: 330,
                  offset: 330 * index,
                  index,
                })}
                onScroll={(event) => {
                  const pageIndex = Math.round(
                    event.nativeEvent.contentOffset.x / 330
                  );
                  setCurrentSliderPage(pageIndex);
                }}
                scrollEventThrottle={16}
                renderItem={({ item: pageDevices }) => (
                  <View style={styles.devicesGrid}>
                    {pageDevices.map((device: any, index: number) => (
                      <TouchableOpacity
                        key={device.name}
                        onPress={() => handleDevicePress(device.name)}
                        style={[
                          styles.deviceCard,
                          selectedDevice === device.name &&
                            styles.selectedDeviceCard,
                        ]}
                      >
                        <View style={styles.deviceIconContainer}>
                          <Ionicons
                            name={device.icon}
                            size={24}
                            color={
                              selectedDevice === device.name
                                ? "#4285F4"
                                : "black"
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
                )}
              />

              {devicePages.length > 1 && (
                <View style={styles.sliderDotsContainer}>
                  {devicePages.map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.sliderDot,
                        currentSliderPage === index && styles.activeDot,
                      ]}
                      onPress={() => {
                        setCurrentSliderPage(index);
                        sliderRef.current?.scrollToOffset({
                          offset: index * 330,
                          animated: true,
                        });
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          </Box>
        </Box>
      </ScrollView>
    </AuthenticatedWrapper>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
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
    marginBottom: 40,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
    marginBottom: 15,
  },
  deviceSlider: {
    height: 450,
  },
  devicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: 330,
    paddingHorizontal: 10,
    minHeight: 260,
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
  sliderDotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    paddingHorizontal: 10,
  },
  sliderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#4285F4",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  noBudgetMessage: {
    backgroundColor: "#fff3cd",
    borderColor: "#ffa000",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
    marginHorizontal: 10,
    alignItems: "center",
  },
  noBudgetText: {
    fontSize: 16,
    color: "#856404",
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "500",
  },
  setBudgetButton: {
    backgroundColor: "#4285F4",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  setBudgetButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
