const express = require('express');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { requestWithdrawal, getMyWalletTransactions, listWithdrawals, approveWithdrawal, payWithdrawal, getAllWalletTransactionsAdmin } = require('../controllers/walletController');

const router = express.Router();

router.use(protect);

// User endpoints
router.post('/withdrawals/request', requestWithdrawal);
router.get('/my-transactions', getMyWalletTransactions);

// Admin endpoints
router.get('/withdrawals', listWithdrawals);
router.patch('/withdrawals/:id/approve', approveWithdrawal);
router.post('/withdrawals/:id/pay', payWithdrawal);
router.get('/all-transactions', isAdmin, getAllWalletTransactionsAdmin);

module.exports = router;