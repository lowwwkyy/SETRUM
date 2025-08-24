const electricityUsageService = require('../services/electricityUsageService');

// Get all usage records for the authenticated user
exports.getUserUsage = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const usage = await electricityUsageService.getUserUsage(req.user.id, limit);
    res.json(usage);
  } catch (error) {
    console.error('Error getting user usage:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get usage records for a specific device
exports.getDeviceUsage = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const usage = await electricityUsageService.getDeviceUsage(req.params.deviceId, req.user.id, limit);
    res.json(usage);
  } catch (error) {
    console.error('Error getting device usage:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get usage records for a date range
exports.getUsageByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const usage = await electricityUsageService.getUsageByDateRange(
      req.user.id,
      new Date(startDate),
      new Date(endDate)
    );
    res.json(usage);
  } catch (error) {
    console.error('Error getting usage by date range:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new usage record
exports.createUsageRecord = async (req, res) => {
  try {
    const usageData = {
      ...req.body,
      userId: req.user.id
    };
    
    const usage = await electricityUsageService.createUsageRecord(usageData);
    res.status(201).json(usage);
  } catch (error) {
    console.error('Error creating usage record:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a usage record
exports.updateUsageRecord = async (req, res) => {
  try {
    const usage = await electricityUsageService.updateUsageRecord(req.params.usageId, req.user.id, req.body);
    
    if (!usage) {
      return res.status(404).json({ message: 'Usage record not found' });
    }
    
    res.json(usage);
  } catch (error) {
    console.error('Error updating usage record:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a usage record
exports.deleteUsageRecord = async (req, res) => {
  try {
    const usage = await electricityUsageService.deleteUsageRecord(req.params.usageId, req.user.id);
    
    if (!usage) {
      return res.status(404).json({ message: 'Usage record not found' });
    }
    
    res.json({ message: 'Usage record deleted successfully' });
  } catch (error) {
    console.error('Error deleting usage record:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get daily total kWh for the user
exports.getDailyTotalKwh = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    const totalKwh = await electricityUsageService.getDailyTotalKwh(req.user.id, targetDate);
    res.json({ date: targetDate, totalKwh });
  } catch (error) {
    console.error('Error getting daily total kWh:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get usage summary (last 7 days)
exports.getUsageSummary = async (req, res) => {
  try {
    const summary = await electricityUsageService.getUsageSummary(req.user.id);
    res.json(summary);
  } catch (error) {
    console.error('Error getting usage summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Seed usage data for testing (DEV only)
exports.seedUsageData = async (req, res) => {
  try {
    const { days = 21, type = 'television', base = 2.2, noise = 0.6 } = req.body;
    const result = await electricityUsageService.seedUsageData(req.user.id, days, type, base, noise);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error seeding usage data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// (dev-only seeding removed)
