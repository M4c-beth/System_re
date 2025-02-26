import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import ReceiptViewer from "../components/ReceiptViewer"; // Add this import

const ApprovalDashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // For rejection modal
  const [showModal, setShowModal] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [currentExpenseId, setCurrentExpenseId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Add this for receipt viewing
  const [viewingReceipt, setViewingReceipt] = useState(null);

  useEffect(() => {
    const fetchPendingExpenses = async () => {
      try {
        const response = await api.get('/approvals/pending');

        // Log expenses for debugging
        console.log('Fetched expenses:', response.data);

        // Log expense IDs specifically
        if (response.data && response.data.length > 0) {
          console.log('Expense IDs:');
          response.data.forEach(exp => {
            console.log(`ID: ${exp._id}, Has receipt: ${!!exp.receipt}`);
          });
        }

        setExpenses(response.data);
      } catch (error) {
        setError("Failed to fetch pending expenses");
        console.error("Error fetching pending expenses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingExpenses();
  }, []);

  const handleApprove = async (expenseId) => {
    try {
      setSubmitLoading(true);
      await api.post(`/approvals/${expenseId}/approve`);

      // Remove the approved expense from the list
      setExpenses(expenses.filter(expense => expense._id !== expenseId));
    } catch (error) {
      setError("Failed to approve expense");
      console.error("Error approving expense:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRejectClick = (expenseId) => {
    setCurrentExpenseId(expenseId);
    setRejectionNotes("");
    setShowModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionNotes.trim()) {
      return;
    }

    try {
      setSubmitLoading(true);
      await api.post(`/approvals/${currentExpenseId}/reject`, { notes: rejectionNotes });

      // Remove the rejected expense from the list
      setExpenses(expenses.filter(expense => expense._id !== currentExpenseId));

      // Close the modal
      setShowModal(false);
    } catch (error) {
      setError("Failed to reject expense");
      console.error("Error rejecting expense:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Expense Approval Dashboard</h2>

      {expenses.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No pending expenses to approve</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
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
                    <div className="text-sm text-gray-500">
                      {expense.userId?.email || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{expense.description}</div>
                    {expense.policyViolations && expense.policyViolations.length > 0 && (
                      <div className="text-xs text-red-500 mt-1">
                        Policy violation detected
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${expense.amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{expense.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {expense.receipt ? (
                      <button
                        onClick={() => setViewingReceipt(expense._id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Receipt
                      </button>
                    ) : (
                      <span className="text-gray-500">No receipt</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleApprove(expense._id)}
                      disabled={submitLoading}
                      className="text-green-600 hover:text-green-900 mr-4"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectClick(expense._id)}
                      disabled={submitLoading}
                      className="text-red-600 hover:text-red-900"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rejection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Reject Expense</h3>
            <p className="text-sm text-gray-500 mb-4">
              Please provide a reason for rejecting this expense.
            </p>
            <textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              rows="3"
              placeholder="Rejection reason..."
            ></textarea>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectionNotes.trim() || submitLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-red-300"
              >
                {submitLoading ? "Submitting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Viewer */}
      {viewingReceipt && (
        <ReceiptViewer
          expenseId={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
        />
      )}
    </div>
  );
};

export default ApprovalDashboard;