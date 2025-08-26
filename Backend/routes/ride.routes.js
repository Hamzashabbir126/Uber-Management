const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const rideController = require('../controllers/ride.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Create a new ride
router.post('/create',
    authMiddleware.authUser,
    [
        body('pickup').notEmpty().withMessage('Pickup location is required'),
        body('destination').notEmpty().withMessage('Destination is required'),
        body('vehicleType').isIn(['auto', 'car', 'moto']).withMessage('Invalid vehicle type')
    ],
    rideController.createRide
);

// Get fare estimate
router.get('/get-fare',
    authMiddleware.authUser,
    query('pickup').isString().withMessage('Pickup must be a string'),
    query('destination').isString().withMessage('Destination must be a string'),
    rideController.getFare
);

// Confirm a ride
router.post('/confirm',
    authMiddleware.authCaptain,
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    rideController.confirmRide
);

// Start a ride - Updated to POST without OTP
router.post('/start-ride',
    authMiddleware.authCaptain,
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    rideController.startRide
);

router.post('/complete-ride',
    authMiddleware.authCaptain,
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    rideController.completeRide
);

// Get pending rides
router.get('/pending',
    authMiddleware.authCaptain,
    rideController.getPendingRides
);

// Get ride history for captain
router.get('/history/:captainId',
    authMiddleware.authCaptain,
    rideController.getCaptainRideHistory
);

// Update arrival time
router.post('/update-arrival',
    authMiddleware.authCaptain,
    [
        body('rideId').isMongoId().withMessage('Invalid ride ID'),
        body('arrivalTime').isInt({ min: 1, max: 60 }).withMessage('Arrival time must be between 1 and 60 minutes')
    ],
    rideController.updateArrivalTime
);

// Rate a ride
router.post('/rate',
    authMiddleware.authUser,
    [
        body('rideId').isMongoId().withMessage('Invalid ride ID'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
    ],
    rideController.rateRide
);
// Allow users to cancel rides
router.post('/cancel',
    authMiddleware.authUser,
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    rideController.cancelRide
);

// Allow captains to cancel rides
router.post('/captain/cancel',
    authMiddleware.authCaptain,
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    rideController.cancelRide
);

module.exports = router;