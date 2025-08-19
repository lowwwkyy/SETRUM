// AICappBE/controllers/userController.js

const userService = require('../services/userService');

exports.getAccountDetails = async (req, res) => {
  try {
    // req.user.id is typically set by the authentication middleware
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};