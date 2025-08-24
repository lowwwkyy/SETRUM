const { ElectricityUsage } = require('../models');

// Get all usage records for a user
exports.getUserUsage = async (userId, limit = 50) => {
  return await ElectricityUsage.find({ userId })
    .sort({ date: -1 })
    .limit(limit);
};

// Get usage records for a specific device
exports.getDeviceUsage = async (deviceId, userId, limit = 50) => {
  return await ElectricityUsage.find({ deviceId, userId })
    .sort({ date: -1 })
    .limit(limit);
};

// Get usage records for a specific date range
exports.getUsageByDateRange = async (userId, startDate, endDate) => {
  return await ElectricityUsage.find({
    userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Create a new usage record
exports.createUsageRecord = async (usageData) => {
  const usage = new ElectricityUsage(usageData);
  return await usage.save();
};

// Update a usage record
exports.updateUsageRecord = async (usageId, userId, updateData) => {
  return await ElectricityUsage.findOneAndUpdate(
    { _id: usageId, userId },
    updateData,
    { new: true }
  );
};

// Delete a usage record
exports.deleteUsageRecord = async (usageId, userId) => {
  return await ElectricityUsage.findOneAndDelete({ _id: usageId, userId });
};

// Get daily total kWh for a user
exports.getDailyTotalKwh = async (userId, date) => {
  const result = await ElectricityUsage.aggregate([
    { $match: { userId: userId, date: date } },
    { $group: { _id: null, totalKwh: { $sum: '$dailyKwh' } } }
  ]);
  return result.length > 0 ? result[0].totalKwh : 0;
};

// Get usage summary for a user (last 7 days)
exports.getUsageSummary = async (userId) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return await ElectricityUsage.aggregate([
    { $match: { userId: userId, date: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        totalKwh: { $sum: '$dailyKwh' },
        deviceCount: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);
};

// Seed usage data for testing (DEV only)
exports.seedUsageData = async (userId, days = 21, deviceType = 'television', baseKwh = 2.2, noiseLevel = 0.6) => {
  const { Device } = require('../models');
  
  try {
    // First, find or create a device of the specified type
    let device = await Device.findOne({ userId, type: deviceType });
    if (!device) {
      device = new Device({
        userId,
        type: deviceType,
        isOn: true
      });
      await device.save();
    }

    const usageRecords = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setUTCHours(0, 0, 0, 0);

      // Check if usage record already exists for this date and device
      const existingUsage = await ElectricityUsage.findOne({
        userId,
        deviceId: device._id,
        date
      });

      if (!existingUsage) {
        // Generate realistic usage with some randomness
        const randomFactor = 1 + (Math.random() - 0.5) * noiseLevel;
        const dailyKwh = Math.max(0.1, baseKwh * randomFactor);

        const usage = new ElectricityUsage({
          userId,
          deviceId: device._id,
          date,
          dailyKwh: Math.round(dailyKwh * 100) / 100 // Round to 2 decimal places
        });

        await usage.save();
        usageRecords.push(usage);
      }
    }

    return {
      message: `Successfully seeded ${usageRecords.length} usage records for ${deviceType}`,
      device: device._id,
      recordsCreated: usageRecords.length,
      totalDays: days
    };
  } catch (error) {
    throw new Error(`Failed to seed usage data: ${error.message}`);
  }
};
