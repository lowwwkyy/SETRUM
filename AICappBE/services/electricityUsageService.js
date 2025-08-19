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
