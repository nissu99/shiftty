// models/Booking.js — Stores bookings with nested inventory list
const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema({
    item_name:  { type: String, required: true },   // e.g. "King Bed", "Refrigerator"
    quantity:   { type: Number, required: true, min: 1 },
    is_fragile: { type: Boolean, default: false },
    category:   { type: String, enum: ['furniture', 'electronics', 'boxes', 'other'] }
}, { _id: false });

const BookingSchema = new mongoose.Schema({
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
    mover:       { type: mongoose.Schema.Types.ObjectId, ref: 'Mover' },
    source_address:      { type: String, required: true },
    destination_address: { type: String, required: true },
    source_lat:  Number,
    source_lng:  Number,
    dest_lat:    Number,
    dest_lng:    Number,
    distance_km: { type: Number, required: true },
    move_date:   { type: Date,   required: true },
    inventory_list: { type: [InventoryItemSchema], validate: v => v.length > 0 },
    selected_package: { type: String, enum: ['Basic', 'Standard', 'Premium'], required: true },
    final_price: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING'
    },
    created_at:  { type: Date, default: Date.now }
});

BookingSchema.index({ user: 1, created_at: -1 });
BookingSchema.index({ mover: 1, status: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
