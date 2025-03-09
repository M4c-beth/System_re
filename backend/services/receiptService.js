const axios = require('axios');
const FormData = require('form-data');

const RECEIPT_AI_URL = process.env.RECEIPT_AI_URL || 'http://localhost:8000/api';

const analyzeReceipt = async (receiptBuffer, filename, contentType, category) => {
  try {
    const formData = new FormData();
    formData.append('file', receiptBuffer, {
      filename,
      contentType
    });
    
    if (category) {
      formData.append('category', category);
    }
    
    const response = await axios.post(`${RECEIPT_AI_URL}/analyze-receipt`, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Receipt analysis error:', error.response?.data || error.message);
    throw new Error('Failed to analyze receipt');
  }
};

const checkDuplicate = async (receiptBuffer, filename, contentType) => {
  try {
    const formData = new FormData();
    formData.append('file', receiptBuffer, {
      filename,
      contentType
    });
    
    const response = await axios.post(`${RECEIPT_AI_URL}/detect-duplicate`, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Duplicate check error:', error.response?.data || error.message);
    throw new Error('Failed to check for duplicate receipt');
  }
};

module.exports = {
  analyzeReceipt,
  checkDuplicate
};
