import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { SocketContext } from "../context/SocketContext";
import { api } from "../utils/authHeader";
import rideManager from "../utils/rideManager";

const WaitingForDriver = ({ ride }) => {
  const [arrivalTime, setArrivalTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);

  // Important: Keep all hooks outside of conditional statements
  useEffect(() => {
    if (!socket) return;

    const handleArrivalUpdate = (data) => {
      console.log("Arrival update received:", data);

             try {
         // Handle different possible arrival time formats
         if (typeof data.arrivalTime === "object" && data.arrivalTime !== null) {
           if (data.arrivalTime.minutes !== undefined) {
             setArrivalTime(data.arrivalTime.minutes);
           } else if (data.arrivalTime.value !== undefined) {
             // Some APIs return a value property in seconds, convert to minutes
             setArrivalTime(Math.ceil(data.arrivalTime.value / 60));
           } else if (data.arrivalTime.text !== undefined) {
             // Try to extract numeric value from text like "5 mins"
             const match = data.arrivalTime.text.match(/(\d+)/);
             setArrivalTime(match ? parseInt(match[1]) : 5); // Default to 5 minutes if extraction fails
                       } else if (Object.keys(data.arrivalTime).length === 0) {
              // Empty object case - this might be a valid case, don't warn
              console.log("Empty arrivalTime object received, using default");
              setArrivalTime(5);
            } else {
              console.log("Unexpected arrivalTime object format:", data.arrivalTime);
              // Default to a reasonable value instead of null
              setArrivalTime(5);
            }
         } else if (typeof data.arrivalTime === "number") {
           setArrivalTime(data.arrivalTime);
         } else if (typeof data.arrivalTime === "string") {
           // Try to parse string to number
           const parsed = parseInt(data.arrivalTime);
           if (!isNaN(parsed)) {
             setArrivalTime(parsed);
           } else {
             console.warn("Cannot parse arrivalTime string:", data.arrivalTime);
             setArrivalTime(5); // Default to 5 minutes
           }
         } else {
           console.warn("Unexpected arrivalTime format:", data.arrivalTime);
           setArrivalTime(5); // Default to 5 minutes
         }
       } catch (error) {
         console.error("Error processing arrival time:", error);
         setArrivalTime(5); // Default to 5 minutes on error
       }
    };

    const handleRideStarted = (rideData) => {
      console.log("Ride started event received:", rideData);
      
      // Extract the actual ride data from the socket event
      let actualRideData = rideData;
      if (rideData && rideData.data && rideData.data.ride) {
        actualRideData = rideData.data.ride;
      } else if (rideData && rideData.ride) {
        actualRideData = rideData.ride;
      }
      
      // Update ride status and store in localStorage
      const updatedRideData = { ...actualRideData, status: 'started' };
      rideManager.setActiveRide(updatedRideData);
      // Navigate to ride in progress with the updated ride data
      navigate("/ride-in-progress", { state: { ride: updatedRideData } });
    };

    const handleRideCancelled = (data) => {
      console.log("Ride cancelled event received:", data);
      // Clear ride from localStorage
      rideManager.clearRide();
      // Navigate back to home
      navigate("/home");
    };

    socket.on("captain-arrival-update", handleArrivalUpdate);
    socket.on("ride-started", handleRideStarted);
    socket.on("ride-cancelled", handleRideCancelled);

    return () => {
      socket.off("captain-arrival-update", handleArrivalUpdate);
      socket.off("ride-started", handleRideStarted);
      socket.off("ride-cancelled", handleRideCancelled);
    };
  }, [socket, navigate]);

const handleCancelRide = async () => {
    try {
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        console.log("Full ride object:", ride);
        console.log("Ride ID:", ride?._id);
        console.log("Ride type:", typeof ride);
        
        if (!ride || !ride._id) {
            console.error("Ride object:", ride);
            setError("Cannot cancel: Ride ID is not available");
            setLoading(false);
            return;
        }
        
        console.log("Cancelling ride:", ride._id);
        
        const response = await axios.post(
            `${import.meta.env.VITE_BASE_URL || 'http://localhost:3000'}/rides/cancel`,
            { rideId: ride._id },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            }
        );
        
        console.log("Cancel ride response:", response.data);
        
        if (response.data.success) {
            setSuccess("Ride cancelled successfully");
            
            if (socket) {
                socket.emit('ride-cancelled', { 
                    rideId: ride._id,
                    userId: typeof ride.user === 'object' ? ride.user._id : ride.user,
                    captainId: typeof ride.captain === 'object' ? ride.captain._id : ride.captain
                });
            }
            
            // Clear the ride from localStorage
            rideManager.clearRide();
            setTimeout(() => {
                navigate('/home');
            }, 1500);
        }
    } catch (error) {
        console.error('Error canceling ride:', error);
        
        if (error.response?.status === 404) {
            setError("The cancel ride service is temporarily unavailable. Please contact support.");
        } else if (error.response?.status === 401) {
            setError("Authentication failed. Please log in again.");
            setTimeout(() => {
                localStorage.removeItem('token');
                navigate('/');
            }, 2000);
        } else {
            setError(
                error.response?.data?.message ||
                "Failed to cancel ride. Please try again."
            );
        }
    } finally {
        setLoading(false);
    }
};

  // Loading state
  if (!ride) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-t-black rounded-full mx-auto mb-2"></div>
        <p>Loading ride details...</p>
      </div>
    );
  }

  // Safely extract captain info
  const captainName = ride.captain?.fullname?.firstname || "Your driver";
  const vehicleType = ride.captain?.vehicle?.vehicleType || "";
  const plateNumber = ride.captain?.vehicle?.plate || "";
  const vehicleColor = ride.captain?.vehicle?.color || "";

  // Safely extract locations
  const pickupAddress =
    typeof ride.pickup === "object"
      ? ride.pickup.address
      : ride.pickup || "Pickup location";
  const destinationAddress =
    typeof ride.destination === "object"
      ? ride.destination.address
      : ride.destination || "Destination";

  // Safely extract arrival time (could be a number or an object)
  const arrivalTimeDisplay =
    typeof ride.arrivalTime === "object"
      ? ride.arrivalTime?.minutes || "Unknown"
      : typeof ride.arrivalTime === "number"
      ? ride.arrivalTime
      : "Unknown";

  return (
    <div className="fixed inset-0 bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold mb-2">
            {arrivalTime ? "Driver on the way!" : "Waiting for driver..."}
          </h2>
          {arrivalTime !== null && (
            <p className="text-gray-600">
              Arriving in approximately {arrivalTime} minutes
            </p>
          )}
        </div>

        {/* Driver Details (if available) */}
        {ride.captain && (
          <div className="border-t border-b py-4 my-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <i className="ri-user-3-line text-2xl"></i>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{captainName}</h3>
                <p className="text-gray-600">
                  {vehicleType} • {plateNumber}
                </p>
                <p className="text-gray-600">{vehicleColor}</p>
              </div>
            </div>
          </div>
        )}

        {/* Ride Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <i className="ri-map-pin-line text-green-500"></i>
            <div>
              <p className="text-sm text-gray-500">Pickup</p>
              <p className="font-medium">{pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <i className="ri-flag-line text-red-500"></i>
            <div>
              <p className="text-sm text-gray-500">Destination</p>
              <p className="font-medium">{destinationAddress}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center">
            <i className="ri-error-warning-line mr-2 text-lg"></i>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center">
            <i className="ri-checkbox-circle-line mr-2 text-lg"></i>
            {success}
          </div>
        )}

        {/* Cancel Button */}
        <button
          onClick={handleCancelRide}
          disabled={loading}
          className={`w-full py-3 rounded-lg font-semibold ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'text-red-600 border border-red-600 hover:bg-red-50'
          }`}
        >
          {loading ? 'Cancelling...' : 'Cancel Ride'}
        </button>
      </div>
    </div>
  );
};

export default WaitingForDriver;
