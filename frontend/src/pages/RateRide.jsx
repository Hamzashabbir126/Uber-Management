import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { SocketContext } from "../context/SocketContext";
import { api } from "../utils/authHeader";

const RateRide = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const [ride, setRide] = useState(location.state?.ride);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userType, setUserType] = useState("user"); // 'user' or 'captain'

  useEffect(() => {
    // Check if we arrived via automatic navigation or need to recover ride data
    const queryParams = new URLSearchParams(window.location.search);
    const isAutoNavigation = queryParams.get('auto') === 'true';
    
    if ((isAutoNavigation || !ride) && !ride) {
      // Try to recover ride data from localStorage
      try {
        const savedRide = JSON.parse(localStorage.getItem('lastCompletedRide'));
        if (savedRide && savedRide._id) {
          console.log('Recovered ride data from localStorage:', savedRide);
          setRide(savedRide);
        } else {
          // Also check for other possible localStorage keys
          const rideJustCompleted = localStorage.getItem('rideJustCompleted');
          if (rideJustCompleted === 'true') {
            const completedRideData = localStorage.getItem('completedRideData');
            if (completedRideData) {
              try {
                const parsedRide = JSON.parse(completedRideData);
                if (parsedRide && parsedRide._id) {
                  console.log('Recovered ride data from completedRideData:', parsedRide);
                  setRide(parsedRide);
                }
              } catch (e) {
                console.error('Error parsing completedRideData:', e);
              }
            }
          }
        }
      } catch (e) {
        console.error('Error recovering ride data:', e);
      }
    }
  }, [ride]);

  useEffect(() => {
    // Determine if the user is a captain or passenger based on token
    const checkUserType = async () => {
      try {
        await axios.get(`${import.meta.env.VITE_BASE_URL || 'http://localhost:3000'}/captains/profile`, {
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

  const handleSubmitRating = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have the ride ID
      if (!ride?._id) {
        setError("Invalid ride information");
        return;
      }

      console.log("Submitting rating:", {
        rideId: ride._id,
        rating,
        comment,
        raterType: userType,
      });

      const response = await api.post(
        `${import.meta.env.VITE_BASE_URL}/rides/rate`,
        {
          rideId: ride._id,
          rating,
          comment,
        }
      );

      if (response.data) {
        navigate(userType === "captain" ? "/captain-home" : "/");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);

      if (error.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
        // Redirect to login after a short delay
        setTimeout(() => {
          localStorage.removeItem("token"); // Clear invalid token
          navigate(userType === "captain" ? "/captain-login" : "/");
        }, 2000);
      } else {
        setError(error.response?.data?.message || "Failed to submit rating");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Automatically submit a 5-star rating without comment
    handleSubmitRating();
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

  const partnerRole = userType === "captain" ? "passenger" : "driver";

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
            <i className="ri-checkbox-circle-line text-green-600 text-4xl"></i>
          </div>
          <h1 className="text-2xl font-bold">Ride Completed!</h1>
          <p className="text-gray-600 mt-2">Thank you for riding with us.</p>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            How was your {partnerRole}?
          </h2>

          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
              <i className="ri-user-3-line text-xl"></i>
            </div>
            <h3 className="font-medium">{partnerName}</h3>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-3xl ${
                  star <= rating ? "text-yellow-400" : "text-gray-300"
                }`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            placeholder="Add a comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 border rounded-lg resize-none h-24"
          ></textarea>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleSubmitRating}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold ${
              loading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {loading ? "Submitting..." : "Submit Rating"}
          </button>

          <button
            onClick={handleSkip}
            className="w-full py-3 text-gray-500 hover:text-gray-700"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default RateRide;
