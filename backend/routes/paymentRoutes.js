const express = require("express");
const Expense = require("../models/Expense");

const router = express.Router();

// Fetch approved expenses that haven't been processed
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find({ status: "Approved", processed: false });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// Process payments and mark as processed
router.post("/process", async (req, res) => {
  try {
    const expenses = await Expense.find({ status: "Approved", processed: false });

    // Simulate processing payments
    for (const expense of expenses) {
      expense.processed = true;
      await expense.save();
    }

    res.json({ message: "Payments processed successfully", details: expenses });
  } catch (error) {
    res.status(500).json({ error: "Payment processing failed" });
  }
});

module.exports = router;
