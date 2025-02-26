const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ["Travel", "Meals", "Office Supplies", "Equipment", "Other"]
  },
  date: { type: Date, default: Date.now },
  receipt: {
    filename: String,
    contentType: String,
    data: Buffer
  },
  status: { 
    type: String, 
    enum: ["Pending", "Approved", "Rejected"], 
    default: "Pending" 
  },
  notes: String,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvalDate: Date,
  policyViolations: [String],
  exportedToQuickbooks: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Expense", ExpenseSchema);