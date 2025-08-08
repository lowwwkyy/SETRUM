import { BottomSection } from "@/components/BottomSection";
import { DATA_1M } from "@/components/Utils/data";
import { useColorScheme } from "@/hooks/useColorScheme";
import { COLORMODES } from "@gluestack-style/react/lib/typescript/types";
import { Box } from "@gluestack-ui/themed";
import {
  Circle,
  LinearGradient,
  Text as SKText,
  useFont,
  vec,
} from "@shopify/react-native-skia";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
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

  // Get current value for display in bottom section
  const currentValue =
    chartData.length > 0
      ? chartData[chartData.length - 1].highTmp.toFixed(2) + " kWh"
      : "0.00 kWh";

  // Callback untuk handling perubahan timeframe
  const handleTimeFrameChange = (
    timeFrame: string,
    newData: typeof DATA_1M
  ) => {
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

  return (
    <View style={styles.container}>
      {/* <Pressable
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.push("/");
          }
        }}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </Pressable> */}
      <Text style={styles.title}>Energy Dashboard</Text>
      <Box
        width="100%"
        $dark-bg="$black"
        $light-bg="$white"
        flex={1}
        alignItems="center"
        paddingHorizontal={5}
        paddingVertical={30}
      >
        <Box paddingTop={10} width="95%" height={400}>
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
                  x={chartBounds.left + 10}
                  y={25}
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
        <BottomSection
          chartData={chartData}
          setChartData={setChartData}
          onTimeFrameChange={handleTimeFrameChange}
          currentValue={currentValue}
        />
      </Box>
    </View>
  );
}
function ToolTip({ x, y }: { x: SharedValue<number>; y: SharedValue<number> }) {
  return <Circle cx={x} cy={y} r={8} color={"grey"} opacity={0.8} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
