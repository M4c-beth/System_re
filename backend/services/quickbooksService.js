require('dotenv').config();
const OAuthClient = require('intuit-oauth');
const axios = require('axios');

// Store tokens in memory (for development - in production, use a database)
let oauthTokens = null;

// Create OAuth client
const oauthClient = new OAuthClient({
  clientId: process.env.QB_CLIENT_ID,
  clientSecret: process.env.QB_CLIENT_SECRET,
  environment: process.env.QB_ENVIRONMENT || 'sandbox', // Default to sandbox
  redirectUri: process.env.QB_REDIRECT_URI
});

// Get auth URL for OAuth flow
const getAuthUrl = () => {
  console.log('Generating QuickBooks auth URL...');
  console.log('QB_ENVIRONMENT:', process.env.QB_ENVIRONMENT);
  console.log('QB_REDIRECT_URI:', process.env.QB_REDIRECT_URI);
  
  return oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
    state: 'Init'
  });
};

// Exchange authorization code for tokens
const exchangeToken = async (redirectUrl) => {
  try {
    console.log('Exchanging tokens with redirectUrl:', redirectUrl);
    const authResponse = await oauthClient.createToken(redirectUrl);
    
    // Store tokens in our variable (would store in database in production)
    oauthTokens = authResponse.getJson();
    
    console.log('OAuth tokens received:');
    console.log('Access token expires in:', oauthTokens.expires_in, 'seconds');
    console.log('Refresh token available:', !!oauthTokens.refresh_token);
    
    return authResponse;
  } catch (error) {
    console.error('OAuth Token Exchange Error:', error.message);
    if (error.intuit_tid) {
      console.error('Intuit Transaction ID:', error.intuit_tid);
    }
    throw error;
  }
};

// Check token validity and refresh if needed
const ensureTokensValid = async () => {
  // If we don't have tokens yet, we need to go through OAuth flow
  if (!oauthTokens) {
    console.error('No OAuth tokens available. User must authorize with QuickBooks first.');
    throw new Error('OAuth tokens not available. Please authorize with QuickBooks.');
  }
  
  // Check if access token is expired
  if (oauthClient.isAccessTokenValid()) {
    console.log('Access token is still valid');
    return true;
  }
  
  // Access token is expired, try to refresh
  console.log('Access token expired, attempting to refresh...');
  
  try {
    // Set the tokens before refreshing
    oauthClient.setToken(oauthTokens);
    
    const refreshResponse = await oauthClient.refresh();
    // Update our stored tokens
    oauthTokens = refreshResponse.getJson();
    
    console.log('Tokens refreshed successfully');
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error.message);
    throw new Error('Failed to refresh QuickBooks tokens. Please reauthorize.');
  }
};

// Make API call to QuickBooks
const makeApiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    // Ensure tokens are valid before making API call
    await ensureTokensValid();
    
    const baseUrl = process.env.QB_ENVIRONMENT === 'production' 
      ? 'https://quickbooks.api.intuit.com/v3/company/'
      : 'https://sandbox-quickbooks.api.intuit.com/v3/company/';
    
    const url = `${baseUrl}${process.env.QB_COMPANY_ID}/${endpoint}`;
    
    console.log(`Making ${method} request to QuickBooks API:`, url);
    
    const response = await axios({
      url,
      method,
      headers: {
        'Authorization': `Bearer ${oauthTokens.access_token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      data: data ? JSON.stringify(data) : undefined
    });
    
    console.log('QuickBooks API call successful');
    return response.data;
  } catch (error) {
    console.error('QuickBooks API Call Error:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response Status:', error.response.status);
      console.error('Response Headers:', error.response.headers);
      console.error('Response Data:', error.response.data);
      
      // Specific QuickBooks error handling
      if (error.response.data && error.response.data.Fault) {
        console.error('QuickBooks Fault:', error.response.data.Fault);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from QuickBooks API');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    throw error;
  }
};

// Create employee reimbursement in QuickBooks
const createReimbursement = async (employee, expenses) => {
  try {
    // First, make sure we have the employee in QuickBooks
    const employeeQuery = await makeApiCall(
      `query?query=select * from Employee where DisplayName = '${employee.name}'`
    );
    
    let employeeRef;
    
    if (employeeQuery.QueryResponse.Employee && 
        employeeQuery.QueryResponse.Employee.length > 0) {
      employeeRef = employeeQuery.QueryResponse.Employee[0];
    } else {
      // Create the employee if they don't exist
      const newEmployee = {
        DisplayName: employee.name,
        PrimaryEmailAddr: {
          Address: employee.email
        },
        FamilyName: employee.name.split(' ').pop(),
        GivenName: employee.name.split(' ')[0]
      };
      
      const createdEmployee = await makeApiCall('employee', 'POST', { 
        Employee: newEmployee 
      });
      
      employeeRef = createdEmployee.Employee;
    }
    
    // Create a Bill to track the reimbursement
    const today = new Date();
    const billItems = expenses.map(expense => ({
      DetailType: "AccountBasedExpenseLineDetail",
      Amount: expense.amount,
      Description: expense.description,
      AccountBasedExpenseLineDetail: {
        AccountRef: {
          name: mapCategoryToAccount(expense.category),
          value: "1" // This would be the actual QuickBooks account ID
        },
        BillableStatus: "NotBillable",
        TaxCodeRef: {
          value: "NON" // Non-taxable
        }
      }
    }));
    
    const billData = {
      VendorRef: {
        value: employeeRef.Id,
        name: employeeRef.DisplayName
      },
      Line: billItems,
      TxnDate: today.toISOString().split('T')[0],
      DueDate: new Date(today.setDate(today.getDate() + 30))
        .toISOString().split('T')[0],
      PrivateNote: "Employee reimbursement"
    };
    
    const createdBill = await makeApiCall('bill', 'POST', { Bill: billData });
    
    return createdBill;
  } catch (error) {
    console.error('Create Reimbursement Error:', error);
    throw error;
  }
};

// Map expense categories to QuickBooks accounts
const mapCategoryToAccount = (category) => {
  // This would be replaced with actual mapping to your QuickBooks accounts
  const categoryMap = {
    "Travel": "Travel Expenses",
    "Meals": "Meals and Entertainment",
    "Office Supplies": "Office Supplies",
    "Equipment": "Equipment Expense",
    "Other": "Miscellaneous Expense"
  };
  
  return categoryMap[category] || "Miscellaneous Expense";
};

module.exports = { 
  oauthClient, 
  getAuthUrl, 
  exchangeToken, 
  makeApiCall,
  createReimbursement
};