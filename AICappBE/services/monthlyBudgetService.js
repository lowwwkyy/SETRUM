const { MonthlyBudget, ElectricityUsage } = require('../models');

exports.upsertBudget = async (userId, { year, month, amount, pricePerKwh, currency, note }) => {
	return await MonthlyBudget.findOneAndUpdate(
		{ userId, year, month },
		{ $set: { amount, pricePerKwh, currency, note } },
		{ new: true, upsert: true }
	);
};

exports.getBudget = async (userId, year, month) => {
	return await MonthlyBudget.findOne({ userId, year, month });
};

exports.deleteBudget = async (userId, year, month) => {
	return await MonthlyBudget.findOneAndDelete({ userId, year, month });
};

exports.getUsageKwhForMonth = async (userId, year, month) => {
	const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
	const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

	const result = await ElectricityUsage.aggregate([
		{ $match: { userId, date: { $gte: monthStart, $lte: monthEnd } } },
		{ $group: { _id: null, totalKwh: { $sum: '$dailyKwh' } } }
	]);
	return result.length > 0 ? result[0].totalKwh : 0;
};

exports.getUsageCostForMonth = async (userId, year, month, pricePerKwh) => {
	const totalKwh = await exports.getUsageKwhForMonth(userId, year, month);
	if (!pricePerKwh && pricePerKwh !== 0) return { totalKwh, totalCost: null };
	return { totalKwh, totalCost: totalKwh * pricePerKwh };
};

exports.getBudgetProgress = async (userId, year, month) => {
	const budget = await exports.getBudget(userId, year, month);
	const totalKwh = await exports.getUsageKwhForMonth(userId, year, month);
	let totalCost = null;
	if (budget && budget.pricePerKwh != null) {
		totalCost = totalKwh * budget.pricePerKwh;
	}
	const amount = budget ? budget.amount : null;
	const spent = totalCost;
	let percentUsed = null;
	if (amount != null && spent != null && amount > 0) {
		percentUsed = (spent / amount) * 100;
	}
	return {
		year,
		month,
		budgetAmount: amount,
		pricePerKwh: budget ? budget.pricePerKwh : null,
		currency: budget ? budget.currency : 'USD',
		totalKwh,
		spent,
		percentUsed
	};
};
