const express = require("express");
const Expense = require("../models/Expense");
const User = require("../models/User");
const {
  oauthClient,
  getAuthUrl,
  exchangeToken,
  makeApiCall,
  createReimbursement
} = require("../services/quickbooksService");
const { authenticateUser, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

// Route to initiate QuickBooks OAuth authentication
router.get("/auth", (req, res) => {
  try {
    console.log('Starting QuickBooks OAuth flow...');
    const authUrl = getAuthUrl();
    console.log('Redirecting to:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error("QuickBooks Auth Error:", error);
    res.status(500).json({
      error: "Failed to generate QuickBooks auth URL",
      details: error.message
    });
  }
});

// OAuth Callback Route
router.get("/callback", async (req, res) => {
  try {
    console.log('Received OAuth callback from QuickBooks');
    console.log('Query params:', req.query);

    if (req.query.error) {
      throw new Error(`OAuth error: ${req.query.error} - ${req.query.error_description}`);
    }

    const redirectUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    console.log('Full redirect URL:', redirectUrl);

    const authResponse = await exchangeToken(redirectUrl);
    console.log("QuickBooks Authentication Successful");

    // Redirect to company info page
    res.redirect("/api/quickbooks/company-info");
  } catch (error) {
    console.error("OAuth Callback Error:", error);
    res.status(500).json({
      error: "Failed to exchange token",
      details: error.message
    });
  }
});

// Fetch QuickBooks Company Info
router.get("/company-info", async (req, res) => {
  try {
    console.log('Attempting to fetch company info from QuickBooks...');

    // Try to get company info
    const companyInfo = await makeApiCall("companyinfo/1"); // Added /1 to specify the company ID suffix

    console.log('Company info fetched successfully!');
    res.json({
      success: true,
      message: "Connected to QuickBooks successfully",
      companyInfo
    });
  } catch (error) {
    console.error("Company Info Fetch Error:", error);

    // Prepare a detailed error message
    let errorDetails = error.message;
    if (error.response && error.response.data) {
      if (error.response.data.Fault) {
        errorDetails = JSON.stringify(error.response.data.Fault);
      } else {
        errorDetails = JSON.stringify(error.response.data);
      }
    }

    res.status(500).json({
      error: "Failed to fetch company info",
      details: errorDetails
    });
  }
});

// Simple test endpoint to check QuickBooks connection status
router.get("/connection-status", async (req, res) => {
  try {
    console.log('Checking QuickBooks connection status...');
    // Display QuickBooks configuration for debugging
    const config = {
      environment: process.env.QB_ENVIRONMENT,
      redirectUri: process.env.QB_REDIRECT_URI,
      companyId: process.env.QB_COMPANY_ID,
      // Don't expose the full client credentials
      hasClientId: !!process.env.QB_CLIENT_ID,
      hasClientSecret: !!process.env.QB_CLIENT_SECRET
    };

    // Check if we have valid tokens
    const connectionStatus = {
      config,
      connected: false,
      message: "Not connected to QuickBooks. Please authorize first."
    };

    try {
      // Try to make a simple API call to check connection
      const response = await makeApiCall("query?query=select * from CompanyInfo limit 1");

      // If we got here, we're connected
      connectionStatus.connected = true;
      connectionStatus.message = "Successfully connected to QuickBooks!";

      if (response && response.QueryResponse && response.QueryResponse.CompanyInfo) {
        connectionStatus.companyName = response.QueryResponse.CompanyInfo[0].CompanyName;
      }
    } catch (error) {
      console.log('Connection test failed:', error.message);
      // Keep default "not connected" status
    }

    res.json(connectionStatus);
  } catch (error) {
    console.error("Connection Status Error:", error);
    res.status(500).json({
      error: "Failed to check connection status",
      details: error.message
    });
  }
});

// Export approved expenses to QuickBooks
router.post("/export", authenticateUser, authorizeRoles("finance"), async (req, res) => {
  try {
    // Get all approved expenses that haven't been exported
    const expenses = await Expense.find({
      status: "Approved",
      exportedToQuickbooks: { $ne: true }
    }).populate('userId');

    if (expenses.length === 0) {
      return res.json({ message: "No expenses to export" });
    }

    // Group expenses by user
    const expensesByUser = {};
    expenses.forEach(expense => {
      const userId = expense.userId._id.toString();
      if (!expensesByUser[userId]) {
        expensesByUser[userId] = {
          user: expense.userId,
          expenses: []
        };
      }
      expensesByUser[userId].expenses.push(expense);
    });

    // Create reimbursements in QuickBooks for each user
    const results = [];

    for (const userId in expensesByUser) {
      const { user, expenses } = expensesByUser[userId];

      // Create the reimbursement in QuickBooks
      const reimbursement = await createReimbursement(user, expenses);

      // Mark expenses as exported
      const expenseIds = expenses.map(expense => expense._id);
      await Expense.updateMany(
        { _id: { $in: expenseIds } },
        { exportedToQuickbooks: true }
      );

      results.push({
        employee: user.name,
        expenseCount: expenses.length,
        totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        quickbooksId: reimbursement.Bill.Id
      });
    }

    res.json({
      message: "Expenses exported successfully",
      results
    });
  } catch (error) {
    console.error("QuickBooks Export Error:", error);

    // Prepare a detailed error message
    let errorDetails = error.message;
    if (error.response && error.response.data) {
      if (error.response.data.Fault) {
        errorDetails = JSON.stringify(error.response.data.Fault);
      } else {
        errorDetails = JSON.stringify(error.response.data);
      }
    }

    res.status(500).json({
      error: "Failed to export expenses to QuickBooks",
      details: errorDetails
    });
  }
});

module.exports = router;