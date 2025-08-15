require('dotenv').config(); // Loads environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// --- Middleware ---
// This allows your server to understand JSON data sent in requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected...'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- Routes ---
// All requests to '/auth' will be handled by our authRoutes file
app.use('/auth', require('./routes/authRoutes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));