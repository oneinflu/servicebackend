require('dotenv').config();
const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const jobRoutes = require('./routes/jobRoutes');
const jobProfileRoutes = require('./routes/jobProfileRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const viewRoutes = require('./routes/viewRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const governmentJobRoutes = require('./routes/governmentJobRoutes');
const companyRoutes = require('./routes/companyRoutes');
const usageRoutes = require('./routes/usageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const referralRoutes = require('./routes/referralRoutes');
const walletRoutes = require('./routes/walletRoutes');
const locationRoutes = require('./routes/locationRoutes');
const app = express();

// Middleware
// CORS: allow any origin (React dev port changes), and Authorization header
const corsOptions = {
  origin: (origin, callback) => callback(null, true),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
  maxAge: 86400, // cache preflight for 1 day
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add middleware to extract token from query params if present
app.use((req, res, next) => {
  if (req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
});

// Routes
app.use('/', viewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/job-profiles', jobProfileRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/government-jobs', governmentJobRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/location', locationRoutes);
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Set up Handlebars
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});