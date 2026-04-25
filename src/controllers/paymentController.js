const Payment = require('../models/Payment');
const axios = require('axios');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4005';

exports.createPayment = async (req, res) => {
  try {
    const { tenantId, amount, month, year, description } = req.body;
    const payment = await Payment.create({ tenantId, amount, month, year, description, status: 'pending' });
    
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
        tenantId,
        title: 'New Bill Generated',
        message: `A new bill of ₹${amount} for ${month} ${year} has been generated.`,
        type: 'payment'
      }, {
        headers: { Authorization: req.headers.authorization }
      });
    } catch (err) {
      console.warn('Failed to send notification:', err.message);
    }

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({}).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentsByTenant = async (req, res) => {
  try {
    if (req.user.role === 'tenant' && req.params.id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const payments = await Payment.find({ tenantId: req.params.id }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOverduePayments = async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'overdue' }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentsByMonth = async (req, res) => {
  try {
    const { month, year } = req.params;
    const payments = await Payment.find({ month, year }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    
    payment.status = status;
    if (status === 'paid' || status === 'completed') {
      payment.status = 'completed';
      payment.paymentDate = new Date();
    }
    const updatedPayment = await payment.save();

    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
        tenantId: payment.tenantId,
        title: 'Payment Status Updated',
        message: `Your payment for ${payment.month} ${payment.year} is now ${status}.`,
        type: 'payment'
      }, {
        headers: { Authorization: req.headers.authorization }
      });
    } catch (err) {
      console.warn('Failed to send notification:', err.message);
    }

    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    await payment.deleteOne();
    res.json({ message: 'Payment removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentSummary = async (req, res) => {
  try {
    const totalPending = await Payment.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalCollected = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalOverdue = await Payment.aggregate([
      { $match: { status: 'overdue' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      pendingAmount: totalPending[0] ? totalPending[0].total : 0,
      collectedAmount: totalCollected[0] ? totalCollected[0].total : 0,
      overdueAmount: totalOverdue[0] ? totalOverdue[0].total : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
