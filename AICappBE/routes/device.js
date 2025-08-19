const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET api/device
// @desc    Get all devices for the authenticated user
// @access  Private
router.get('/', deviceController.getUserDevices);

// @route   GET api/device/type/:type
// @desc    Get devices by type
// @access  Private
router.get('/type/:type', deviceController.getDevicesByType);

// @route   GET api/device/status/:status
// @desc    Get devices by status (on/off)
// @access  Private
router.get('/status/:status', deviceController.getDevicesByStatus);

// @route   GET api/device/:deviceId
// @desc    Get a single device by ID
// @access  Private
router.get('/:deviceId', deviceController.getDeviceById);

// @route   POST api/device
// @desc    Create a new device
// @access  Private
router.post('/', deviceController.createDevice);

// @route   PUT api/device/:deviceId
// @desc    Update a device
// @access  Private
router.put('/:deviceId', deviceController.updateDevice);

// @route   PATCH api/device/:deviceId/status
// @desc    Update device status (on/off)
// @access  Private
router.patch('/:deviceId/status', deviceController.updateDeviceStatus);

// @route   DELETE api/device/:deviceId
// @desc    Delete a device
// @access  Private
router.delete('/:deviceId', deviceController.deleteDevice);

module.exports = router;
