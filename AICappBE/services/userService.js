// AICappBE/services/userService.js

const User = require('../models/User'); // Assuming your user model is in ../models/User

exports.getUserById = async (id) => {
  // Fetch user by ID and exclude the password
  const user = await User.findById(id).select('-password');
  return user;
};