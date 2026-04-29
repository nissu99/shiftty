// controllers/paymentController.js — Razorpay order creation + signature verification
const crypto   = require('crypto');
const Razorpay = require('razorpay');
const Booking  = require('../models/Booking');
const Payment  = require('../models/Payment');

const rzp = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// POST /api/payments/create-order
exports.createOrder = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (String(booking.user) !== req.auth.userId)
            return res.status(403).json({ message: 'Forbidden' });

        const order = await rzp.orders.create({
            amount:   Math.round(booking.final_price * 100),   // paise
            currency: 'INR',
            receipt:  `shifty_${booking._id}`,
            notes:    { bookingId: String(booking._id) }
        });

        await Payment.create({
            booking:   booking._id,
            user:      booking.user,
            order_id:  order.id,
            amount:    booking.final_price,
            status:    'CREATED'
        });

        return res.json({
            orderId:    order.id,
            amount:     order.amount,
            currency:   order.currency,
            key:        process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error('createOrder', err);
        return res.status(500).json({ message: 'Payment initiation failed' });
    }
};

// POST /api/payments/verify
exports.verifyPayment = async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        bookingId
    } = req.body;

    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (expected !== razorpay_signature) {
        await Payment.updateOne({ order_id: razorpay_order_id }, { status: 'FAILED' });
        return res.status(400).json({ message: 'Signature mismatch' });
    }

    await Payment.updateOne(
        { order_id: razorpay_order_id },
        { status: 'PAID', payment_id: razorpay_payment_id, paid_at: new Date() }
    );
    await Booking.updateOne(
        { _id: bookingId, user: req.auth.userId },
        { status: 'CONFIRMED' }
    );

    return res.json({ success: true, message: 'Payment verified' });
};

// Razorpay webhook -> reconcile async events
exports.webhook = async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const expected  = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (expected !== signature) return res.status(400).send('bad signature');

    const event = req.body.event;
    if (event === 'payment.captured') {
        const p = req.body.payload.payment.entity;
        await Payment.updateOne({ order_id: p.order_id },
                                { status: 'PAID', payment_id: p.id });
    }
    return res.json({ received: true });
};
