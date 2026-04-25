const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  amount: { type: Number, required: true },
  month: { type: String, required: true }, // e.g., "October 2023"
  year: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'overdue'], default: 'pending' },
  paymentDate: { type: Date },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
