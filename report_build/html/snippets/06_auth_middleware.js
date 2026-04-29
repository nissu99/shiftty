// middleware/authMiddleware.js — JWT verification for protected routes
const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing bearer token' });
    }
    const token = header.slice('Bearer '.length);
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.auth = { userId: payload.sub, role: payload.role };
        return next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Role-based guard - e.g. router.patch('/mover/status', requireAuth, requireRole('mover'), handler)
module.exports.requireRole = function (role) {
    return (req, res, next) => {
        if (!req.auth || req.auth.role !== role) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        return next();
    };
};
