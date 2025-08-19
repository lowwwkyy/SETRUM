const { Device } = require('../models');

// Get all devices for a user
exports.getUserDevices = async (userId) => {
  return await Device.find({ userId }).sort({ createdAt: -1 });
};

// Get a single device by ID
exports.getDeviceById = async (deviceId, userId) => {
  return await Device.findOne({ _id: deviceId, userId });
};

// Create a new device
exports.createDevice = async (deviceData) => {
  const device = new Device(deviceData);
  return await device.save();
};

// Update device status (on/off)
exports.updateDeviceStatus = async (deviceId, userId, isOn) => {
  return await Device.findOneAndUpdate(
    { _id: deviceId, userId },
    { isOn },
    { new: true }
  );
};

// Update device
exports.updateDevice = async (deviceId, userId, updateData) => {
  return await Device.findOneAndUpdate(
    { _id: deviceId, userId },
    updateData,
    { new: true }
  );
};

// Delete device
exports.deleteDevice = async (deviceId, userId) => {
  return await Device.findOneAndDelete({ _id: deviceId, userId });
};

// Get devices by type
exports.getDevicesByType = async (userId, type) => {
  return await Device.find({ userId, type });
};

// Get devices by status
exports.getDevicesByStatus = async (userId, isOn) => {
  return await Device.find({ userId, isOn });
};
