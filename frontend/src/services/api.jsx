import axios from "axios";

const API_BASE_URL = "http://localhost:4000/api"; // Change if backend runs on another port

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Authentication API
export const loginUser = async (credentials) => {
  return await api.post("/auth/login", credentials);
};

// Fetch user data
export const getUserProfile = async () => {
  return await api.get("/user/profile");
};

// Fetch expenses
export const getExpenses = async () => {
  return await api.get("/expenses");
};

export default api;
