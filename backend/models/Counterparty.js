const mongoose = require('mongoose');

const counterpartySchema = new mongoose.Schema({
    fullName: { type: String, required: true }, 
    shortName: { type: String }, 
    inn: { type: String, required: true }, 
    phone: { type: String }, 
    email: { type: String }, 
    description: { type: String }, 
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }, // Date and time of creation
    updatedAt: { type: Date, default: Date.now }, // Date and time of the change
    deleted: { type: Boolean, default: false }  // Deletion flag
}); 


// Update `updatedAt' only if something has changed
counterpartySchema.pre("save", function (next) {
    if (this.isModified()) {
        this.updatedAt = Date.now();
    }
    next();
});

// Auto-updating of `updatedAt` at `findOneAndUpdate`
counterpartySchema.pre("findOneAndUpdate", function (next) {
    this.set({ updatedAt: Date.now() });
    next();
});


// Virtual `id` field for convenience in React-Admin
counterpartySchema.virtual("id").get(function () {
    return this._id.toString();
});

// Enabling virtual fields in JSON
counterpartySchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Counterparty", counterpartySchema);
