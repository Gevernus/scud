const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  status: { type: Boolean, default: false },
  pass: { type: String, default: '5678', required: true },
    
});

// A virtual field for the id
registrationSchema.virtual("id").get(function () {
    return this._id.toString();
});

// Enabling virtual fields in JSON
registrationSchema.set("toJSON", {
    virtuals: true,
});

module.exports = mongoose.model('Registration', registrationSchema);