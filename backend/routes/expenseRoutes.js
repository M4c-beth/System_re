const express = require("express");
const Expense = require("../models/Expense");
const router = express.Router();

// Get all expenses
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// Add a new expense
router.post("/", async (req, res) => {
  try {
    const expense = await Expense.create(req.body);
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ error: "Failed to add expense" });
  }
});

module.exports = router;
