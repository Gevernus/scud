const mongoose = require('mongoose');

const lockUsersSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  username: { type: String },
  createdAt: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false }
});

// A virtual field for the id
lockUsersSchema.virtual('id').get(function () {
  return this._id.toString();
});

// Enabling virtual fields in JSON
lockUsersSchema.set('toJSON', {
  virtuals: true,
});

module.exports = mongoose.model('LockUsers', lockUsersSchema);
