import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";  // ✅ Ensure .jsx is used
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Navbar from "./components/Navbar.jsx";
import "./styles/global.css";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
