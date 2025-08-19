const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// @route   GET api/user/account
// @desc    Get user account details
// @access  Private
router.get('/account', auth, userController.getAccountDetails);

module.exports = router;