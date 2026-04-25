const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Database Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB - Payment Service'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Health & Ready endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'payment-service' });
});

app.get('/ready', (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.status(200).json({ status: 'ready', service: 'payment-service', db: 'connected' });
  } else {
    res.status(503).json({ status: 'not ready', service: 'payment-service', db: 'disconnected' });
  }
});

// Routes
app.use('/api/payments', paymentRoutes);

// Error Handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});
