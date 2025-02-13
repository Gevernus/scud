const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    eventType: { type: String, enum: ['registration', 'login_attempt', 'location_mismatch', 'authorization', 'incident', 'error', 'soft_delete', 'full_delete'], required: true },
    description: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    deleted: { type: Boolean, default: false }  // Deletion flag
});

// A virtual field for the id
eventSchema.virtual("id").get(function () {
    return this._id.toString();
});

// Enabling virtual fields in JSON
eventSchema.set("toJSON", {
    virtuals: true,
});

module.exports = mongoose.model('Event', eventSchema);

