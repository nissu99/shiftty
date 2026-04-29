// controllers/authController.js — Sign-up and login endpoints
const User = require('../models/User');
const jwt  = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL  = '7d';

function signToken(user) {
    return jwt.sign(
        { sub: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: TOKEN_TTL }
    );
}

// POST /api/auth/signup
exports.signup = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!email || !password || password.length < 8) {
            return res.status(400).json({ message: 'Weak or missing credentials' });
        }
        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ message: 'Email already registered' });

        const user = await User.create({
            name, email, phone,
            password_hash: password         // Hashed in Schema pre-save hook
        });

        return res.status(201).json({
            token: signToken(user),
            user:  { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

// POST /api/auth/login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    return res.status(200).json({
        token: signToken(user),
        user:  { id: user._id, name: user.name, email: user.email, role: user.role }
    });
};
