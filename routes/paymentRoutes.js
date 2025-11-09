const express = require('express');
const { createOrder, verifyPayment, getMyTransactions, getAllTransactionsAdmin } = require('../controllers/paymentController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // Keep this one global middleware

router.post('/create-order', createOrder); // Remove duplicate protect
router.post('/verify-payment', verifyPayment);
router.get('/my-transactions', getMyTransactions);
// Admin
router.get('/all-transactions', isAdmin, getAllTransactionsAdmin);

module.exports = router;