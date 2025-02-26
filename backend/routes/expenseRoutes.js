const express = require("express");
const Expense = require("../models/Expense");
const { authenticateUser } = require("../middlewares/authMiddleware");
const multer = require("multer");
const router = express.Router();
const receiptService = require('../services/receiptService');

// Configure multer for file storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs only
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'), false);
    }
  }
});

// Get all expenses for the authenticated user
router.get("/", authenticateUser, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id })
      .select('-receipt.data')  // Exclude receipt binary data for performance
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// Get a specific expense by ID
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: "Failed to fetch expense" });
  }
});

router.post("/", authenticateUser, upload.single('receipt'), async (req, res) => {
  try {
    const { description, amount, category, date, notes } = req.body;

    // Create new expense
    const newExpense = new Expense({
      userId: req.user._id,
      description,
      amount: parseFloat(amount),
      category,
      date: date || new Date(),
      notes
    });

    // Add receipt if uploaded
    if (req.file) {
      newExpense.receipt = {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        data: req.file.buffer
      };

      try {
        // Check for duplicate receipts
        const duplicateCheck = await receiptService.checkDuplicate(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );

        if (duplicateCheck.duplicate) {
          newExpense.policyViolations = newExpense.policyViolations || [];
          newExpense.policyViolations.push("Possible duplicate receipt detected");
        }

        // Analyze receipt
        const analysis = await receiptService.analyzeReceipt(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          category
        );

        // Add policy violations from AI
        if (analysis.policy_violations && analysis.policy_violations.length > 0) {
          newExpense.policyViolations = [
            ...(newExpense.policyViolations || []),
            ...analysis.policy_violations
          ];
        }

        // Add extracted data to notes
        if (analysis.extracted_data) {
          const extractedInfo = `
Receipt analysis:
- Vendor: ${analysis.extracted_data.vendor || 'Not detected'}
- Date: ${analysis.extracted_data.date || 'Not detected'}
- Amount: ${analysis.extracted_data.amount || 'Not detected'}
`;

          newExpense.notes = newExpense.notes
            ? `${newExpense.notes}\n\n${extractedInfo}`
            : extractedInfo;
        }
      } catch (analysisError) {
        console.error('Receipt analysis error:', analysisError);
        // Continue without analysis if there's an error
      }
    }

    // Perform basic policy check
    const policyViolations = newExpense.policyViolations || [];
    if (parseFloat(amount) > 1000) {
      policyViolations.push("Amount exceeds the maximum limit of $1,000");
    }

    if (policyViolations.length > 0) {
      newExpense.policyViolations = policyViolations;
    }

    await newExpense.save();

    // Return the expense without the receipt binary data
    const returnExpense = newExpense.toObject();
    if (returnExpense.receipt) {
      delete returnExpense.receipt.data;
    }

    res.status(201).json(returnExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(400).json({ error: "Failed to add expense", details: error.message });
  }
});

// Update an existing expense
router.put("/:id", authenticateUser, upload.single('receipt'), async (req, res) => {
  try {
    const { description, amount, category, date, notes } = req.body;

    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Don't allow updates to approved or rejected expenses
    if (expense.status !== "Pending") {
      return res.status(400).json({
        error: `Cannot update an expense with status: ${expense.status}`
      });
    }

    // Update fields
    expense.description = description || expense.description;
    expense.amount = parseFloat(amount) || expense.amount;
    expense.category = category || expense.category;
    expense.date = date ? new Date(date) : expense.date;
    expense.notes = notes || expense.notes;

    // Update receipt if a new one is uploaded
    if (req.file) {
      expense.receipt = {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        data: req.file.buffer
      };
    }

    // Perform basic policy check
    const policyViolations = [];
    if (parseFloat(amount || expense.amount) > 1000) {
      policyViolations.push("Amount exceeds the maximum limit of $1,000");
    }

    expense.policyViolations = policyViolations;

    await expense.save();

    // Return the expense without the receipt binary data
    const returnExpense = expense.toObject();
    if (returnExpense.receipt) {
      delete returnExpense.receipt.data;
    }

    res.json(returnExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(400).json({ error: "Failed to update expense", details: error.message });
  }
});

// Delete an expense
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Don't allow deletion of approved or rejected expenses
    if (expense.status !== "Pending") {
      return res.status(400).json({
        error: `Cannot delete an expense with status: ${expense.status}`
      });
    }

    await expense.remove();
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

// Get receipt image/PDF
router.get("/:id/receipt", async (req, res) => {
  try {
    // Find the expense without requiring authentication
    const expense = await Expense.findById(req.params.id);
    
    if (!expense || !expense.receipt || !expense.receipt.data) {
      return res.status(404).json({ error: "Receipt not found" });
    }
    
    // Log the expense ID to help debug
    console.log(`Serving receipt for expense: ${expense._id}`);
    
    // Set the correct content type and send the data
    res.set('Content-Type', expense.receipt.contentType);
    res.send(expense.receipt.data);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ error: "Failed to fetch receipt" });
  }
});

module.exports = router;