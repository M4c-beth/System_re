const express = require("express");
const Expense = require("../models/Expense");
const User = require("../models/User");
const { authenticateUser, authorizeRoles } = require("../middlewares/authMiddleware");
const router = express.Router();

// Get all pending expenses for manager to approve
router.get("/pending", authenticateUser, authorizeRoles("manager", "finance"), async (req, res) => {
  try {
    let query = { status: "Pending" };
    
    // If user is a manager, check for team members
    if (req.user.role === "manager") {
      // Get all users managed by this manager
      const teamMembers = await User.find({ managerId: req.user._id });
      
      // If this manager has team members defined, only show their expenses
      if (teamMembers && teamMembers.length > 0) {
        const teamMemberIds = teamMembers.map(member => member._id);
        query.userId = { $in: teamMemberIds };
      }
      // Otherwise show all pending expenses (temporary for testing)
    }
    
    // Debug info for the query
    console.log('Approval query:', query);
    
    const expenses = await Expense.find(query)
      .select('-receipt.data') // Exclude the binary data but keep receipt metadata
      .populate('userId', 'name email department')
      .sort({ createdAt: -1 });
    
    // Debug info for returned expenses  
    console.log(`Found ${expenses.length} pending expenses`);
    expenses.forEach(exp => {
      console.log(`Expense ID: ${exp._id}, Has receipt: ${!!exp.receipt}`);
    });
      
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching pending expenses:', error);
    res.status(500).json({ error: "Failed to fetch pending expenses" });
  }
});

// Approve an expense
router.post("/:id/approve", authenticateUser, authorizeRoles("manager", "finance"), async (req, res) => {
  try {
    const { notes } = req.body;
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Only allow approving pending expenses
    if (expense.status !== "Pending") {
      return res.status(400).json({
        error: `Cannot approve an expense with status: ${expense.status}`
      });
    }

    // If user is a manager, check team membership only if relationships are defined
    if (req.user.role === "manager") {
      const expenseUser = await User.findById(expense.userId);

      // Skip team check if no managerId is set for the expense submitter
      if (expenseUser && expenseUser.managerId) {
        if (expenseUser.managerId.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            error: "You can only approve expenses from your team members"
          });
        }
      }
    }

    // Update expense status
    expense.status = "Approved";
    expense.approvedBy = req.user._id;
    expense.approvalDate = new Date();

    // Add approval notes if provided
    if (notes) {
      expense.notes = expense.notes
        ? `${expense.notes}\n\nApproval notes: ${notes}`
        : `Approval notes: ${notes}`;
    }

    await expense.save();

    // Return the updated expense
    const updatedExpense = await Expense.findById(expense._id)
      .select('-receipt.data')
      .populate('userId', 'name email department')
      .populate('approvedBy', 'name role');

    res.json(updatedExpense);
  } catch (error) {
    console.error('Error approving expense:', error);
    res.status(500).json({ error: "Failed to approve expense" });
  }
});

// Reject an expense
router.post("/:id/reject", authenticateUser, authorizeRoles("manager", "finance"), async (req, res) => {
  try {
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Only allow rejecting pending expenses
    if (expense.status !== "Pending") {
      return res.status(400).json({
        error: `Cannot reject an expense with status: ${expense.status}`
      });
    }

    // If user is a manager, check team membership only if relationships are defined
    if (req.user.role === "manager") {
      const expenseUser = await User.findById(expense.userId);

      // Skip team check if no managerId is set for the expense submitter
      if (expenseUser && expenseUser.managerId) {
        if (expenseUser.managerId.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            error: "You can only reject expenses from your team members"
          });
        }
      }
    }

    // Update expense status
    expense.status = "Rejected";
    expense.approvedBy = req.user._id;
    expense.approvalDate = new Date();

    // Add rejection notes
    expense.notes = expense.notes
      ? `${expense.notes}\n\nRejection reason: ${notes}`
      : `Rejection reason: ${notes}`;

    await expense.save();

    // Return the updated expense
    const updatedExpense = await Expense.findById(expense._id)
      .select('-receipt.data')
      .populate('userId', 'name email department')
      .populate('approvedBy', 'name role');

    res.json(updatedExpense);
  } catch (error) {
    console.error('Error rejecting expense:', error);
    res.status(500).json({ error: "Failed to reject expense" });
  }
});

module.exports = router;