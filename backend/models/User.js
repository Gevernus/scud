const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    username: { type: String },
})
userSchema.index({ 'referrals.userId': 1 });

userSchema.virtual("id").get(function () {
    return this._id.toString();
});

// Ensure virtuals are included when converting documents to JSON
userSchema.set("toJSON", {
    virtuals: true,
});

module.exports = mongoose.model('User', userSchema);