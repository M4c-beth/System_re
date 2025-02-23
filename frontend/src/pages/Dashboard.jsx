import React, { useEffect, useState } from "react";
import { getExpenses } from "../services/api";

const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await getExpenses();
        setExpenses(response.data);
      } catch (error) {
        console.error("Error fetching expenses:", error);
      }
    };

    fetchExpenses();
  }, []);

  return (
    <div>
      <h2>Expense Dashboard</h2>
      <ul>
        {expenses.map((expense) => (
          <li key={expense.id}>
            {expense.description} - ${expense.amount}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
