const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true },
    location: { type: String },
    deviceId: { type: String },
    userId: { type: String },
    status: { type: String },
    createdAt: { type: Date, default: Date.now },
});

// Virtual `id` field for convenience in React-Admin
sessionSchema.virtual("id").get(function () {
    return this._id.toString();
});

// Enabling virtual fields in JSON
sessionSchema.set("toJSON", {
    virtuals: true,
});

module.exports = mongoose.model('Session', sessionSchema);
