// frontend/src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-4xl font-bold mb-6">Welcome to Expense Manager</h1>
      <p className="text-lg mb-6">
        Manage your expenses easily and efficiently with our powerful expense tracking system.
      </p>
      
      {!user ? (
        <div className="space-y-4">
          <p className="text-gray-600">
            Please login to access your dashboard and manage your expenses.
          </p>
          <Link
            to="/login"
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Login Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600">
            Welcome back! Head to your dashboard to manage your expenses.
          </p>
          <Link
            to="/dashboard"
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Go to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;