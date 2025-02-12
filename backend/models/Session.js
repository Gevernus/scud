const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true },
    location: { type: String },
    deviceId: { type: String },
    userId: { type: String },
    createdAt: { type: Date, default: Date.now },
});

// Виртуальный идентификатор
sessionSchema.virtual("id").get(function () {
    return this._id.toString();
});

// Включение виртуальных полей при JSON-конверсии
sessionSchema.set("toJSON", {
    virtuals: true,
});

module.exports = mongoose.model('Session', sessionSchema);
