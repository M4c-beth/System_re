import React, { useState, useEffect } from "react";
import api from "../services/api";

const MongoDBExport = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  useEffect(() => {
    const fetchApprovedExpenses = async () => {
      try {
        const response = await api.get('/expenses?status=Approved&exported=false');
        setExpenses(response.data);
      } catch (error) {
        setError("Failed to fetch approved expenses");
        console.error("Error fetching expenses:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchApprovedExpenses();
  }, []);
  
  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);
      setResult(null);
      
      const response = await api.post('/mongodb/export');
      setResult(response.data);
      
      const updatedExpenses = await api.get('/expenses?status=Approved&exported=false');
      setExpenses(updatedExpenses.data);
    } catch (error) {
      setError("Failed to export expenses to MongoDB");
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };
  
  if (loading) return <div className="text-center p-10">Loading...</div>;
  
  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">MongoDB Export</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <h3 className="font-bold">Export Successful</h3>
          <p>Successfully exported expenses to MongoDB.</p>
        </div>
      )}
      
      {expenses.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No approved expenses ready for export.</p>
        </div>
      ) : (
        <>
          <table className="min-w-full divide-y divide-gray-200 mb-6">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Approved
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {expense.userId?.name || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{expense.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{expense.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${expense.amount.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(expense.approvalDate).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:bg-green-300"
            >
              {exporting ? "Exporting..." : "Export to MongoDB"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MongoDBExport;
