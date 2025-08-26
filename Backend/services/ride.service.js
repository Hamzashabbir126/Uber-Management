const rideModel = require('../models/ride.model');
const mapService = require('./maps.service');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function getFare(pickup, destination) {
    if (!pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }

    console.log('Ride Service - Pickup:', pickup);
    console.log('Ride Service - Destination:', destination);

    const pickupLocation = typeof pickup === 'object' ? pickup.title : pickup;
    const destinationLocation = typeof destination === 'object' ? destination.title : destination;

    const distanceTime = await mapService.getDistanceTime(pickupLocation, destinationLocation);
    console.log('Distance/Time Result:', distanceTime);

    const baseFare = {
        bike: 50,
        car: 100,
        premium: 200
    };
    const perKmRate = {
        bike: 20,
        car: 40,
        premium: 70
    };
    const fare = {
        bike: Math.round(baseFare.bike + ((distanceTime.distance.value / 1000) * perKmRate.bike)),
        car: Math.round(baseFare.car + ((distanceTime.distance.value / 1000) * perKmRate.car)),
        premium: Math.round(baseFare.premium + ((distanceTime.distance.value / 1000) * perKmRate.premium))
    };
    
    const result = {
        fare,
        distance: distanceTime.distance,
        duration: distanceTime.duration
    };
    
    console.log('Final Fare Result:', result);
    return result;
}

module.exports.getFare = getFare;

function getOtp(num) {
    function generateOtp(num) {
        const otp = crypto.randomInt(Math.pow(10, num - 1), Math.pow(10, num)).toString();
        return otp;
    }
    return generateOtp(num);
}

module.exports.createRide = async ({
    user, pickup, destination, vehicleType, fare = 0, distance = null, duration = null
}) => {
    if (!user || !pickup || !destination || !vehicleType) {
        throw new Error('All fields are required');
    }

    let fareAmount = fare;
    let distanceData = distance;
    let durationData = duration;

    // Calculate fare if not provided
    if (!fareAmount) {
        const fareResult = await getFare(pickup, destination);
        fareAmount = fareResult.fare[vehicleType];
        distanceData = fareResult.distance;
        durationData = fareResult.duration;
    }

    const rideData = {
        user,
        pickup: {
            title: pickup.title || pickup,
            address: pickup.address || '',
            latitude: pickup.latitude || pickup.lat || 0,
            longitude: pickup.longitude || pickup.lng || 0
        },
        destination: {
            title: destination.title || destination,
            address: destination.address || '',
            latitude: destination.latitude || destination.lat || 0,
            longitude: destination.longitude || destination.lng || 0
        },
        otp: getOtp(6),
        fare: fareAmount,
        distance: distanceData,
        duration: durationData,
        vehicleType
    };

    const ride = await rideModel.create(rideData);
    return ride;
};

module.exports.confirmRide = async ({
    rideId, captain
}) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }
    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'accepted',
        captain: captain._id
    })
    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');
    if (!ride) {
        throw new Error('Ride not found');
    }
    return ride;
}

module.exports.startRide = async ({ rideId, otp, captain }) => {
    if (!rideId || !otp) {
        throw new Error('Ride id and OTP are required');
    }
    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');
    if (!ride) {
        throw new Error('Ride not found');
    }
    if (ride.status !== 'accepted') {
        throw new Error('Ride not accepted');
    }
    if (ride.otp !== otp) {
        throw new Error('Invalid OTP');
    }
    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'ongoing'
    })
    return ride;
}


exports.endRide = async (req, res) => {
  try {
    console.log("End ride request body:", req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { rideId } = req.body;
    
    // Check if captain is authenticated
    if (!req.captain) {
      console.log("Captain not found in request");
      return res.status(401).json({ 
        success: false,
        message: "Authentication failed. Captain not found." 
      });
    }
    
    const captainId = req.captain._id;
    console.log("Captain ID:", captainId);
    
    if (!rideId) {
      return res.status(400).json({ 
        success: false,
        message: "Ride ID is required" 
      });
    }

    // Find the ride
    const ride = await Ride.findById(rideId);
    console.log("Found ride:", ride ? ride._id : "Not found");

    if (!ride) {
      return res.status(404).json({ 
        success: false,
        message: "Ride not found" 
      });
    }

    // Log the ride status and captain
    console.log("Ride status:", ride.status);
    console.log("Ride captain:", ride.captain);
    console.log("Request captain:", captainId);

    // Check if ride is in the correct status (allowing more statuses for flexibility)
    const allowedStatuses = ["started", "in-progress", "confirmed"];
    if (!allowedStatuses.includes(ride.status)) {
      return res.status(400).json({ 
        success: false,
        message: `This ride cannot be ended because it is in ${ride.status} state`
      });
    }

    // Check if this captain is assigned to this ride
    if (!ride.captain) {
      return res.status(400).json({
        success: false,
        message: "This ride has no assigned captain"
      });
    }
    
    // Safe comparison of ObjectIds
    const rideCaptainId = ride.captain.toString();
    const requestCaptainId = captainId.toString();
    
    console.log("Comparing captain IDs:", rideCaptainId, requestCaptainId);
    
    if (rideCaptainId !== requestCaptainId) {
      return res.status(403).json({ 
        success: false,
        message: "You are not authorized to end this ride" 
      });
    }

    // Calculate earnings (simplified example)
    const earnings = {
      amount: ride.fare || 0,
      platform_fee: Math.round((ride.fare || 0) * 0.2), // 20% platform fee
      captain_earning: Math.round((ride.fare || 0) * 0.8) // 80% to captain
    };

    // Update ride status
    ride.status = "completed";
    ride.completedAt = new Date();
    ride.earnings = earnings;
    
    // Save the updated ride
    console.log("Saving ride with updated status:", ride.status);
    await ride.save();
    console.log("Ride saved successfully");

    // Populate the ride with user and captain details
    const populatedRide = await Ride.findById(ride._id)
      .populate("user", "fullname email socketId")
      .populate("captain", "fullname vehicle");

    // Notify the user via socket if possible
    if (populatedRide.user && typeof populatedRide.user === "object" && populatedRide.user.socketId) {
      console.log("Sending socket notification to user:", populatedRide.user.socketId);
      sendMessageToSocketId(populatedRide.user.socketId, {
        event: "ride-completed",
        data: populatedRide
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ride completed successfully",
      data: populatedRide
    });
  } catch (error) {
    console.error("Error ending ride:", error);
    return res.status(500).json({ 
      success: false,
      message: "Failed to end ride",
      error: error.message,
      stack: error.stack // Include stack trace for debugging
    });
  }
};