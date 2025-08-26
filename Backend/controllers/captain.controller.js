const captainModel = require('../models/captain.model');
const rideModel = require('../models/ride.model');
const { validationResult } = require('express-validator');
const captainService = require('../services/captain.service');
const BlacklistToken = require('../models/blacklistToken.model');
const Ride = require('../models/ride.model');

// Get captain statistics
exports.getCaptainStats = async (req, res) => {
    try {
        const captain = req.captain;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get completed rides
        const completedRides = await rideModel.find({
            captain: captain._id,
            status: 'completed'
        });

        // Get today's rides
        const todayRides = completedRides.filter(ride => 
            new Date(ride.createdAt) >= today
        );

        // Calculate stats
        const stats = {
            totalRides: completedRides.length,
            totalEarnings: completedRides.reduce((sum, ride) => sum + ride.fare, 0),
            rating: captain.rating || 0,
            todayRides: todayRides.length,
            todayEarnings: todayRides.reduce((sum, ride) => sum + ride.fare, 0)
        };

        res.status(200).json({ stats });
    } catch (error) {
        console.error('Error fetching captain stats:', error);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};

// Register new captain
exports.registerCaptain = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg).join(', ');
            return res.status(400).json({ message: errorMessages });
        }

        const { fullname, email, password, vehicle } = req.body;

        const isCaptainAlreadyExist = await captainModel.findOne({ email });

        if (isCaptainAlreadyExist) {
            return res.status(400).json({ message: 'Captain already exists' });
        }

        const hashedPassword = await captainModel.hashPassword(password);

        const captain = await captainService.createCaptain({
            firstname: fullname.firstname,
            lastname: fullname.lastname,
            email,
            password: hashedPassword,
            color: vehicle.color,
            plate: vehicle.plate,
            capacity: vehicle.capacity,
            vehicleType: vehicle.vehicleType
        });

        const token = captain.generateAuthToken();

        res.status(201).json({ token, captain });
    } catch (error) {
        console.error('Captain registration error:', error);
        res.status(500).json({ message: 'Registration failed. Please try again.' });
    }
};

// Captain login
exports.loginCaptain = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const captain = await captainModel.findOne({ email }).select('+password');

    if (!captain) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await captain.comparePassword(password);

    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = captain.generateAuthToken();

    res.cookie('token', token);

    res.status(200).json({ token, captain });
};

// Get captain profile
exports.getCaptainProfile = async (req, res, next) => {
    res.status(200).json({ captain: req.captain });
};

// Toggle online status
exports.toggleStatus = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const captain = req.captain;
        const { status } = req.body;

        // Update captain status
        captain.status = status;
        await captain.save();

        return res.status(200).json({
            message: 'Status updated successfully',
            status: captain.status
        });
    } catch (error) {
        console.error('Toggle status error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Captain logout
exports.logoutCaptain = async (req, res) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Create blacklist token entry
        await BlacklistToken.create({
            token,
            userId: req.captain._id,
            userModel: 'Captain'
        });

        // Clear cookie if it exists
        res.clearCookie('token');

        // Update captain's socket ID to null if it exists
        if (req.captain.socketId) {
            req.captain.socketId = null;
            await req.captain.save();
        }

        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};