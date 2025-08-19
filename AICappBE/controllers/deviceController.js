const deviceService = require('../services/deviceService');

// Get all devices for the authenticated user
exports.getUserDevices = async (req, res) => {
  try {
    const devices = await deviceService.getUserDevices(req.user.id);
    res.json(devices);
  } catch (error) {
    console.error('Error getting user devices:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single device by ID
exports.getDeviceById = async (req, res) => {
  try {
    const device = await deviceService.getDeviceById(req.params.deviceId, req.user.id);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    res.json(device);
  } catch (error) {
    console.error('Error getting device:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new device
exports.createDevice = async (req, res) => {
  try {
    const deviceData = {
      ...req.body,
      userId: req.user.id
    };
    
    const device = await deviceService.createDevice(deviceData);
    res.status(201).json(device);
  } catch (error) {
    console.error('Error creating device:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Update device status (on/off)
exports.updateDeviceStatus = async (req, res) => {
  try {
    const { isOn } = req.body;
    const device = await deviceService.updateDeviceStatus(req.params.deviceId, req.user.id, isOn);
    
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    res.json(device);
  } catch (error) {
    console.error('Error updating device status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update device
exports.updateDevice = async (req, res) => {
  try {
    const device = await deviceService.updateDevice(req.params.deviceId, req.user.id, req.body);
    
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    res.json(device);
  } catch (error) {
    console.error('Error updating device:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete device
exports.deleteDevice = async (req, res) => {
  try {
    const device = await deviceService.deleteDevice(req.params.deviceId, req.user.id);
    
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get devices by type
exports.getDevicesByType = async (req, res) => {
  try {
    const devices = await deviceService.getDevicesByType(req.user.id, req.params.type);
    res.json(devices);
  } catch (error) {
    console.error('Error getting devices by type:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get devices by status
exports.getDevicesByStatus = async (req, res) => {
  try {
    const isOn = req.params.status === 'on';
    const devices = await deviceService.getDevicesByStatus(req.user.id, isOn);
    res.json(devices);
  } catch (error) {
    console.error('Error getting devices by status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
