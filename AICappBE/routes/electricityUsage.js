const express = require('express');
const router = express.Router();
const electricityUsageController = require('../controllers/electricityUsageController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET api/usage
// @desc    Get all usage records for the authenticated user
// @access  Private
router.get('/', electricityUsageController.getUserUsage);

// @route   GET api/usage/summary
// @desc    Get usage summary (last 7 days)
// @access  Private
router.get('/summary', electricityUsageController.getUsageSummary);

// @route   GET api/usage/daily-total
// @desc    Get daily total kWh for the user
// @access  Private
router.get('/daily-total', electricityUsageController.getDailyTotalKwh);

// @route   GET api/usage/date-range
// @desc    Get usage records for a date range
// @access  Private
router.get('/date-range', electricityUsageController.getUsageByDateRange);

// @route   GET api/usage/device/:deviceId
// @desc    Get usage records for a specific device
// @access  Private
router.get('/device/:deviceId', electricityUsageController.getDeviceUsage);

// @route   POST api/usage
// @desc    Create a new usage record
// @access  Private
router.post('/', electricityUsageController.createUsageRecord);

// @route   PUT api/usage/:usageId
// @desc    Update a usage record
// @access  Private
router.put('/:usageId', electricityUsageController.updateUsageRecord);

// @route   DELETE api/usage/:usageId
// @desc    Delete a usage record
// @access  Private
router.delete('/:usageId', electricityUsageController.deleteUsageRecord);

module.exports = router;
