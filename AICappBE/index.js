require('dotenv').config(); // Loads environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');

const app = express();

const userRoutes = require('./routes/user');

// --- Middleware ---
// This allows your server to understand JSON data sent in requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected...'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- Routes ---
// All requests to '/auth' will be handled by our authRoutes file
app.use('/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/user'));
app.use('/api/device', require('./routes/device'));
app.use('/api/usage', require('./routes/electricityUsage'));
app.use('/api/budget', require('./routes/budget'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));