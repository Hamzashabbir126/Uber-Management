const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// Fix: Update the import path and model name to match the actual file
const BlacklistToken = require('../models/blacklistToken.model');
const captainModel = require('../models/captain.model');

module.exports.authUser = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            console.log('No auth token provided');
            return res.status(401).json({ message: 'Authentication token not provided' });
        }

        // Check if token is blacklisted
        const isBlacklisted = await BlacklistToken.findOne({ token: token });
        if (isBlacklisted) {
            console.log('Token is blacklisted');
            return res.status(401).json({ message: 'Session expired. Please log in again.' });
        }

        // Get JWT secret with fallback for development
        const jwtSecret = process.env.JWT_SECRET || 'unsafe-jwt-secret-for-development';

        // Verify token
        const decoded = jwt.verify(token, jwtSecret);
        if (!decoded || !decoded._id) {
            console.log('Invalid token payload');
            return res.status(401).json({ message: 'Invalid authentication token' });
        }

        // Find user
        const user = await userModel.findById(decoded._id);
        if (!user) {
            console.log(`User not found with ID: ${decoded._id}`);
            return res.status(401).json({ message: 'User not found' });
        }

        // Set user in request
        req.user = user;
        console.log(`Authenticated user: ${user._id}`);
        return next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid authentication token' });
        }
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Authentication token expired' });
        }
        
        return res.status(500).json({ message: 'Authentication failed', error: err.message });
    }
};

module.exports.authCaptain = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        console.log("Auth captain middleware - token:", token ? token.substring(0, 15) + "..." : "No token");

        if (!token) {
            console.log('No auth token provided for captain');
            return res.status(401).json({ message: 'Authentication token not provided' });
        }

        // Check if token is blacklisted
        const isBlacklisted = await BlacklistToken.findOne({ token: token });
        if (isBlacklisted) {
            console.log('Token is blacklisted');
            return res.status(401).json({ message: 'Session expired. Please log in again.' });
        }

        // Get JWT secret with fallback for development
        const jwtSecret = process.env.JWT_SECRET || 'unsafe-jwt-secret-for-development';

        // Verify token
        const decoded = jwt.verify(token, jwtSecret);
        if (!decoded || !decoded._id) {
            console.log('Invalid token payload for captain');
            return res.status(401).json({ message: 'Invalid authentication token' });
        }

        // Find captain
        const captain = await captainModel.findById(decoded._id);
        if (!captain) {
            console.log(`Captain not found with ID: ${decoded._id}`);
            return res.status(401).json({ message: 'Captain not found' });
        }

        // Set captain in request
        req.captain = captain;
        console.log(`Authenticated captain: ${captain._id}`);
        return next();
    } catch (err) {
        console.error('Captain auth middleware error:', err);
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid authentication token' });
        }
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Authentication token expired' });
        }
        
        return res.status(500).json({ message: 'Authentication failed', error: err.message });
    }
};