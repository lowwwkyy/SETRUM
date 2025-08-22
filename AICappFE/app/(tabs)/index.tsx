import { useColorScheme } from "@/hooks/useColorScheme";
import { AuthenticatedWrapper } from "@/components/AuthenticatedWrapper";
import { useBudgetValidation } from "@/hooks/useBudgetValidation";
import { ElectricityUsageService } from "@/services/ElectricityUsageService";
import { DeviceService } from "@/services/DeviceService";
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
import { useFocusEffect } from "@react-navigation/native";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
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

  const getDeviceIcon = (deviceType: string) => {
    const iconMap: { [key: string]: string } = {
      refrigerator: "snow-outline",
      washing_machine: "water-outline",
      dishwasher: "restaurant-outline",
      microwave: "radio-outline",
      oven: "flame-outline",
      stove: "flame-outline",
      air_conditioner: "thermometer-outline",
      heater: "thermometer-outline",
      television: "tv-outline",
      computer: "desktop-outline",
      laptop: "laptop-outline",
      phone_charger: "battery-charging-outline",
      lighting: "bulb-outline",
      fan: "leaf-outline",
      vacuum_cleaner: "brush-outline",
      blender: "nutrition-outline",
      toaster: "cafe-outline",
      coffee_maker: "cafe-outline",
      other: "help-outline",
    };
    return iconMap[deviceType] || "help-outline";
  };

  const getDeviceDisplayName = (deviceType: string) => {
    const nameMap: { [key: string]: string } = {
      refrigerator: "Refrigerator",
      washing_machine: "Washing Machine",
      dishwasher: "Dishwasher",
      microwave: "Microwave",
      oven: "Oven",
      stove: "Stove",
      air_conditioner: "Air Conditioner",
      heater: "Heater",
      television: "TV",
      computer: "Computer",
      laptop: "Laptop",
      phone_charger: "Phone Charger",
      lighting: "Lighting",
      fan: "Fan",
      vacuum_cleaner: "Vacuum Cleaner",
      blender: "Blender",
      toaster: "Toaster",
      coffee_maker: "Coffee Maker",
      other: "Other",
    };
    return nameMap[deviceType] || deviceType;
  };

  const getDeviceWattage = (deviceType: string) => {
    const wattageMap: { [key: string]: number } = {
      refrigerator: 150,
      washing_machine: 2000,
      dishwasher: 1800,
      microwave: 1200,
      oven: 2500,
      stove: 3000,
      air_conditioner: 1500,
      heater: 1200,
      television: 150,
      computer: 300,
      laptop: 65,
      phone_charger: 10,
      lighting: 60,
      fan: 75,
      vacuum_cleaner: 1000,
      blender: 400,
      toaster: 800,
      coffee_maker: 1000,
      other: 100,
    };
    return wattageMap[deviceType] || 100;
  };

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

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [chartData, setChartData] = useState(EMPTY_DATA);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<
    "1W" | "1M" | "3M"
  >("1M");
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [currentSliderPage, setCurrentSliderPage] = useState(0);
  const [baseDevicesData, setBaseDevicesData] = useState<any[]>([]);
  const [realtimeKwh, setRealtimeKwh] = useState<{
    [deviceId: string]: number;
  }>({});
  const [cumulativeKwh, setCumulativeKwh] = useState<{
    [deviceId: string]: number;
  }>({});

  const devicesData = useMemo(() => {
    return baseDevicesData.map((device) => ({
      ...device,
      consumption: device.isOn
        ? `${(cumulativeKwh[device.deviceId] || 0).toFixed(3)} kWh`
        : "0.000 kWh",
      currentKwh: cumulativeKwh[device.deviceId] || 0,
    }));
  }, [baseDevicesData, cumulativeKwh]);

  const getChartDataFromBackend = useCallback(
    async (timeFrame: "1W" | "1M" | "3M") => {
      if (!hasBudget && !budgetLoading) {
        return EMPTY_DATA;
      }

      try {
        setIsLoadingData(true);
        const data = await ElectricityUsageService.getChartDataByTimeFrame(
          timeFrame
        );
        return data;
      } catch (error) {
        console.error("Error fetching chart data:", error);
        return EMPTY_DATA;
      } finally {
        setIsLoadingData(false);
      }
    },
    [hasBudget, budgetLoading, EMPTY_DATA]
  );

  const { state, isActive } = useChartPressState({
    x: EMPTY_DATA.length - 1,
    y: { highTmp: 0 },
  });
  const colorMode = useColorScheme() as COLORMODES;
  const chartRef = useRef<CartesianActionsHandle<typeof state>>(null);
  const sliderRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadChartData = async () => {
      const newData = await getChartDataFromBackend(selectedTimeFrame);
      setChartData(newData);
      setCumulativeKwh({});
    };

    loadChartData();
  }, [hasBudget, budgetLoading, selectedTimeFrame, getChartDataFromBackend]);

  const loadDevicesData = useCallback(async () => {
    if (!hasBudget && !budgetLoading) {
      setBaseDevicesData([
        {
          name: "No Data Available",
          consumption: "Set up budget first",
          icon: "information-circle",
          deviceId: "",
        },
      ]);
      return;
    }

    try {
      setIsLoadingData(true);
      console.log("🔄 Loading devices from backend...");

      const devices = await DeviceService.getUserDevices();
      console.log("📱 Loaded devices:", devices.length);

      if (devices.length > 0) {
        const transformedDevices = devices.map((device) => {
          const deviceName = getDeviceDisplayName(device.type);
          const wattage = getDeviceWattage(device.type);

          return {
            name: deviceName,
            icon: getDeviceIcon(device.type),
            deviceId: device._id,
            status: device.isOn ? "on" : "off",
            type: device.type,
            isOn: device.isOn,
            wattage: wattage,
          };
        });

        setBaseDevicesData(transformedDevices);
      } else {
        setBaseDevicesData([
          {
            name: "No Devices Found",
            consumption: "Add devices to track usage",
            icon: "add-circle",
            deviceId: "",
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading devices data:", error);
      setBaseDevicesData([
        {
          name: "Error Loading Data",
          consumption: "Please try again",
          icon: "alert-circle",
          deviceId: "",
        },
      ]);
    } finally {
      setIsLoadingData(false);
    }
  }, [hasBudget, budgetLoading]);

  useEffect(() => {
    loadDevicesData();
  }, [loadDevicesData, selectedTimeFrame]);

  useFocusEffect(
    useCallback(() => {
      console.log("🔄 Home screen focused, reloading devices...");
      loadDevicesData();
    }, [loadDevicesData])
  );

  const handleDevicePress = (device: any) => {
    console.log(
      "🎯 Device pressed:",
      device.name,
      "Device ID:",
      device.deviceId
    );
    console.log("🎯 Navigating to device detail...");
    const deviceIdToUse = device.deviceId || device._id;
    router.push(`/device-detail?deviceId=${deviceIdToUse}`);
  };

  useEffect(() => {
    if (chartData.length > 0) {
      const latestValue = chartData[chartData.length - 1].highTmp;
      const latestIndex = chartData.length - 1;

      state.x.value.value = latestIndex;
      state.y.highTmp.value.value = latestValue;
      state.isActive.value = false;
    }
  }, [chartData, state.x.value, state.y.highTmp.value, state.isActive]);

  useEffect(() => {
    let intervalCounter = 0;

    const interval = setInterval(() => {
      let totalNewConsumption = 0;
      intervalCounter++;

      setRealtimeKwh((prev) => {
        const updated = { ...prev };
        devicesData.forEach((device) => {
          if (device.isOn) {
            const wattage = getDeviceWattage(device.type);
            const kWhPerSecond = wattage / 3600000;
            updated[device.deviceId] =
              (updated[device.deviceId] || 0) + kWhPerSecond;

            if (!selectedDevice || selectedDevice === device.deviceId) {
              totalNewConsumption += kWhPerSecond;
            }
          }
        });
        return updated;
      });

      setCumulativeKwh((prev) => {
        const updated = { ...prev };
        devicesData.forEach((device) => {
          if (device.isOn) {
            const wattage = getDeviceWattage(device.type);
            const kWhPerSecond = wattage / 3600000;
            updated[device.deviceId] =
              (updated[device.deviceId] || 0) + kWhPerSecond;
          }
        });

        if (totalNewConsumption > 0) {
          const newTotalConsumption = Object.values(updated).reduce(
            (sum: number, val: number) => sum + val,
            0
          );

          console.log(
            "📊 Chart real-time update - Total consumption:",
            newTotalConsumption.toFixed(6),
            "kWh"
          );

          setChartData((currentChartData) => {
            if (currentChartData.length === 0) return currentChartData;

            const updatedChartData = [...currentChartData];

            if (intervalCounter % 10 === 0) {
              const newDataPoint = {
                day: updatedChartData.length + 1,
                highTmp: newTotalConsumption,
              };

              if (updatedChartData.length >= 20) {
                updatedChartData.shift();
                updatedChartData.forEach((point, index) => {
                  point.day = index + 1;
                });
              }

              updatedChartData.push(newDataPoint);
              console.log(
                "📈 Added new chart point:",
                newDataPoint.day,
                "kWh:",
                newDataPoint.highTmp.toFixed(6)
              );
            } else {
              const lastDataPoint =
                updatedChartData[updatedChartData.length - 1];
              updatedChartData[updatedChartData.length - 1] = {
                ...lastDataPoint,
                highTmp: newTotalConsumption,
              };
            }

            setTimeout(() => {
              if (
                state &&
                state.y &&
                state.y.highTmp &&
                updatedChartData.length > 0
              ) {
                const latestValue =
                  updatedChartData[updatedChartData.length - 1].highTmp;
                const latestIndex = updatedChartData.length - 1;
                state.x.value.value = latestIndex;
                state.y.highTmp.value.value = latestValue;
              }
            }, 0);

            return updatedChartData;
          });
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [devicesData, state, selectedDevice]);

  useEffect(() => {
    const saveInterval = setInterval(async () => {
      const currentDate = new Date().toISOString().split("T")[0];
      const devicesSaved: string[] = [];

      for (const [deviceId, kwhValue] of Object.entries(realtimeKwh)) {
        if (kwhValue > 0) {
          try {
            console.log(
              "💾 Auto-saving usage data for device:",
              deviceId,
              "kWh:",
              kwhValue.toFixed(6)
            );

            await ElectricityUsageService.createUsageRecord({
              deviceId: deviceId,
              date: currentDate,
              dailyKwh: kwhValue,
              hourlyBreakdown: [],
              avgTemp: 25,
              peakHours: [],
            });

            console.log("✅ Auto-save successful for device:", deviceId);
            devicesSaved.push(deviceId);
          } catch (error) {
            console.error("❌ Auto-save error for device:", deviceId, error);
          }
        }
      }

      if (devicesSaved.length > 0) {
        setRealtimeKwh((prev) => {
          const updated = { ...prev };
          devicesSaved.forEach((deviceId) => {
            updated[deviceId] = 0;
          });
          return updated;
        });

        console.log(
          "🔄 Auto-reset tracking counters (display remains cumulative) for:",
          devicesSaved
        );
      }
    }, 1 * 60 * 1000);
    return () => clearInterval(saveInterval);
  }, [realtimeKwh]);

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

  const handleTimeFrameChange = async (timeFrame: "1W" | "1M" | "3M") => {
    setSelectedTimeFrame(timeFrame);
    setSelectedDevice(null);

    setCumulativeKwh({});

    const baseData = await getChartDataFromBackend(timeFrame);

    const progressiveChartData =
      baseData.length > 0 ? baseData : [{ day: 1, highTmp: 0 }];

    setChartData(progressiveChartData);

    if (progressiveChartData.length > 0) {
      const latestValue =
        progressiveChartData[progressiveChartData.length - 1].highTmp;
      const latestIndex = progressiveChartData.length - 1;

      setTimeout(() => {
        state.x.value.value = latestIndex;
        state.y.highTmp.value.value = latestValue;
        state.isActive.value = false;
      }, 100);
    }
  };

  const labelColor = colorMode === "dark" ? "black" : "white";
  const lineColor = colorMode === "dark" ? "gray" : "white";
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
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>SETRUM</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push("/(tabs)/alert")}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color={labelColor}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push("/(tabs)/settings")}
            >
              <Ionicons name="settings-outline" size={24} color={labelColor} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.title}>
          {selectedDevice
            ? `Device Usage - ${
                devicesData.find((d) => d.deviceId === selectedDevice)?.name ||
                "Device"
              }`
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

        {isLoadingData && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        )}

        {hasBudget &&
          !isLoadingData &&
          devicesData.length > 0 &&
          (devicesData[0]?.name === "No Devices Found" ||
            devicesData[0]?.name === "Error Loading Data") && (
            <View style={styles.noDevicesMessage}>
              <Text style={styles.noDevicesText}>
                {devicesData[0]?.name === "No Devices Found"
                  ? "🔌 No devices found. Add devices to start tracking energy usage."
                  : "❌ Error loading device data. Please check your connection and try again."}
              </Text>
              {devicesData[0]?.name === "No Devices Found" && (
                <TouchableOpacity
                  style={styles.addDeviceButton}
                  onPress={() => {
                    console.log("Navigate to add device page");
                  }}
                >
                  <Text style={styles.addDeviceButtonText}>Add Device</Text>
                </TouchableOpacity>
              )}
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
              <View style={styles.devicesSectionHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedDevice ? `${selectedDevice} Usage` : "Devices"}
                </Text>
                {!selectedDevice && (
                  <TouchableOpacity
                    style={styles.addDeviceButton}
                    onPress={() => router.push("/add-device")}
                  >
                    <Ionicons name="add" size={20} color="#4285F4" />
                    <Text style={styles.addDeviceText}>Add Device</Text>
                  </TouchableOpacity>
                )}
              </View>

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
                        key={device.deviceId || device.name}
                        onPress={() => handleDevicePress(device)}
                        style={[
                          styles.deviceCard,
                          device.isOn && styles.activeDeviceCard, // Green background for active devices
                          selectedDevice === device.deviceId &&
                            styles.selectedDeviceCard,
                        ]}
                      >
                        <View style={styles.deviceIconContainer}>
                          <Ionicons
                            name={device.icon}
                            size={24}
                            color={
                              device.isOn
                                ? "#ffffff" // White icon for active devices
                                : selectedDevice === device.deviceId
                                ? "#4285F4"
                                : "black"
                            }
                          />
                        </View>
                        <Text
                          style={[
                            styles.deviceName,
                            device.isOn && styles.activeDeviceText, // White text for active devices
                            selectedDevice === device.deviceId &&
                              styles.selectedDeviceName,
                          ]}
                        >
                          {device.name}
                        </Text>
                        <Text
                          style={[
                            styles.deviceConsumption,
                            device.isOn && styles.activeDeviceText, // White text for active devices
                            selectedDevice === device.deviceId &&
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 6,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
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
  activeDeviceCard: {
    backgroundColor: "#4CAF50", // Green background for active devices
    borderColor: "#388E3C",
    borderWidth: 2,
  },
  activeDeviceText: {
    color: "#FFFFFF", // White text for active devices
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    borderRadius: 8,
    marginHorizontal: 10,
    marginVertical: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  noDevicesMessage: {
    backgroundColor: "#f8f9fa",
    borderColor: "#dee2e6",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
    marginHorizontal: 10,
    alignItems: "center",
  },
  noDevicesText: {
    fontSize: 16,
    color: "#495057",
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "500",
  },
  addDeviceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#4285F4",
  },
  addDeviceText: {
    color: "#4285F4",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  devicesSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  addDeviceButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  saveSection: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 10,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  saveSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  saveInfo: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  manualSaveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4285F4",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
    flex: 1,
  },
  manualSaveText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  resetDisplayButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
    flex: 1,
  },
  resetDisplayText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
});
