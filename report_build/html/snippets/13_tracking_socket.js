// realtime/trackingSocket.js — Socket.io handler for live mover -> customer GPS relay
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');

function attachTrackingSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: { origin: '*' },
        path: '/realtime'
    });

    // JWT handshake — reject unauthenticated sockets
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('UNAUTHORISED'));
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = { id: payload.sub, role: payload.role };
            return next();
        } catch { return next(new Error('BAD_TOKEN')); }
    });

    io.on('connection', (socket) => {
        console.log(`[socket] ${socket.user.role}:${socket.user.id} connected`);

        // Customer subscribes to a booking's live feed
        socket.on('track:subscribe', async ({ bookingId }) => {
            const booking = await Booking.findById(bookingId).lean();
            if (!booking) return socket.emit('track:error', 'Booking not found');
            if (String(booking.user) !== socket.user.id)
                return socket.emit('track:error', 'Forbidden');
            socket.join(`booking:${bookingId}`);
            socket.emit('track:subscribed', { bookingId });
        });

        // Mover publishes a GPS ping every 5 seconds
        socket.on('track:ping', async ({ bookingId, lat, lng, speed_kmh }) => {
            if (socket.user.role !== 'mover') return;
            const booking = await Booking.findById(bookingId).lean();
            if (!booking || String(booking.mover) !== socket.user.id) return;

            io.to(`booking:${bookingId}`).emit('track:location', {
                bookingId,
                lat, lng, speed_kmh,
                ts: Date.now()
            });
        });

        // Mover updates status e.g. PICKUP_DONE -> IN_TRANSIT -> DELIVERED
        socket.on('track:status', async ({ bookingId, status }) => {
            if (socket.user.role !== 'mover') return;
            await Booking.updateOne({ _id: bookingId, mover: socket.user.id }, { status });
            io.to(`booking:${bookingId}`).emit('track:status', { bookingId, status });
        });

        socket.on('disconnect', () => {
            console.log(`[socket] ${socket.user.role}:${socket.user.id} disconnected`);
        });
    });

    return io;
}

module.exports = attachTrackingSocket;
