// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { expenseAPI } from "../services/api";

const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const data = await expenseAPI.getAll();
        setExpenses(data);
      } catch (error) {
        setError("Failed to fetch expenses");
        console.error("Error fetching expenses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Expense Dashboard</h2>
      {expenses.length === 0 ? (
        <p>No expenses found.</p>
      ) : (
        <ul className="space-y-4">
          {expenses.map((expense) => (
            <li 
              key={expense._id} 
              className="border p-4 rounded-lg shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{expense.description}</h3>
                  <p className="text-gray-600">Date: {new Date(expense.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-bold">${expense.amount}</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    expense.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    expense.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {expense.status}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;