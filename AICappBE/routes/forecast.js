const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/forecastController');

// Debug log to confirm route is loaded
console.log('🚀 Forecast routes loaded successfully');

// Debug route (remove in production) - NO AUTH REQUIRED
router.get('/test', (req, res) => {
  res.json({ message: 'Forecast routes are working!' });
});

router.use(auth);

// POST /api/forecast/budget - Get monthly budget forecast using SARIMAX
router.post('/budget', controller.getForecast);

// POST /api/forecast/daily - Get simple daily recommendation (backward compatibility)
router.post('/daily', controller.getDailyRecommendation);

module.exports = router;
