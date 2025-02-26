import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { expenseAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ReceiptViewer from "../components/ReceiptViewer";


const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    timeframe: "all"
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [viewingReceipt, setViewingReceipt] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const data = await expenseAPI.getAll();
        setExpenses(data);

        // Calculate statistics
        const total = data.reduce((sum, exp) => sum + exp.amount, 0);
        const pending = data.filter(exp => exp.status === "Pending").length;
        const approved = data.filter(exp => exp.status === "Approved").length;
        const rejected = data.filter(exp => exp.status === "Rejected").length;

        setStats({ total, pending, approved, rejected });
      } catch (error) {
        setError("Failed to fetch expenses");
        console.error("Error fetching expenses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const filteredExpenses = expenses.filter(expense => {
    // Filter by status
    if (filters.status !== "all" && expense.status !== filters.status) {
      return false;
    }

    // Filter by category
    if (filters.category !== "all" && expense.category !== filters.category) {
      return false;
    }

    // Filter by timeframe
    if (filters.timeframe !== "all") {
      const expenseDate = new Date(expense.date);
      const today = new Date();

      switch (filters.timeframe) {
        case "week":
          const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          return expenseDate >= weekAgo;
        case "month":
          const monthAgo = new Date();
          monthAgo.setMonth(today.getMonth() - 1);
          return expenseDate >= monthAgo;
        case "quarter":
          const quarterAgo = new Date();
          quarterAgo.setMonth(today.getMonth() - 3);
          return expenseDate >= quarterAgo;
        default:
          return true;
      }
    }

    return true;
  });

  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto mt-10">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm">Total Expenses</h3>
          <p className="text-2xl font-bold">${stats.total.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm">Pending</h3>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm">Approved</h3>
          <p className="text-2xl font-bold">{stats.approved}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm">Rejected</h3>
          <p className="text-2xl font-bold">{stats.rejected}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Expense Dashboard</h2>
          <Link
            to="/expenses/new"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            + New Expense
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="border rounded-lg px-3 py-2"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Category</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="border rounded-lg px-3 py-2"
            >
              <option value="all">All Categories</option>
              <option value="Travel">Travel</option>
              <option value="Meals">Meals</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Equipment">Equipment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Timeframe</label>
            <select
              name="timeframe"
              value={filters.timeframe}
              onChange={handleFilterChange}
              className="border rounded-lg px-3 py-2"
            >
              <option value="all">All Time</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="quarter">Past Quarter</option>
            </select>
          </div>
        </div>

        {/* Expenses Table */}
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No expenses found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {expense.description}
                      </div>
                      {expense.policyViolations && expense.policyViolations.length > 0 && (
                        <div className="text-xs text-red-500 mt-1">
                          Policy violation
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${expense.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{expense.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(expense.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${expense.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        expense.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {expense.receipt ? (
                        <button
                          onClick={() => setViewingReceipt(expense._id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </button>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {viewingReceipt && (
        <ReceiptViewer
          expenseId={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;