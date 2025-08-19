const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/monthlyBudgetController');

router.use(auth);

// Set or update budget for a month
// POST /api/budget
router.post('/', controller.setOrUpdateBudget);

// Get budget for a month
// GET /api/budget?year=2025&month=1
router.get('/', controller.getBudget);

// Delete budget for a month
// DELETE /api/budget?year=2025&month=1
router.delete('/', controller.deleteBudget);

// Get budget progress (spent vs budget)
// GET /api/budget/progress?year=2025&month=1
router.get('/progress', controller.getBudgetProgress);

module.exports = router;
