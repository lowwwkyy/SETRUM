const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MonthlyBudgetSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
		index: true
	},
	year: {
		type: Number,
		required: true,
		min: 1970,
		max: 2100,
		index: true
	},
	month: {
		type: Number,
		required: true,
		min: 1,
		max: 12,
		index: true
	},
	amount: {
		type: Number,
		required: true,
		min: 0
	},
	pricePerKwh: {
		type: Number,
		min: 0
	},
	currency: {
		type: String,
		default: 'IDR',
		trim: true
	},
	note: {
		type: String,
		trim: true
	}
}, {
	timestamps: true
});

MonthlyBudgetSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyBudget', MonthlyBudgetSchema);
