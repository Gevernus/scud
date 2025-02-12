const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    nfc: { type: String },
    location: { type: String },
    deviceId: { type: String },
    user: { type: String },
    password: { type: String },
    createdAt: { type: Date, default: Date.now },
    deleted: { type: Boolean, default: false }  // Флаг мягкого удаления
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
