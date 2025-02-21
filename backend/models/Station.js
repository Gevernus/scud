const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
    nfc: { type: String },
    location: { type: String },
    deviceId: { type: String, required: true, unique: true },
    username: { type: String },
    company: { type: String },
    name: { type: String },
    password: { type: String },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
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

// Виртуальный идентификатор
stationSchema.virtual("id").get(function () {
    return this._id.toString();
});

// Включение виртуальных полей при JSON-конверсии
stationSchema.set("toJSON", {
    virtuals: true,
});

module.exports = mongoose.model('Station', stationSchema);
