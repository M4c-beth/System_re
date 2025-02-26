import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { expenseAPI } from "../services/api";

const ExpenseForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });
  const [receipt, setReceipt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [policyViolations, setPolicyViolations] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setReceipt(e.target.files[0]);
      
      // Clear receipt error if it exists
      if (errors.receipt) {
        setErrors({ ...errors, receipt: null });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    
    if (!formData.amount) {
      newErrors.amount = "Amount is required";
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be a positive number";
    }
    
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    
    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    
    if (!receipt) {
      newErrors.receipt = "Receipt is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setPolicyViolations([]);
    
    try {
      // Create form data for file upload
      const expenseFormData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        expenseFormData.append(key, formData[key]);
      });
      
      // Add receipt file
      if (receipt) {
        expenseFormData.append('receipt', receipt);
      }
      
      // Submit the expense
      const result = await expenseAPI.create(expenseFormData);
      
      // Check for policy violations
      if (result.policyViolations && result.policyViolations.length > 0) {
        setPolicyViolations(result.policyViolations);
      } else {
        // Redirect to dashboard on success
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error submitting expense:", error);
      setErrors({ 
        submit: error.response?.data?.error || "Failed to submit expense" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Submit New Expense</h2>
      
      {errors.submit && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errors.submit}
        </div>
      )}
      
      {policyViolations.length > 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
          <h3 className="font-bold">Policy Violations Detected:</h3>
          <ul className="list-disc pl-5">
            {policyViolations.map((violation, index) => (
              <li key={index}>{violation}</li>
            ))}
          </ul>
          <p className="mt-2">
            You can still submit this expense, but it may be rejected by your manager.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-2">Description*</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.description ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>
        
        <div>
          <label className="block text-gray-700 mb-2">Amount ($)*</label>
          <input
            type="number"
            name="amount"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.amount ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.amount && (
            <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
          )}
        </div>
        
        <div>
          <label className="block text-gray-700 mb-2">Category*</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.category ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Select a category</option>
            <option value="Travel">Travel</option>
            <option value="Meals">Meals</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Equipment">Equipment</option>
            <option value="Other">Other</option>
          </select>
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">{errors.category}</p>
          )}
        </div>
        
        <div>
          <label className="block text-gray-700 mb-2">Date*</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.date ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.date && (
            <p className="text-red-500 text-sm mt-1">{errors.date}</p>
          )}
        </div>
        
        <div>
          <label className="block text-gray-700 mb-2">Receipt*</label>
          <input
            type="file"
            name="receipt"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.receipt ? "border-red-500" : "border-gray-300"
            }`}
          />
          <p className="text-gray-500 text-sm mt-1">
            Accepted formats: JPG, PNG, PDF (Max size: 5MB)
          </p>
          {errors.receipt && (
            <p className="text-red-500 text-sm mt-1">{errors.receipt}</p>
          )}
        </div>
        
        <div>
          <label className="block text-gray-700 mb-2">Notes (Optional)</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          ></textarea>
        </div>
        
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isSubmitting ? "Submitting..." : "Submit Expense"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;