const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  description: String,
  amount: Number,
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" }
});

module.exports = mongoose.model("Expense", ExpenseSchema);
