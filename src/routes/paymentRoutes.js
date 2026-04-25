const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPayments,
  getPaymentsByTenant,
  getPendingPayments,
  getPaymentSummary,
  updatePaymentStatus,
  deletePayment,
  getPaymentsByMonth,
  getOverduePayments
} = require('../controllers/paymentController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.route('/')
  .post(verifyToken, isAdmin, createPayment)
  .get(verifyToken, isAdmin, getPayments);

router.get('/pending', verifyToken, isAdmin, getPendingPayments);
router.get('/overdue', verifyToken, isAdmin, getOverduePayments);
router.get('/summary', verifyToken, isAdmin, getPaymentSummary);
router.get('/month/:month/:year', verifyToken, isAdmin, getPaymentsByMonth);
router.get('/tenant/:id', verifyToken, getPaymentsByTenant);

router.route('/:id')
  .delete(verifyToken, isAdmin, deletePayment);

router.put('/:id/status', verifyToken, isAdmin, updatePaymentStatus);

module.exports = router;
