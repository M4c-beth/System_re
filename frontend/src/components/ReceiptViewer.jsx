import React, { useState, useEffect } from "react";
import api from "../services/api";

const ReceiptViewer = ({ expenseId, onClose }) => {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        console.log(`Fetching receipt for expense ID: ${expenseId}`);
        
        // Use direct URL instead of relative path for debugging
        const fullUrl = `${import.meta.env.VITE_API_URL}/expenses/${expenseId}/receipt`;
        console.log(`Full URL: ${fullUrl}`);
        
        const response = await api.get(fullUrl, {
          responseType: 'blob'
        });
        
        // Create a blob URL from the receipt data
        const receiptUrl = URL.createObjectURL(response.data);
        setReceipt(receiptUrl);
        console.log("Receipt loaded successfully");
      } catch (err) {
        console.error("Receipt fetch error:", err);
        setError(`Failed to load receipt: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReceipt();
    
    // Clean up the blob URL on unmount
    return () => {
      if (receipt) {
        URL.revokeObjectURL(receipt);
      }
    };
  }, [expenseId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-2xl max-h-[90vh] w-full overflow-auto">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-bold">Receipt</h3>
          <button 
            onClick={onClose}
            className="text-gray-700 hover:text-gray-900"
          >
            ✕
          </button>
        </div>
        
        <div className="receipt-container">
          {loading && <div className="text-center p-10">Loading receipt...</div>}
          
          {error && (
            <div className="text-center p-6 text-red-500 bg-red-50 rounded-lg">
              <p className="font-bold mb-2">Error</p>
              <p>{error}</p>
              <p className="text-sm mt-4">Expense ID: {expenseId}</p>
            </div>
          )}
          
          {receipt && (
            <img 
              src={receipt}
              alt="Receipt"
              className="max-w-full mx-auto"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptViewer;