const express = require("express");
const { oauthClient, getAuthUrl, exchangeToken, makeApiCall } = require("../services/quickbooksService");

const router = express.Router();

// Route to initiate QuickBooks OAuth authentication
router.get("/auth", (req, res) => {
    try {
        const authUrl = getAuthUrl();
        res.redirect(authUrl);
    } catch (error) {
        console.error("QuickBooks Auth Error:", error);
        res.status(500).json({ error: "Failed to generate QuickBooks auth URL" });
    }
});

// OAuth Callback Route
router.get("/callback", async (req, res) => {
    try {
        const redirectUrl = req.originalUrl;
        const authResponse = await exchangeToken(redirectUrl);
        console.log("QuickBooks Authentication Successful:", authResponse);
        res.redirect("/api/quickbooks/company-info");
    } catch (error) {
        console.error("OAuth Callback Error:", error);
        res.status(500).json({ error: "Failed to exchange token", details: error.message });
    }
});

// Fetch QuickBooks Company Info
router.get("/company-info", async (req, res) => {
    try {
        const companyInfo = await makeApiCall("companyinfo");
        res.json(companyInfo);
    } catch (error) {
        console.error("Company Info Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch company info", details: error.message });
    }
});

module.exports = router;
