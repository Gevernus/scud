const mongoose = require('mongoose');

const NfcSchema = new mongoose.Schema({
  guid: { type: String, required: true },
  nfcName: { type: String, required: true },
  nfcDescription: { type: String, required: true },
  location: { type: String },
  attached: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false }
});

// A virtual field for the id
NfcSchema.virtual('id').get(function () {
  return this._id.toString();
});

// Enabling virtual fields in JSON
NfcSchema.set('toJSON', {
  virtuals: true,
});

module.exports = mongoose.model('Nfc', NfcSchema);