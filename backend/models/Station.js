const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
    nfc: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Nfc' }],
    nfcMode: { type: String, enum: ["always", "geoMismatch", "never", "ignore"], default: "geoMismatch"},
    location: { type: String },
    deviceId: { type: String, required: true, unique: true },
    company: { type: String },
    description: { type: String },
    name: { type: String },
    description: { type: String },
    loginMode: { type: String, enum: ["QR", "PASSWORD"], default: "QR" },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attemptedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    deleted: { type: Boolean, default: false }  // Флаг мягкого удаления
});

// Update `updatedAt' only if something has changed
stationSchema.pre("save", function (next) {
    if (this.isModified()) {
        this.updatedAt = Date.now();
    }
    next();
});

// Auto-updating of `updatedAt` at `findOneAndUpdate`
stationSchema.pre("findOneAndUpdate", function (next) {
    this.set({ updatedAt: Date.now() });
    next();
});

// Virtual `id` field for convenience in React-Admin
stationSchema.virtual("id").get(function () {
    return this._id.toString();
});

// Enabling virtual fields in JSON
stationSchema.set("toJSON", {
    virtuals: true,
});

module.exports = mongoose.model('Station', stationSchema);
