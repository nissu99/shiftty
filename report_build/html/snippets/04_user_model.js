// models/User.js — Mongoose schema for the User collection
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AddressSchema = new mongoose.Schema({
    label: { type: String, required: true },        // "Home", "Office"
    line1: { type: String, required: true },
    city:  { type: String, required: true },
    pincode: { type: String, match: /^\d{6}$/ },
    lat: Number,
    lng: Number
}, { _id: false });

const UserSchema = new mongoose.Schema({
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    phone:    { type: String, required: true, match: /^\d{10}$/ },
    password_hash: { type: String, required: true },
    saved_addresses: [AddressSchema],
    role:     { type: String, enum: ['customer', 'mover', 'admin'], default: 'customer' },
    created_at: { type: Date, default: Date.now }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password_hash')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
});

// Helper to verify password on login
UserSchema.methods.comparePassword = async function (plain) {
    return bcrypt.compare(plain, this.password_hash);
};

module.exports = mongoose.model('User', UserSchema);
