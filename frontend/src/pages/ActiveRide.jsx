import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { SocketContext } from "../context/SocketContext";
import LiveTracking from "../components/LiveTracking";
import { api } from "../utils/authHeader"; // Add this import

const ActiveRide = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const [ride, setRide] = useState(location.state?.ride);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Add this state
  const [remainingTime, setRemainingTime] = useState(null);
  const [captainLocation, setCaptainLocation] = useState(null);

  // Check if ride data exists, redirect to home if not
  useEffect(() => {
    if (!ride) {
      navigate("/");
    }
  }, [ride, navigate]);

  // Join the ride socket room
  useEffect(() => {
    if (socket && ride) {
      socket.emit("join-ride", { rideId: ride._id });

      // Listen for ride updates
      const handleRideUpdated = (updatedRide) => {
        setRide(updatedRide);
      };

      // Listen for ride completion
      const handleRideCompleted = (data) => {
        console.log("Ride completed event received in ActiveRide:", data);
        
        // Get ride data from different possible structures
        let rideData = ride;
        if (data && data.ride) {
          rideData = data.ride;
        } else if (data && data._id) {
          rideData = data;
        }
        
        // Navigate to the correct route - this should be ride-complete, not ride-completed
        navigate("/ride-complete", { state: { ride: rideData } });
      };

      // Listen for captain location updates
      const handleCaptainLocationUpdate = (data) => {
        setCaptainLocation(data.location);
      };

      socket.on("ride-updated", handleRideUpdated);
      socket.on("ride-completed", handleRideCompleted);
      socket.on("captain-location-changed", handleCaptainLocationUpdate);

      return () => {
        socket.off("ride-updated", handleRideUpdated);
        socket.off("ride-completed", handleRideCompleted);
        socket.off("captain-location-changed", handleCaptainLocationUpdate);
      };
    }
  }, [socket, ride, navigate]);

  // Update remaining time
  useEffect(() => {
    if (ride?.duration?.value) {
      // Initial estimate based on ride duration
      setRemainingTime(Math.ceil(ride.duration.value / 60));

      // Update remaining time every minute
      const intervalId = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            return 0;
          }
          return prev - 1;
        });
      }, 60000);

      return () => clearInterval(intervalId);
    }
  }, [ride]);

  // Cancel the ride
 const handleCancelRide = async () => {
    try {
        setLoading(true);
        setError(null);
        setSuccess(null); // Reset success message
        
        if (!ride?._id) {
            setError("Cannot cancel: Ride ID is not available");
            setLoading(false);
            return;
        }
        
        console.log("Cancelling ride:", ride._id);
        
        const response = await api.post(
            `${import.meta.env.VITE_BASE_URL}/rides/cancel`,
            { rideId: ride._id }
        );
        
        console.log("Cancel ride response:", response.data);
        
        if (response.data.success) {
            // Show success message before navigating
            setSuccess("Ride cancelled successfully");
            
            // Notify the server/socket that the ride was cancelled
            if (socket) {
                socket.emit('ride-cancelled', { 
                    rideId: ride._id,
                    userId: typeof ride.user === 'object' ? ride.user._id : ride.user,
                    captainId: typeof ride.captain === 'object' ? ride.captain._id : ride.captain
                });
            }
            
            setTimeout(() => {
                navigate('/');
            }, 1500);
        }
    } catch (error) {
        console.error('Error canceling ride:', error);
        
        if (error.response?.status === 404) {
            setError(
                "The cancel ride service is temporarily unavailable. The server needs to be restarted to enable this feature. Please contact support."
            );
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
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ride details...</p>
        </div>
      </div>
    );
  }

  // Extract ride data safely
  const captainName = ride.captain?.fullname?.firstname || "Your driver";
  const captainRating = ride.captain?.rating || 5;
  const vehicleType = ride.captain?.vehicle?.vehicleType || "";
  const vehiclePlate = ride.captain?.vehicle?.plate || "";
  const vehicleColor = ride.captain?.vehicle?.color || "";
  const pickupAddress =
    typeof ride.pickup === "object"
      ? ride.pickup.address
      : String(ride.pickup || "Pickup location");
  const destinationAddress =
    typeof ride.destination === "object"
      ? ride.destination.address
      : String(ride.destination || "Destination");
  const fareAmount = ride.fare || 0;

  // Format currency
  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      console.error("Currency formatting error:", error);
      return `Rs ${amount}`;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Map Container */}
      <div className="h-2/3 relative">
        <LiveTracking ride={ride} userType="user" />
      </div>

      {/* Ride Info Panel */}
      <div className="h-1/3 bg-white rounded-t-3xl shadow-lg p-6 overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Active Ride</h2>
          <div className="bg-green-100 px-3 py-1 rounded-full text-green-800 text-sm font-semibold">
            In Progress
          </div>
        </div>

        {/* Estimated arrival */}
        {remainingTime !== null && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <p className="text-blue-800 font-medium">
              Estimated arrival: {remainingTime}{" "}
              {remainingTime === 1 ? "minute" : "minutes"}
            </p>
          </div>
        )}

        {/* Captain info */}
        {ride.captain && (
          <div className="mb-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <i className="ri-user-3-line text-xl"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{captainName}</h3>
                <div className="flex items-center">
                  <i className="ri-star-fill text-yellow-400 text-xs"></i>
                  <span className="text-xs ml-1">
                    {captainRating.toFixed(1)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {vehicleColor} {vehicleType} • {vehiclePlate}
              </p>
            </div>
          </div>
        )}

        {/* Trip details */}
        <div className="space-y-2 border-t border-b py-3 my-3">
          <div className="flex items-center gap-3">
            <i className="ri-map-pin-line text-green-500"></i>
            <div>
              <p className="text-xs text-gray-500">From</p>
              <p className="text-sm">{pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <i className="ri-flag-line text-red-500"></i>
            <div>
              <p className="text-xs text-gray-500">To</p>
              <p className="text-sm">{destinationAddress}</p>
            </div>
          </div>
        </div>

        {/* Fare */}
        <div className="flex justify-between items-center mb-4">
          <span className="font-medium">Fare</span>
          <span className="font-semibold">{formatCurrency(fareAmount)}</span>
        </div>

        {/* Emergency button */}
        <button
          onClick={handleCancelRide}
          disabled={loading}
          className={`w-full py-2 rounded-lg text-white ${
            loading ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
          } transition-colors`}
        >
          {loading ? "Processing..." : "Emergency Cancel"}
        </button>

        {error && (
          <div className="mt-3 p-2 bg-red-100 text-red-800 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-3 p-2 bg-green-100 text-green-800 rounded-lg text-sm">
            {success}
          </div>
        )}
      </div>

    </div>
  );
};

export default ActiveRide;
