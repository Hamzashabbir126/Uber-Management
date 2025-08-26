import React, { useRef, useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import CaptainDetails from "../components/CaptainDetails";
import RidePopUp from "../components/RidePopUp";
import ConfirmRidePopUp from "../components/ConfirmRidePopUp";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SocketContext } from "../context/SocketContext";
import { CaptainDataContext } from "../context/CapatainContext";
import axios from "axios";
import { getAuthHeader, getAuthToken } from '../utils/authHeader';
import { api } from '../utils/authHeader'; // Or from apiUtils.js if you created it there

const CaptainHome = () => {
  const navigate = useNavigate();
  const [ridePopupPanel, setRidePopupPanel] = useState(false);
  const [confirmRidePopupPanel, setConfirmRidePopupPanel] = useState(false);
  const [ride, setRide] = useState(null);
  const [stats, setStats] = useState({
    totalRides: 0,
    totalEarnings: 0,
    rating: 0,
    todayRides: 0,
    todayEarnings: 0,
  });
  const [recentRides, setRecentRides] = useState([]);
  const [pendingRides, setPendingRides] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("requests");

  const ridePopupPanelRef = useRef(null);
  const confirmRidePopupPanelRef = useRef(null);
  const { socket } = useContext(SocketContext);
  const { captain } = useContext(CaptainDataContext);

  // Sort recent rides by status and date
  const sortedRecentRides = [...recentRides].sort((a, b) => {
    // Priority order for status
    const statusOrder = {
      'started': 0,
      'confirmed': 1,
      'completed': 2,
      'cancelled': 3
    };
    
    // First sort by status
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    
    // Then sort by date (newest first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Get color based on ride status
  const getStatusColor = (status) => {
    const colors = {
      'started': 'text-green-600',
      'confirmed': 'text-blue-600',
      'completed': 'text-gray-600',
      'cancelled': 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  // Helper function to safely extract address
  const getAddress = (location) => {
    if (!location) return "Location not specified";
    if (typeof location === "string") return location;
    return location.address || "Location not specified";
  };

  // Helper function to safely extract distance
  const getDistance = (distance) => {
    if (!distance) return "0 km";
    if (typeof distance === "string") return distance;
    return distance.text || "0 km";
  };

  // Helper function to safely extract fare
  const getFare = (fare) => {
    return fare || 0;
  };

  // Function to fetch captain stats
  const fetchStats = async () => {
    try {
      if (!captain?._id) {
        console.log('No captain ID available');
        return;
      }

      const response = await api.get(
        `${import.meta.env.VITE_BASE_URL}/captains/stats/${captain._id}`
      );
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError("Failed to load statistics");
      
      // Check if this is an authentication error
      if (error.response?.status === 401) {
        // Handle unauthorized error - maybe redirect to login
        localStorage.removeItem('token'); // Clear invalid token
        navigate('/captain-login');
      }
    }
  };

  // Function to fetch recent rides
  const fetchRecentRides = async () => {
    try {
      if (!captain?._id) {
        console.log('No captain ID available');
        return;
      }

      const response = await api.get(
        `${import.meta.env.VITE_BASE_URL}/rides/history/${captain._id}`
      );
      setRecentRides(response.data.rides || []);
    } catch (error) {
      console.error("Error fetching recent rides:", error);
      setError("Failed to load recent rides");
    }
  };

  // Function to fetch pending rides
  const fetchPendingRides = async () => {
    try {
      const response = await api.get(
        `${import.meta.env.VITE_BASE_URL}/rides/pending`
      );
      setPendingRides(response.data.rides || []);
    } catch (error) {
      console.error("Error fetching pending rides:", error);
      setError("Failed to load pending rides");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_BASE_URL}/captains/logout`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      localStorage.removeItem("token");
      navigate("/captain-login");
    } catch (error) {
      console.error("Logout error:", error);
      setError("Failed to logout");
    }
  };

  // Initial data fetch
 useEffect(() => {
  if (!captain?._id) {
    return;
  }
  
  const fetchData = async () => {
    try {
      await fetchStats();
    } catch (error) {
      console.log("Stats not available yet");
    }
    
    try {
      await fetchRecentRides();
    } catch (error) {
      console.log("Recent rides not available yet");
    }
    
    try {
      await fetchPendingRides();
    } catch (error) {
      console.log("Pending rides not available yet");
    }
  };
  
  fetchData();
}, [captain]);
  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleNewRide = (data) => {
      setPendingRides((prev) => [data, ...prev]);
      if (Notification.permission === "granted") {
        new Notification("New Ride Request", {
          body: `From: ${getAddress(data.pickup)}`,
          icon: "/uber-icon.png",
        });
      }
    };

    socket.on("new-ride", handleNewRide);

    return () => {
      socket.off("new-ride", handleNewRide);
    };
  }, [socket]);

  // Location update logic
  useEffect(() => {
    if (!captain?._id || !isOnline) return;

    socket.emit("join", {
      userId: captain._id,
      userType: "captain",
    });

    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          if (socket) {
            socket.emit("update-location-captain", {
              userId: captain._id,
              location: {
                lat: position.coords.latitude, // Use lat for frontend
                lng: position.coords.longitude,
                ltd: position.coords.latitude, // Add ltd as well for backend compatibility
              },
            });
          }
        });
      }
    };

    const locationInterval = setInterval(updateLocation, 10000);
    updateLocation();

    return () => clearInterval(locationInterval);
  }, [captain, isOnline, socket]);

 // d:\uber-video\frontend\src\pages\CaptainHome.jsx
// Confirm ride function
const confirmRide = async () => {
  if (!captain?._id || !ride?._id) {
    setError("Missing required data");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    console.log(`Confirming ride: ${ride._id} for captain: ${captain._id}`);
    
    // Ensure proper data format - only send rideId, not captainId
    const response = await api.post(
      `${import.meta.env.VITE_BASE_URL}/rides/confirm`,
      {
        rideId: ride._id
      }
    );

    console.log("Ride confirmation response:", response);

    if (response.data) {
      setRidePopupPanel(false);
      setConfirmRidePopupPanel(true);
      
      // Make sure socket exists before emitting
      if (socket) {
        socket.emit("ride-confirmed", {
          rideId: ride._id
        });
      }
      
      setPendingRides((prev) => prev.filter((r) => r._id !== ride._id));
      
      // Refresh data
      try {
        await fetchStats();
      } catch (err) {
        console.error("Error refreshing stats:", err);
      }
      
      try {
        await fetchRecentRides();
      } catch (err) {
        console.error("Error refreshing rides:", err);
      }
    }
  } catch (error) {
    console.error("Error confirming ride:", error);
    
    // Enhanced error message
    if (error.response?.status === 400) {
      setError(error.response?.data?.message || "Ride cannot be confirmed. It might be already taken or canceled.");
    } else if (error.response?.status === 500) {
      setError("Server error while confirming ride. Please try again.");
    } else {
      setError(error.response?.data?.message || "Failed to confirm ride");
    }
  } finally {
    setLoading(false);
  }
};
  // Toggle online status
  const toggleOnlineStatus = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/captains/toggle-status`,
        { status: !isOnline ? "active" : "inactive" },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setIsOnline(!isOnline);
    } catch (error) {
      console.error("Error toggling status:", error);
      setError("Failed to update status");
    }
  };

  // GSAP animations
  useGSAP(() => {
    if (ridePopupPanel) {
      gsap.to(ridePopupPanelRef.current, {
        transform: "translateY(0)",
        duration: 0.3,
        ease: "power2.out",
      });
    } else {
      gsap.to(ridePopupPanelRef.current, {
        transform: "translateY(100%)",
        duration: 0.3,
        ease: "power2.in",
      });
    }
  }, [ridePopupPanel]);

  useGSAP(() => {
    if (confirmRidePopupPanel) {
      gsap.to(confirmRidePopupPanelRef.current, {
        transform: "translateY(0)",
        duration: 0.3,
        ease: "power2.out",
      });
    } else {
      gsap.to(confirmRidePopupPanelRef.current, {
        transform: "translateY(100%)",
        duration: 0.3,
        ease: "power2.in",
      });
    }
  }, [confirmRidePopupPanel]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Render ride request item
  const renderRideRequest = (request) => {
    if (!request) return null;

    return (
      <div
        key={request._id}
        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => {
          setRide(request);
          setRidePopupPanel(true);
        }}
      >
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <i className="ri-map-pin-line text-green-500"></i>
              <p className="font-semibold">{getAddress(request.pickup)}</p>
            </div>
            <div className="flex items-center gap-2">
              <i className="ri-flag-line text-red-500"></i>
              <p className="font-semibold">{getAddress(request.destination)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">
              {formatCurrency(getFare(request.fare))}
            </p>
            <p className="text-sm text-gray-500">
              {getDistance(request.distance)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render recent ride item
  const renderRecentRide = (ride) => (
    <div
      key={ride._id}
      className={`border rounded-lg p-4 ${
        ride.status === 'started' ? 'border-green-500' : ''
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <img
              src={ride.user?.avatar || "/default-avatar.png"}
              alt="User"
              className="w-8 h-8 rounded-full"
            />
            <span className="font-medium">
              {ride.user?.fullname?.firstname || 'User'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <i className="ri-map-pin-line text-green-500"></i>
            <p className="text-sm">{getAddress(ride.pickup)}</p>
          </div>
          <div className="flex items-center gap-2">
            <i className="ri-flag-line text-red-500"></i>
            <p className="text-sm">{getAddress(ride.destination)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">
            {formatCurrency(getFare(ride.fare))}
          </p>
          <p className={`text-sm ${getStatusColor(ride.status)}`}>
            {ride.status.toUpperCase()}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(ride.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="container mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              className="w-16"
              src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png"
              alt="Uber Logo"
            />
            <div
              className={`px-4 py-2 rounded-full ${
                isOnline ? "bg-green-500 text-white" : "bg-red-500 text-white"
              }`}
            >
              {isOnline ? "Active" : "Offline"}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleOnlineStatus}
              className="px-6 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
            >
              Go {isOnline ? "Offline" : "Online"}
            </button>
            <button
              onClick={handleLogout}
              className="h-10 w-10 bg-gray-100 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
            >
              <i className="text-lg font-medium ri-logout-box-r-line"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto pt-24 px-4 pb-20">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 className="text-gray-500">Today's Earnings</h3>
            <p className="text-2xl font-bold">
              {formatCurrency(stats.todayEarnings)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 className="text-gray-500">Total Earnings</h3>
            <p className="text-2xl font-bold">
              {formatCurrency(stats.totalEarnings)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 className="text-gray-500">Today's Rides</h3>
            <p className="text-2xl font-bold">{stats.todayRides}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 className="text-gray-500">Rating</h3>
            <p className="text-2xl font-bold">{stats.rating.toFixed(1)} ⭐</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex border-b">
            <button
              className={`flex-1 py-3 text-center font-medium ${
                activeTab === "requests"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("requests")}
            >
              New Requests{" "}
              {pendingRides.length > 0 && `(${pendingRides.length})`}
            </button>
            <button
              className={`flex-1 py-3 text-center font-medium ${
                activeTab === "history"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("history")}
            >
              Ride History
            </button>
          </div>

          <div className="p-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {activeTab === "requests" ? (
              pendingRides.length > 0 ? (
                <div className="space-y-4">
                  {pendingRides.map(renderRideRequest)}
                </div>
              ) : (
                <div className="text-center py-12">
                  <i className="ri-route-line text-5xl text-gray-300 mb-2"></i>
                  <p className="text-gray-500">No pending ride requests</p>
                </div>
              )
            ) : sortedRecentRides.length > 0 ? (
              <div className="space-y-4">
                {sortedRecentRides.map(renderRecentRide)}
              </div>
            ) : (
              <div className="text-center py-12">
                <i className="ri-history-line text-5xl text-gray-300 mb-2"></i>
                <p className="text-gray-500">No ride history yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ride Popups */}
      <div
        ref={ridePopupPanelRef}
        className="fixed w-full z-10 bottom-0 translate-y-full bg-white rounded-t-2xl shadow-lg"
      >
        <RidePopUp
          ride={ride}
          setRidePopupPanel={setRidePopupPanel}
          setConfirmRidePopupPanel={setConfirmRidePopupPanel}
          confirmRide={confirmRide}
          loading={loading}
          error={error}
        />
      </div>

      <div
        ref={confirmRidePopupPanelRef}
        className="fixed w-full h-screen z-20 bottom-0 translate-y-full bg-white rounded-t-2xl shadow-lg"
      >
        <ConfirmRidePopUp
          ride={ride}
          setConfirmRidePopupPanel={setConfirmRidePopupPanel}
          setRidePopupPanel={setRidePopupPanel}
        />
      </div>
    </div>
  );
};

export default CaptainHome;