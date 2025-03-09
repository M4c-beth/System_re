// frontend/src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-4">
            <Link to="/" className="flex items-center hover:text-blue-500">
              Home
            </Link>
            {user && (
              <>
                <Link to="/dashboard" className="flex items-center hover:text-blue-500">
                  Dashboard
                </Link>
                {(user.role === "manager" || user.role === "finance") && (
                  <Link to="/approvals" className="flex items-center hover:text-blue-500">
                    Approvals
                  </Link>
                )}
                {(user.role === "manager" || user.role === "finance") && (
                  <Link to="/reports" className="flex items-center hover:text-blue-500">
                    Reports
                  </Link>
                )}
                {user.role === "finance" && (
                  <Link to="/mongodb/export" className="flex items-center hover:text-blue-500">
                    MongoDBExport
                  </Link>
                )}
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  {user.name} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;