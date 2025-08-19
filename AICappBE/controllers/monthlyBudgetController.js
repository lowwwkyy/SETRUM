const monthlyBudgetService = require('../services/monthlyBudgetService');

exports.setOrUpdateBudget = async (req, res) => {
	try {
		const { year, month, amount, pricePerKwh, currency, note } = req.body;
		if (!year || !month || amount == null) {
			return res.status(400).json({ message: 'year, month, and amount are required' });
		}
		const budget = await monthlyBudgetService.upsertBudget(req.user.id, {
			year: Number(year),
			month: Number(month),
			amount: Number(amount),
			pricePerKwh: pricePerKwh != null ? Number(pricePerKwh) : undefined,
			currency,
			note
		});
		return res.status(200).json(budget);
	} catch (error) {
		console.error('Error setting budget:', error);
		return res.status(500).json({ message: 'Server error' });
	}
};

exports.getBudget = async (req, res) => {
	try {
		const { year, month } = req.query;
		if (!year || !month) {
			return res.status(400).json({ message: 'year and month are required' });
		}
		const budget = await monthlyBudgetService.getBudget(req.user.id, Number(year), Number(month));
		if (!budget) return res.status(404).json({ message: 'Budget not found' });
		return res.json(budget);
	} catch (error) {
		console.error('Error getting budget:', error);
		return res.status(500).json({ message: 'Server error' });
	}
};

exports.deleteBudget = async (req, res) => {
	try {
		const { year, month } = req.query;
		if (!year || !month) {
			return res.status(400).json({ message: 'year and month are required' });
		}
		const deleted = await monthlyBudgetService.deleteBudget(req.user.id, Number(year), Number(month));
		if (!deleted) return res.status(404).json({ message: 'Budget not found' });
		return res.json({ message: 'Budget deleted' });
	} catch (error) {
		console.error('Error deleting budget:', error);
		return res.status(500).json({ message: 'Server error' });
	}
};

exports.getBudgetProgress = async (req, res) => {
	try {
		const { year, month } = req.query;
		if (!year || !month) {
			return res.status(400).json({ message: 'year and month are required' });
		}
		const summary = await monthlyBudgetService.getBudgetProgress(req.user.id, Number(year), Number(month));
		return res.json(summary);
	} catch (error) {
		console.error('Error getting budget progress:', error);
		return res.status(500).json({ message: 'Server error' });
	}
};
