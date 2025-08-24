const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String // Not required for Google Sign-In users
  },
  displayName: {
    type: String
  },
  googleId: { // To store the user's unique Google ID
    type: String
  },
  householdSize: {
    type: Number,
    min: 1,
    default: null
  }
});

module.exports = mongoose.model('User', UserSchema);