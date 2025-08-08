import { Box, Button, Card, HStack, Image, Text } from "@gluestack-ui/themed";
import { router } from "expo-router";
import React, { useState } from "react";
import { Text as RNText, StyleSheet, TouchableOpacity } from "react-native";
import { DATA_1M, DATA_1W, DATA_3M } from "./Utils/data";
interface ChartData {
  day: number;
  highTmp: number;
}

interface Props {
  chartData: ChartData[];
  setChartData: (data: ChartData[]) => void;
  onTimeFrameChange?: (timeFrame: TimeFrame, data: ChartData[]) => void;
  currentValue?: string;
}

type TimeFrame = "1W" | "1M" | "3M";

export const BottomSection = ({
  chartData,
  setChartData,
  onTimeFrameChange,
  currentValue,
}: Props) => {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>("1M");

  const timeFrameData = {
    "1W": DATA_1W,
    "1M": DATA_1M,
    "3M": DATA_3M,
  };

  const timeFrameLabels = {
    "1W": "1 Week",
    "1M": "1 Month",
    "3M": "3 Months",
  };

  const handleTimeFrameChange = (timeFrame: TimeFrame) => {
    setSelectedTimeFrame(timeFrame);
    const newData = timeFrameData[timeFrame];
    setChartData(newData);

    // Call the callback if provided
    if (onTimeFrameChange) {
      onTimeFrameChange(timeFrame, newData);
    }
  };

  return (
    <>
      <Box
        marginTop={5}
        paddingTop={10}
        width="95%"
        // height="10%"
        justifyContent="center"
      >
        <Card>
          <HStack
            display="flex"
            flexDirection="row"
            justifyContent="flex-start"
            marginTop={10}
            gap={10}
          >
            {(Object.keys(timeFrameData) as TimeFrame[]).map((timeFrame) => (
              <TouchableOpacity
                key={timeFrame}
                onPress={() => handleTimeFrameChange(timeFrame)}
                style={[
                  styles.button,
                  selectedTimeFrame === timeFrame
                    ? styles.activeButton
                    : styles.inactiveButton,
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    selectedTimeFrame === timeFrame
                      ? styles.activeText
                      : styles.inactiveText,
                  ]}
                >
                  {timeFrameLabels[timeFrame]}
                </Text>
              </TouchableOpacity>
            ))}
          </HStack>

          {/* <HStack justifyContent="space-between">
            <VStack style={{ gap: 16 }}>
              <Text style={{ fontSize: 24, fontWeight: "bold" }}>
                Apple Computers
              </Text>
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>NASDAQ</Text>
              <Text style={{ fontSize: 18 }}>
                {timeFrameLabels[selectedTimeFrame]}
              </Text>
            </VStack>
          </HStack> */}
        </Card>
        <Box style={styles.infoSection}>
          <HStack style={styles.consumptionItem}>
            <Image
              source={require("../assets/images/HighCon.png")}
              style={styles.consumptionIcon}
              alt="High Consumption"
            />
            <Box>
              <RNText style={[styles.infoTitle, { fontFamily: "Roboto-Bold" }]}>
                High Consumption
              </RNText>
              <Text style={styles.infoSubtitle}>
                Current: {currentValue || "0.00 kWh"}
              </Text>
              <Button
                style={styles.detailButton}
                onPress={() => router.push("/details?type=high")}
              >
                <Text style={styles.buttonDetailText}>View Details</Text>
              </Button>
            </Box>
          </HStack>

          <HStack style={styles.consumptionItem}>
            <Image
              source={require("../assets/images/LowCon.png")}
              style={styles.consumptionIcon}
              alt="Low Consumption"
            />
            <Box>
              <RNText style={[styles.infoTitle, { fontFamily: "Roboto-Bold" }]}>
                Low Consumption
              </RNText>
              <Text style={styles.infoSubtitle}>Current: 0.50 kWh</Text>
              <Button
                style={styles.detailButton}
                onPress={() => router.push("/details?type=low")}
              >
                <Text style={styles.buttonDetailText}>View Details</Text>
              </Button>
            </Box>
          </HStack>
        </Box>
      </Box>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: "black",
  },
  inactiveButton: {
    backgroundColor: "transparent",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeText: {
    color: "white",
  },
  inactiveText: {
    color: "black",
  },
  infoSection: {
    paddingTop: 30,
    marginTop: 10,
    alignItems: "flex-start",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "left",
  },
  infoSubtitle: {
    fontSize: 16,
    color: "#4b5563",
    textAlign: "left",
  },
  consumptionItem: {
    alignItems: "center",
    flexDirection: "row-reverse",
    marginBottom: 15,
    gap: 12,
  },
  consumptionIcon: {
    width: 130,
    height: 93,
    paddingLeft: 270,
    resizeMode: "contain",
  },
  detailButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(240, 242, 245, 1)",
    borderWidth: 0.5,
    // borderColor: "#007AFF",
    minWidth: 140,
    height: 36,
    borderRadius: 12,
    alignSelf: "flex-start",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDetailText: {
    fontSize: 14,
    // color: "#007AFF",
    fontWeight: "500",
    textAlign: "center",
  },
});
