const forecastService = require('../services/forecastService');

// Get monthly budget forecast using SARIMAX
exports.getForecast = async (req, res) => {
	try {
		// Extract budget and current_date from request body if provided
		const { budget, current_date } = req.body;
		
		const forecast = await forecastService.forecast(req.user.id, budget, current_date);
		
		return res.json(forecast); // Return forecast data directly (not wrapped)
	} catch (error) {
		// Verbose logging to diagnose issues with ML service / data prep
		const errLog = {
			message: error.message,
			code: error.code,
			stack: error.stack,
			responseStatus: error.response?.status,
			responseData: error.response?.data
		};
		console.error('Error getting forecast:', errLog);
		
		// In non-production, surface details to help debugging
		if (process.env.NODE_ENV !== 'production') {
			return res.status(500).json({ 
				success: false,
				message: 'Forecast error', 
				...errLog 
			});
		}
		return res.status(500).json({ 
			success: false,
			message: 'Server error' 
		});
	}
};

// Get simple daily recommendation (for backward compatibility)
exports.getDailyRecommendation = async (req, res) => {
	try {
		const recommendation = await forecastService.getDailyRecommendation(req.user.id);
		
		return res.json({
			success: true,
			horizonDays: 1,
			forecast: [recommendation]
		});
	} catch (error) {
		const errLog = {
			message: error.message,
			code: error.code,
			stack: error.stack,
			responseStatus: error.response?.status,
			responseData: error.response?.data
		};
		console.error('Error getting daily recommendation:', errLog);
		
		if (process.env.NODE_ENV !== 'production') {
			return res.status(500).json({ 
				success: false,
				message: 'Daily recommendation error', 
				...errLog 
			});
		}
		return res.status(500).json({ 
			success: false,
			message: 'Server error' 
		});
	}
};
