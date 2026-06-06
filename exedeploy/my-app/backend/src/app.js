const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const couponRoutes = require('./routes/couponRoutes');

const { query } = require('./config/db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Visitor stats routes
app.get('/api/visitors', async (req, res, next) => {
  try {
    const row = await query.get('SELECT count FROM visitor_stats WHERE id = 1');
    res.json({ success: true, count: row ? row.count : 0 });
  } catch (error) {
    next(error);
  }
});

app.post('/api/visitors/increment', async (req, res, next) => {
  try {
    await query.run('UPDATE visitor_stats SET count = count + 1 WHERE id = 1');
    const row = await query.get('SELECT count FROM visitor_stats WHERE id = 1');
    res.json({ success: true, count: row ? row.count : 0 });
  } catch (error) {
    next(error);
  }
});

// Routes mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/coupons', couponRoutes);

// Base route for API check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'T-Shirt Shop Backend API is running successfully.'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected error occurred on the server.'
  });
});

module.exports = app;
