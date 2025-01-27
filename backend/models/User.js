const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    telegramId: { type: Number, unique: true },
    // ... other fields from previous schema
});

module.exports = mongoose.model('User', userSchema);