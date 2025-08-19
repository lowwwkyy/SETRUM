const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ElectricityUsageSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  dailyKwh: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
ElectricityUsageSchema.index({ userId: 1, date: -1 });
ElectricityUsageSchema.index({ deviceId: 1, date: -1 });
ElectricityUsageSchema.index({ userId: 1, deviceId: 1, date: -1 });

module.exports = mongoose.model('ElectricityUsage', ElectricityUsageSchema);
