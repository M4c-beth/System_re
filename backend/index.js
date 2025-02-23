require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const quickbooksRoutes = require('./routes/quickbooksRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true })); // Allow frontend access
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/quickbooks', quickbooksRoutes);

// Default Route
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => console.error('MongoDB connection error:', err));
