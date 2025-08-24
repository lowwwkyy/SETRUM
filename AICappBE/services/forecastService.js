const axios = require('axios');
const { ElectricityUsage, User, MonthlyBudget } = require('../models');

// Configuration: ML service URL (updated for SARIMAX API)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000/forecast';

// Build historical data for SARIMAX model
async function buildHistoricalData(userId, daysBack = 30) {
	const endDate = new Date();
	endDate.setUTCHours(23, 59, 59, 999);
	
	const startDate = new Date(endDate);
	startDate.setDate(startDate.getDate() - daysBack);
	startDate.setUTCHours(0, 0, 0, 0);

	// Fetch historical electricity usage
	const usage = await ElectricityUsage.find({
		userId,
		date: { $gte: startDate, $lte: endDate }
	}).sort({ date: 1 });

	if (usage.length === 0) {
		throw new Error('Not enough historical data to make a forecast. Need at least some daily usage records.');
	}

	// Convert to the format expected by SARIMAX API
	const historicalData = usage.map(u => ({
		date: new Date(u.date).toISOString().slice(0, 10), // YYYY-MM-DD format
		energy_consumption_kwh: u.dailyKwh || 0
	}));

	return historicalData;
}

// Get user's current monthly budget
async function getUserBudget(userId) {
	const currentDate = new Date();
	const currentMonth = currentDate.getMonth() + 1; // 1-12
	const currentYear = currentDate.getFullYear();

	// Try to find the current month's budget
	const budget = await MonthlyBudget.findOne({
		userId,
		month: currentMonth,
		year: currentYear
	});

	// Default budget if none set (you can adjust this)
	return budget ? budget.budgetAmount : 1500; // Default 1500 kWh
}

// Main forecast function - now uses SARIMAX for budget forecasting
exports.forecast = async (userId, budgetOverride = null, currentDateOverride = null) => {
	try {
		// Get historical data and user budget
		const historicalData = await buildHistoricalData(userId, 30); // Get 30 days of history
		const budget = budgetOverride || await getUserBudget(userId);
		const currentDate = currentDateOverride || new Date().toISOString().slice(0, 10); // YYYY-MM-DD format

		// Prepare payload for SARIMAX API
		const payload = {
			historical_data: historicalData,
			budget: budget,
			current_date: currentDate
		};

		// Log the data being sent to the AI service
		console.log("Data sent to SARIMAX service:", JSON.stringify(payload, null, 2));

		// Call SARIMAX service
		const { data } = await axios.post(ML_SERVICE_URL, payload, { timeout: 30000 });
		
		return data;
	} catch (error) {
		console.error('Error in forecast service:', error.message);
		if (error.response) {
			console.error('API Response Error:', error.response.data);
		}
		throw error;
	}
};

// Legacy function for backward compatibility (returns simplified daily prediction)
exports.getDailyRecommendation = async (userId) => {
	try {
		const forecastData = await exports.forecast(userId);
		
		// Extract next day's predicted usage from the forecast
		const today = new Date().toISOString().slice(0, 10);
		const nextDay = forecastData.monthly_usage_forecast.find(day => 
			day.is_forecast && new Date(day.date) > new Date(today)
		);

		if (nextDay) {
			return {
				date: nextDay.date,
				daily_recommendation: nextDay.daily_kwh
			};
		} else {
			// Fallback to average of forecast days
			const forecastDays = forecastData.monthly_usage_forecast.filter(day => day.is_forecast);
			const avgDaily = forecastDays.reduce((sum, day) => sum + day.daily_kwh, 0) / forecastDays.length;
			
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			
			return {
				date: tomorrow.toISOString().slice(0, 10),
				daily_recommendation: avgDaily
			};
		}
	} catch (error) {
		console.error('Error getting daily recommendation:', error.message);
		throw error;
	}
};
