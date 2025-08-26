const rideService = require("../services/ride.service");
const { validationResult } = require("express-validator");
const mapService = require("../services/maps.service");
const { sendMessageToSocketId } = require("../socket");
const rideModel = require("../models/ride.model");
const Ride = require("../models/ride.model");
const User = require("../models/user.model");
const mongoose = require("mongoose"); // Add this line to import mongoose

// New method: Get pending rides
exports.getPendingRides = async (req, res) => {
  try {
    const rides = await rideModel
      .find({
        status: "pending",
        captain: null,
      })
      .populate("user", "fullname");

    res.status(200).json({ rides });
  } catch (error) {
    console.error("Error fetching pending rides:", error);
    res.status(500).json({ message: "Failed to fetch pending rides" });
  }
};

// New method: Get captain ride history
exports.getCaptainRideHistory = async (req, res) => {
  try {
    const rides = await rideModel
      .find({
        captain: req.params.captainId,
        status: { $in: ["completed", "cancelled"] },
      })
      .populate("user", "fullname")
      .sort({ createdAt: -1 });

    res.status(200).json({ rides });
  } catch (error) {
    console.error("Error fetching ride history:", error);
    res.status(500).json({ message: "Failed to fetch ride history" });
  }
};

// Existing method: Create ride
// Update the createRide function

exports.createRide = async (req, res) => {
  try {
    // Check if user exists in the request
    if (!req.user) {
      console.error("Error creating ride: req.user is null or undefined");
      return res.status(401).json({
        success: false,
        message: "Authentication failed. Please log in again.",
        error: "User not authenticated",
      });
    }

    const { pickup, destination, vehicleType, fare, distance, duration } =
      req.body;

    // Validate required fields
    if (!pickup || !destination || !vehicleType) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: pickup, destination, and vehicleType are required",
      });
    }

    // Validate location data
    if (
      !pickup.latitude ||
      !pickup.longitude ||
      !destination.latitude ||
      !destination.longitude
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid location data: latitude and longitude are required for both pickup and destination",
      });
    }

    // Log the user ID to help diagnose issues
    console.log("Creating ride for user:", req.user._id);

    const rideData = {
      pickup: {
        title: pickup.title || "",
        address: pickup.address || "",
        latitude: Number(pickup.latitude),
        longitude: Number(pickup.longitude),
      },
      destination: {
        title: destination.title || "",
        address: destination.address || "",
        latitude: Number(destination.latitude),
        longitude: Number(destination.longitude),
      },
      vehicleType,
      fare: Number(fare) || 0,
      distance: distance || { text: "Unknown", value: 0 },
      duration: duration || { text: "Unknown", value: 0 },
      user: req.user._id,
      otp: Math.floor(100000 + Math.random() * 900000)
        .toString()
        .slice(0, 6), // 6-digit OTP
    };

    const ride = await Ride.create(rideData);
    const populatedRide = await Ride.findById(ride._id)
      .populate("user", "fullname email")
      .populate("captain", "fullname vehicle");

    // Log successful ride creation
    console.log("Ride created successfully:", ride._id);

    return res.status(201).json({
      success: true,
      message: "Ride created successfully",
      data: populatedRide,
    });
  } catch (error) {
    console.error("Error creating ride:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create ride",
      error: error.message,
    });
  }
};

// Existing method: Get fare estimate
exports.getFare = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let { pickup, destination } = req.query;
  try {
    // Parse as JSON if possible
    if (typeof pickup === "string") {
      try {
        pickup = JSON.parse(pickup);
      } catch (e) {
        /* leave as string */
      }
    }
    if (typeof destination === "string") {
      try {
        destination = JSON.parse(destination);
      } catch (e) {
        /* leave as string */
      }
    }

    const fareResult = await rideService.getFare(pickup, destination);
    return res.status(200).json(fareResult);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Existing method: Confirm ride
// d:\uber-video\Backend\controllers\ride.controller.js
exports.confirmRide = async (req, res) => {
  try {
    console.log("Confirm ride request:", req.body);
    console.log("Captain ID from auth:", req.captain?._id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { rideId } = req.body;
    
    if (!rideId) {
      return res.status(400).json({ message: "Ride ID is required" });
    }

    // Check if the ride exists
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      console.log(`Ride not found: ${rideId}`);
      return res.status(404).json({ message: "Ride not found" });
    }
    
    console.log(`Found ride: ${ride._id}, status: ${ride.status}`);

    // Check ride status
    if (ride.status !== "pending") {
      return res.status(400).json({ 
        message: `Ride is no longer available. Current status: ${ride.status}` 
      });
    }

    // Update the ride with captain ID and change status
    ride.captain = req.captain._id;
    ride.status = "confirmed";
    
    console.log(`Setting captain ${req.captain._id} for ride ${ride._id}`);
    
    // Save the ride
    await ride.save();
    console.log(`Ride saved successfully with status: ${ride.status}`);

    // Populate the ride with user and captain details
    const populatedRide = await Ride.findById(ride._id)
      .populate("user", "fullname email socketId")
      .populate("captain", "fullname vehicle");
    
    console.log(`Populated ride with user: ${populatedRide.user?._id} and captain: ${populatedRide.captain?._id}`);

    // Use the sendMessageToSocketId function from socket.js
    const { sendMessageToSocketId } = require('../socket');
    
    // Notify the user if they have a socketId
    if (populatedRide.user && populatedRide.user.socketId) {
      console.log(`Sending notification to user socket: ${populatedRide.user.socketId}`);
      sendMessageToSocketId(populatedRide.user.socketId, {
        event: "ride-confirmed",
        data: { ride: populatedRide }
      });
    } else {
      console.log("User has no socketId, cannot send notification");
    }

    return res.status(200).json(populatedRide);
  } catch (err) {
    console.error("Confirm ride error:", err);
    return res.status(500).json({ message: err.message || "An error occurred while confirming the ride" });
  }
};
exports.updateArrivalTime = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { rideId, arrivalTime } = req.body;

    // Input validation without using mongoose.Types.ObjectId
    if (!rideId) {
      return res.status(400).json({ message: "Invalid ride ID" });
    }

    if (!arrivalTime || arrivalTime < 1 || arrivalTime > 60) {
      return res
        .status(400)
        .json({ message: "Arrival time must be between 1 and 60 minutes" });
    }

    // Find the ride
    const ride = await Ride.findById(rideId).populate("user");

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Check ride status
    if (ride.status !== "confirmed" && ride.status !== "pending") {
      return res.status(400).json({
        message:
          "Ride must be in pending or confirmed state to update arrival time",
      });
    }

    // Check captain authorization
    if (
      ride.captain &&
      ride.captain.toString() !== req.captain._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this ride" });
    }

    // Update ride with arrival time as an object
    ride.arrivalTime = {
      minutes: parseInt(arrivalTime),
      updatedAt: new Date(),
    };

    await ride.save();

    // Notify user via socket if possible
    if (ride.user && typeof ride.user === "object" && ride.user.socketId) {
      sendMessageToSocketId(ride.user.socketId, {
        event: "captain-arrival-update",
        data: {
          rideId: ride._id,
          arrivalTime: ride.arrivalTime,
        },
      });
    }

    return res.status(200).json(ride);
  } catch (error) {
    console.error("Error updating arrival time:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// d:\uber-video\Backend\controllers\ride.controller.js - Add this function
exports.cancelRide = async (req, res) => {
    try {
        console.log("Cancel ride request:", req.body);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const { rideId } = req.body;
        
        if (!rideId) {
            return res.status(400).json({ message: "Ride ID is required" });
        }

        // Find the ride
        const ride = await Ride.findById(rideId);
        
        if (!ride) {
            return res.status(404).json({ message: "Ride not found" });
        }
        
        // Check if the ride can be cancelled (only pending, confirmed, or started rides can be cancelled)
        const allowedStatuses = ["pending", "confirmed", "started"];
        if (!allowedStatuses.includes(ride.status)) {
            return res.status(400).json({ 
                message: `This ride cannot be cancelled because it is in ${ride.status} state` 
            });
        }
        
        // Verify that the user or captain is associated with this ride
        let isUser = false;
        let isCaptain = false;
        
        // Check if req.user exists (user authentication)
        if (req.user) {
            isUser = ride.user.toString() === req.user._id.toString();
        }
        
        // Check if req.captain exists (captain authentication)
        if (req.captain) {
            isCaptain = ride.captain && ride.captain.toString() === req.captain._id.toString();
        }
        
        if (!isUser && !isCaptain) {
            return res.status(403).json({ 
                message: "You are not authorized to cancel this ride" 
            });
        }
        
        // Update the ride status
        ride.status = "cancelled";
        ride.cancelledAt = new Date();
        
        // Set cancellation reason based on who cancelled
        if (req.user) {
            ride.cancellationReason = "Cancelled by user";
        } else if (req.captain) {
            ride.cancellationReason = "Cancelled by captain";
        }
        
        await ride.save();
        
        // Notify the captain if assigned
        if (ride.captain) {
            const Captain = require('../models/captain.model');
            const captain = await Captain.findById(ride.captain);
            
            if (captain && captain.socketId) {
                const { sendMessageToSocketId } = require('../socket');
                sendMessageToSocketId(captain.socketId, {
                    event: "ride-cancelled",
                    data: { 
                        rideId: ride._id,
                        message: "Ride was cancelled by the user"
                    }
                });
            }
        }
        
        return res.status(200).json({ 
            success: true,
            message: "Ride cancelled successfully" 
        });
    } catch (error) {
        console.error("Error cancelling ride:", error);
        return res.status(500).json({ 
            success: false,
            message: "Failed to cancel ride",
            error: error.message
        });
    }
};

// Add the rate ride function

exports.rateRide = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { rideId, rating, comment } = req.body;
    const userId = req.user._id; // User ID from auth middleware

    // Find the ride
    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.status !== "waiting_for_rating") {
      return res
        .status(400)
        .json({ message: "Cannot rate a ride that is not waiting for rating" });
    }

    // Verify that the user was a participant in this ride
    if (!ride.user.equals(userId)) {
      return res.status(403).json({
        message: "You are not authorized to rate this ride",
      });
    }

    // Update the rating
    ride.rating = {
      ...ride.rating || {},
      captain: {
        rating,
        comment: comment || "",
        ratedAt: new Date()
      },
    };

    // Update captain's overall rating if there is a captain
    if (ride.captain) {
      const Captain = require('../models/captain.model');
      const captain = await Captain.findById(ride.captain);
      
      if (captain) {
        const rides = await Ride.find({
          captain: ride.captain,
          status: "completed",
          "rating.captain.rating": { $exists: true },
        });

        const totalRating = rides.reduce(
          (sum, r) => sum + (r.rating?.captain?.rating || 0),
          0
        );
        const averageRating = rides.length > 0 ? totalRating / rides.length : 5;

        captain.rating = Math.round(averageRating * 10) / 10; // Round to 1 decimal place
        await captain.save();
      }
    }

    // Change status to completed after rating
    ride.status = "completed";
    await ride.save();

    return res.status(200).json({
      success: true,
      message: "Rating submitted successfully" 
    });
  } catch (error) {
    console.error("Error rating ride:", error);
    return res.status(500).json({ 
      success: false,
      message: "Failed to submit rating",
      error: error.message
    });
  }
};

// Start a ride (without OTP)
exports.startRide = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { rideId } = req.body;

    // Input validation
    if (!rideId) {
      return res.status(400).json({ message: "Ride ID is required" });
    }

    // Find the ride
    const ride = await Ride.findById(rideId).populate("user");

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Check ride status
    if (ride.status !== "confirmed") {
      return res.status(400).json({
        message: `Ride must be confirmed to start. Current status: ${ride.status}`,
      });
    }

    // Check captain authorization
    if (
      ride.captain &&
      ride.captain.toString() !== req.captain._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to start this ride" });
    }

    // Update ride status to 'started' instead of 'in-progress'
    ride.status = "started";
    ride.startTime = new Date();
    await ride.save();

    // Notify the user via socket if possible
    if (ride.user && typeof ride.user === "object" && ride.user.socketId) {
      sendMessageToSocketId(ride.user.socketId, {
        event: "ride-started",
        data: ride,
      });
    }

    return res.status(200).json(ride);
  } catch (error) {
    console.error("Error starting ride:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// Renamed from endRide to completeRide
// Complete implementation of completeRide function
exports.completeRide = async (req, res) => {
  try {
    console.log("Complete ride request body:", req.body);
    console.log("Complete ride request headers:", req.headers);
    
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
        message: `This ride cannot be completed because it is in ${ride.status} state`
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
        message: "You are not authorized to complete this ride" 
      });
    }

    // Calculate earnings (simplified example)
    const earnings = {
      amount: ride.fare || 0,
      platform_fee: Math.round((ride.fare || 0) * 0.2), // 20% platform fee
      captain_earning: Math.round((ride.fare || 0) * 0.8) // 80% to captain
    };

    // Update ride status to waiting for rating (not fully completed yet)
    ride.status = "waiting_for_rating";
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
      const { sendMessageToSocketId } = require('../socket');
      
      // Send a properly formatted event with the ride data
      sendMessageToSocketId(populatedRide.user.socketId, {
        event: "ride-completed",
        data: {
          ride: populatedRide  // Send the whole ride object
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ride completed successfully",
      data: populatedRide
    });
  } catch (error) {
    console.error("Error completing ride:", error);
    return res.status(500).json({ 
      success: false,
      message: "Failed to complete ride",
      error: error.message,
      stack: error.stack // Include stack trace for debugging
    });
  }
};