import { ElectricityUsageService } from "./ElectricityUsageService";

interface DeviceConsumptionTracker {
  deviceId: string;
  isTracking: boolean;
  startTime: number;
  lastCumulativeKwh: number;
  currentSessionKwh: number;
  wattage: number;
}

export class RealTimeConsumptionService {
  private static trackers: Map<string, DeviceConsumptionTracker> = new Map();
  private static intervals: Map<string, any> = new Map();

  // Start tracking consumption for a device when it's turned ON
  static async startTracking(deviceId: string, device: any) {
    try {
      console.log(`🔋 Starting consumption tracking for device: ${deviceId}`);

      // Get last saved cumulative consumption for this device
      const lastCumulative = await this.getLastCumulativeConsumption(deviceId);

      const tracker: DeviceConsumptionTracker = {
        deviceId,
        isTracking: true,
        startTime: Date.now(),
        lastCumulativeKwh: lastCumulative,
        currentSessionKwh: 0,
        wattage: device.wattage || 100, // Default 100W if not specified
      };

      this.trackers.set(deviceId, tracker);

      // Start interval to update consumption every 10 seconds
      const interval = setInterval(() => {
        this.updateCurrentConsumption(deviceId);
      }, 10000); // Update every 10 seconds

      this.intervals.set(deviceId, interval);

      console.log(
        `✅ Started tracking for ${deviceId} with base: ${lastCumulative} kWh`
      );
    } catch (error) {
      console.error(`❌ Error starting tracking for ${deviceId}:`, error);
    }
  }

  // Stop tracking and save final consumption to database
  static async stopTracking(deviceId: string) {
    try {
      console.log(`🛑 Stopping consumption tracking for device: ${deviceId}`);

      const tracker = this.trackers.get(deviceId);
      if (!tracker) {
        console.log(`⚠️ No tracker found for device: ${deviceId}`);
        return;
      }

      // Calculate final consumption for this session
      this.updateCurrentConsumption(deviceId);

      const finalCumulativeKwh =
        tracker.lastCumulativeKwh + tracker.currentSessionKwh;

      // Save to database
      await this.saveCumulativeConsumption(
        deviceId,
        finalCumulativeKwh,
        tracker.currentSessionKwh
      );

      // Clean up
      tracker.isTracking = false;
      this.trackers.delete(deviceId);

      const interval = this.intervals.get(deviceId);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(deviceId);
      }

      console.log(
        `✅ Stopped tracking for ${deviceId}, final cumulative: ${finalCumulativeKwh} kWh`
      );
    } catch (error) {
      console.error(`❌ Error stopping tracking for ${deviceId}:`, error);
    }
  }

  // Update current session consumption based on time and wattage
  private static updateCurrentConsumption(deviceId: string) {
    const tracker = this.trackers.get(deviceId);
    if (!tracker || !tracker.isTracking) return;

    const now = Date.now();
    const hoursElapsed = (now - tracker.startTime) / (1000 * 60 * 60); // Convert to hours
    const kwhConsumed = (tracker.wattage / 1000) * hoursElapsed; // kWh = (Watts / 1000) * hours

    tracker.currentSessionKwh = kwhConsumed;

    console.log(
      `📊 Device ${deviceId}: Session ${kwhConsumed.toFixed(3)} kWh, Total: ${(
        tracker.lastCumulativeKwh + kwhConsumed
      ).toFixed(3)} kWh`
    );
  }

  // Get current total consumption (last saved + current session)
  static getCurrentConsumption(deviceId: string): number {
    const tracker = this.trackers.get(deviceId);
    if (!tracker) return 0;

    if (tracker.isTracking) {
      this.updateCurrentConsumption(deviceId);
    }

    return tracker.lastCumulativeKwh + tracker.currentSessionKwh;
  }

  // Get last saved cumulative consumption from database
  private static async getLastCumulativeConsumption(
    deviceId: string
  ): Promise<number> {
    try {
      const usage = await ElectricityUsageService.getUserUsage();
      const deviceUsage = usage.filter((u: any) => u.deviceId === deviceId);

      if (deviceUsage.length === 0) return 0;

      // Get the most recent record
      const lastRecord = deviceUsage.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      return (lastRecord as any).cumulativeKwh || lastRecord.dailyKwh || 0;
    } catch (error) {
      console.error(
        `❌ Error getting last consumption for ${deviceId}:`,
        error
      );
      return 0;
    }
  }

  // Save cumulative consumption to database
  private static async saveCumulativeConsumption(
    deviceId: string,
    cumulativeKwh: number,
    sessionKwh: number
  ) {
    try {
      const usageData = {
        deviceId,
        date: new Date().toISOString(),
        dailyKwh: sessionKwh,
      };

      // Save to backend database
      await ElectricityUsageService.createUsageRecord(usageData);

      console.log(`💾 Saved consumption for ${deviceId}:`, usageData);
    } catch (error) {
      console.error(`❌ Error saving consumption for ${deviceId}:`, error);
    }
  }

  // Get all tracked devices with their current consumption
  static getAllTrackedDevices(): {
    deviceId: string;
    consumption: number;
    isActive: boolean;
  }[] {
    const result: {
      deviceId: string;
      consumption: number;
      isActive: boolean;
    }[] = [];

    this.trackers.forEach((tracker, deviceId) => {
      result.push({
        deviceId,
        consumption: this.getCurrentConsumption(deviceId),
        isActive: tracker.isTracking,
      });
    });

    return result;
  }

  // Check if device is currently being tracked
  static isTracking(deviceId: string): boolean {
    const tracker = this.trackers.get(deviceId);
    return tracker ? tracker.isTracking : false;
  }

  // Get tracker info for debugging
  static getTrackerInfo(deviceId: string) {
    return this.trackers.get(deviceId);
  }
}
