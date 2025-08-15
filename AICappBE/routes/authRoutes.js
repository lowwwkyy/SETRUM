const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- Standard Email & Password Routes ---

// POST /auth/signup
router.post('/signup', async (req, res) => {
    // ... (paste the signup logic from the previous response here)
    const { email, password, displayName } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists." });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ email, password: hashedPassword, displayName });
        await newUser.save();
        res.status(201).json({ message: "User created successfully." });
    } catch (error) {
        res.status(500).json({ message: "Server error." });
    }
});

// POST /auth/login
router.post('/login', async (req, res) => {
    // ... (paste the login logic from the previous response here)
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !user.password) {
            return res.status(400).json({ message: "Invalid credentials." });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials." });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, userId: user._id, displayName: user.displayName });
    } catch (error) {
        res.status(500).json({ message: "Server error." });
    }
});

// --- Google Sign-In for Mobile ---


// POST /auth/google/signin
router.post('/google/signin', async (req, res) => {
    // ... (paste the google signin logic from the previous response here)
    const { idToken } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { name, email, sub: googleId } = ticket.getPayload();

        let user = await User.findOne({ googleId });
        if (!user) {
            const existingEmailUser = await User.findOne({ email });
            if (existingEmailUser) {
                 return res.status(400).json({ message: 'Email already in use with a password account.' });
            }
            user = new User({ googleId, email, displayName: name });
            await user.save();
        }

        const appToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({
            message: "Authentication successful",
            token: appToken,
            user: { id: user._id, displayName: user.displayName, email: user.email },
        });
    } catch (error) {
        res.status(401).json({ message: "Invalid Google token." });
    }
});

module.exports = router;