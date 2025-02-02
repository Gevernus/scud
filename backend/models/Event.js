const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventType: { type: String, enum: ['registration', 'login_attempt', 'authorization', 'incident', 'soft_delete', 'full_delete'], required: true },
    description: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    deleted: { type: Boolean, default: false }  // Deletion flag
});

// Creating an index for user communication
eventSchema.index({ userId: 1 });

// A virtual field for the id
eventSchema.virtual("id").get(function () {
    return this._id.toString();
});

// Enabling virtual fields in JSON
eventSchema.set("toJSON", {
    virtuals: true,
});

module.exports = mongoose.model('Event', eventSchema);

