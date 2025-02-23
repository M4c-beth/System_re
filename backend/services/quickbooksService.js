require('dotenv').config();
const OAuthClient = require('intuit-oauth');

const oauthClient = new OAuthClient({
    clientId: process.env.QB_CLIENT_ID,
    clientSecret: process.env.QB_CLIENT_SECRET,
    environment: process.env.QB_ENVIRONMENT, // 'sandbox' or 'production'
    redirectUri: process.env.QB_REDIRECT_URI
});

const getAuthUrl = () => {
    return oauthClient.authorizeUri({
        scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
        state: 'Init'
    });
};

const exchangeToken = async (redirectUrl) => {
    try {
        const authResponse = await oauthClient.createToken(redirectUrl);
        return authResponse;
    } catch (error) {
        console.error('OAuth Token Exchange Error:', error);
        throw error;
    }
};

const makeApiCall = async (endpoint) => {
    try {
        const response = await oauthClient.makeApiCall({
            url: `https://sandbox-quickbooks.api.intuit.com/v3/company/${process.env.QB_COMPANY_ID}/${endpoint}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${oauthClient.getToken().getToken()}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return JSON.parse(response.body);
    } catch (error) {
        console.error('QuickBooks API Call Error:', error.response ? error.response.body : error.message);
        throw error;
    }
};

// Export functions for use in routes
module.exports = { oauthClient, getAuthUrl, exchangeToken, makeApiCall };
