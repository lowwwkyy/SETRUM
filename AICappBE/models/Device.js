const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DeviceSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'refrigerator',
      'washing_machine',
      'dishwasher',
      'microwave',
      'oven',
      'stove',
      'air_conditioner',
      'heater',
      'television',
      'computer',
      'laptop',
      'phone_charger',
      'lighting',
      'fan',
      'vacuum_cleaner',
      'blender',
      'toaster',
      'coffee_maker',
      'other'
    ]
  },
  isOn: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
DeviceSchema.index({ userId: 1, type: 1 });
DeviceSchema.index({ userId: 1, isOn: 1 });

module.exports = mongoose.model('Device', DeviceSchema);
