const mongoose = require('mongoose');

// Logged when someone taps to contact a service provider — this is what
// "Service Leads" on the provider's dashboard counts.
const serviceLeadSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contactedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

serviceLeadSchema.index({ provider: 1, createdAt: -1 });

module.exports = mongoose.model('ServiceLead', serviceLeadSchema);
