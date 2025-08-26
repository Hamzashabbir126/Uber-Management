import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { SocketContext } from "../context/SocketContext";
import LiveTracking from "../components/LiveTracking";
import { api } from "../utils/authHeader";
import rideManager from "../utils/rideManager";

const RideInProgress = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const [ride, setRide] = useState(location.state?.ride);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userType, setUserType] = useState("user"); // 'user' or 'captain'
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    // Determine if the user is a captain or passenger based on token
    const checkUserType = async () => {
      try {
        await axios.get(`${import.meta.env.VITE_BASE_URL}/captains/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUserType("captain");
      } catch (error) {
        setUserType("user");
      }
    };

    checkUserType();
  }, []);

  useEffect(() => {
    if (!ride) {
      navigate(userType === "captain" ? "/captain-home" : "/");
    }
  }, [ride, navigate, userType]);

  // Handle socket events for ride completion
  useEffect(() => {
    if (socket && ride) {
      // Join the ride-specific room
      socket.emit("join-ride", { rideId: ride._id });

      console.log(`Joined ride room for ride ID: ${ride._id}`);

      // Enhanced handler for ride completion
      const handleRideCompleted = (data) => {
        console.log("🚗 Ride completed event received in RideInProgress:", data);

        // Show completion notification
        const toast = document.createElement("div");
        toast.className =
          "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg bg-green-500 text-white";
        toast.innerHTML = `
        <div class="flex items-center">
          <span class="font-medium">Ride completed! Redirecting to rating page...</span>
        </div>
      `;
        document.body.appendChild(toast);

        // Get ride data from different possible structures
        let rideData = ride;
        if (data && data.data && data.data.ride) {
          rideData = data.data.ride;
        } else if (data && data.ride) {
          rideData = data.ride;
        } else if (data && data._id) {
          rideData = data;
        }

        // Update ride status to waiting_for_rating in localStorage
        const updatedRideData = { ...rideData, status: 'waiting_for_rating' };
        rideManager.setActiveRide(updatedRideData);
        
        // Store ride data in localStorage for recovery
        try {
          localStorage.setItem('lastCompletedRide', JSON.stringify(updatedRideData));
        } catch (e) {
          console.error('Error storing ride data:', e);
        }

        // Navigate to rating page after short delay
        setTimeout(() => {
          toast.remove();
          navigate("/ride-complete", { state: { ride: rideData } });
        }, 2000);
      };

      // Register the event handler
      socket.on("ride-completed", handleRideCompleted);

      // Clean up the event handler
      return () => {
        console.log("Cleaning up ride-completed event handler");
        socket.off("ride-completed", handleRideCompleted);
      };
    }
  }, [socket, ride, navigate]);
  const handleCompleteRide = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsCompleting(true);

      console.log("Sending request to complete ride with ID:", ride._id);

      const response = await api.post(
        `${import.meta.env.VITE_BASE_URL}/rides/complete-ride`,
        { rideId: ride._id }
      );

      console.log("Ride completion response:", response.data);

      if (response.data && response.data.success) {
        // Get the ride data from the response
        const rideData = response.data.data || response.data;

        if (socket) {
          // Emit event with more complete data
          socket.emit("ride-completed", {
            rideId: ride._id,
            userId: typeof ride.user === "object" ? ride.user._id : ride.user,
            captainId:
              typeof ride.captain === "object"
                ? ride.captain._id
                : ride.captain,
            ride: rideData, // Include the complete ride object
          });

          console.log("Emitted ride-completed event to socket server");

          // Fallback: Also emit to all sockets as a backup
          socket.emit("global-ride-completed", {
            rideId: ride._id,
            ride: rideData,
          });
        }

        // Fallback: Set a flag in localStorage that a ride was just completed
        try {
          localStorage.setItem("rideJustCompleted", "true");
          localStorage.setItem("completedRideId", ride._id);
          localStorage.setItem("completedRideData", JSON.stringify(rideData));
          localStorage.setItem(
            "completedRideTimestamp",
            new Date().toISOString()
          );
        } catch (e) {
          console.error("Error setting localStorage flags:", e);
        }

        // Update ride status to waiting_for_rating in localStorage
        const updatedRideData = { ...rideData, status: 'waiting_for_rating' };
        rideManager.setActiveRide(updatedRideData);

        // Navigate to appropriate page based on user type
        if (userType === "captain") {
          // For captains, show completion message and wait for user rating
          setIsCompleting(false);
          setSuccess("Ride completed! Waiting for user rating...");
          
          // Don't navigate away - let the user complete the rating first
          setTimeout(() => {
            setSuccess(null);
          }, 5000);
        } else {
          // For users, navigate to the rating page
          navigate("/ride-complete", { state: { ride: updatedRideData } });
        }
      }
    } catch (error) {
      console.error("Error completing ride:", error);
      setIsCompleting(false);

      // Better error handling
      if (error.response) {
        console.log("Error response data:", error.response.data);
        console.log("Error response status:", error.response.status);

        if (error.response.status === 401) {
          setError("Authentication failed. Please log in again.");
          setTimeout(() => {
            localStorage.removeItem("token");
            navigate(userType === "captain" ? "/captain-login" : "/");
          }, 2000);
        } else if (error.response.status === 404) {
          setError(
            "The ride completion endpoint was not found. Please contact support."
          );
        } else {
          setError(error.response.data?.message || "Failed to complete ride");
        }
      } else if (error.request) {
        setError(
          "No response received from server. Please check your connection."
        );
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!ride) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-t-black rounded-full mx-auto mb-2"></div>
        <p>Loading ride details...</p>
      </div>
    );
  }

  // Safely extract user/captain info
  const partnerName =
    userType === "captain"
      ? ride.user?.fullname?.firstname || "Passenger"
      : ride.captain?.fullname?.firstname || "Driver";

  // Safely extract locations
  const pickupAddress =
    typeof ride.pickup === "object"
      ? ride.pickup.address
      : ride.pickup || "Pickup location";
  const destinationAddress =
    typeof ride.destination === "object"
      ? ride.destination.address
      : ride.destination || "Destination";

  return (
    <div className="h-screen flex flex-col">
      {/* Map component - takes top 60% of screen */}
      <div className="h-3/5 relative">
        {!isCompleting && <LiveTracking ride={ride} userType={userType} />}
        {isCompleting && (
          <div className="h-full flex items-center justify-center bg-gray-100">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="text-4xl text-green-500 mb-3">✓</div>
              <h2 className="text-xl font-semibold mb-2">Completing Ride</h2>
              <p className="text-gray-600">
                Please wait while we finalize your trip...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Ride details - takes bottom 40% of screen */}
      <div className="h-2/5 bg-white rounded-t-3xl -mt-6 shadow-lg p-6 relative z-10">
        <h1 className="text-2xl font-bold mb-4">
          {userType === "captain"
            ? "Driving to Destination"
            : "On the way to Destination"}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <i className="ri-user-3-line text-xl"></i>
          </div>
          <div>
            <h3 className="font-medium">{partnerName}</h3>
            <div className="flex items-center text-yellow-400">
              <span>★★★★★</span>
              <span className="text-gray-500 ml-1">5.0</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
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

        {userType === "captain" && (
          <button
            onClick={handleCompleteRide}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold ${
              loading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {loading ? "Processing..." : "Complete Ride"}
          </button>
        )}
      </div>
    </div>
  );
};

export default RideInProgress;
