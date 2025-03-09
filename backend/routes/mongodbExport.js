const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const { Parser } = require("json2csv");
const fs = require("fs");
const path = require("path");

router.post("/export", async (req, res) => {
  try {
    console.log("📌 [LOG] Export process started...");

    // Step 1: Fetch approved expenses that haven't been exported
    const expenses = await Expense.find({ status: "Approved", exportedToMongoDB: false });

    if (expenses.length === 0) {
      console.warn("⚠️ No approved expenses available for export.");
      return res.status(400).json({ message: "No approved expenses available for export." });
    }

    console.log(`📌 [LOG] Found ${expenses.length} approved expenses.`);

    // Step 2: Convert expenses to CSV format
    const fields = ["_id", "userId", "description", "amount", "category", "date", "status", "approvedBy", "approvalDate"];
    const json2csvParser = new Parser({ fields });
    const csvData = json2csvParser.parse(expenses);

    // Save CSV to a file
    const filePath = path.join(__dirname, "../exports/expenses_export.csv");
    fs.writeFileSync(filePath, csvData);
    console.log(`✅ [LOG] CSV file created at: ${filePath}`);

    // Step 3: Mark expenses as exported in MongoDB
    const updatedExpenses = await Expense.updateMany(
      { _id: { $in: expenses.map((expense) => expense._id) } },
      { $set: { exportedToMongoDB: true } }
    );

    console.log(`✅ [LOG] Successfully updated ${updatedExpenses.modifiedCount} expenses.`);

    res.status(200).json({
      message: "Expenses successfully exported to MongoDB and saved as CSV.",
      exportedCount: updatedExpenses.modifiedCount,
      csvFilePath: filePath,
    });
  } catch (error) {
    console.error("❌ [ERROR] Export error:", error);
    res.status(500).json({ 
      message: "Failed to export expenses to MongoDB.",
      error: error.message || error.toString(),
    });
  }
});

module.exports = router;
