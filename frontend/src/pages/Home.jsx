import React, { useEffect, useRef, useState, useContext } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import axios from "axios";
import "remixicon/fonts/remixicon.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { SocketContext } from "../context/SocketContext";
import { UserDataContext } from "../context/UserContext";
import LocationSearchPanel from "../components/LocationSearchPanel";
import VehiclePanel from "../components/VehiclePanel";
import ConfirmRide from "../components/ConfirmRide";
import LookingForDriver from "../components/LookingForDriver";
import WaitingForDriver from "../components/WaitingForDriver";
import LiveTracking from "../components/LiveTracking";
import rideManager from "../utils/rideManager";

const Home = () => {
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const { user, isLoading } = useContext(UserDataContext);

  // State management
  const [fareDetails, setFareDetails] = useState({
    fare: {},
    distance: {},
    duration: {}
  });
  const [selectedVehicle, setSelectedVehicle] = useState("car");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);
  const [ride, setRide] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);

  // Panel states
  const [vehiclePanel, setVehiclePanel] = useState(false);
  const [confirmRidePanel, setConfirmRidePanel] = useState(false);
  const [showLookingForDriver, setShowLookingForDriver] = useState(false);
  const [vehicleFound, setVehicleFound] = useState(false);
  const [waitingForDriver, setWaitingForDriver] = useState(false);

  // Refs for animations
  const vehiclePanelRef = useRef(null);
  const confirmRidePanelRef = useRef(null);
  const vehicleFoundRef = useRef(null);
  const waitingForDriverRef = useRef(null);
  const panelRef = useRef(null);
  const panelCloseRef = useRef(null);
  
  // Request location permission
  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermission(true);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Location access is required to use this app");
          setLocationPermission(false);
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
      setLocationPermission(false);
    }
  };

  // Check for location permission on mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Socket connection
  useEffect(() => {
    if (!user || !socket) return;
    
    socket.emit("join", { 
      userType: "user", 
      userId: user._id 
    });

    return () => {
      socket.off("join");
    };
  }, [user, socket]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleRideConfirmed = (rideData) => {
      console.log('Ride confirmed with data:', rideData);
      setVehicleFound(false);
      setWaitingForDriver(true);
      
      // Extract the actual ride data from the socket event
      let actualRideData = rideData;
      if (rideData && rideData.data && rideData.data.ride) {
        actualRideData = rideData.data.ride;
      } else if (rideData && rideData.ride) {
        actualRideData = rideData.ride;
      }
      
      setRide(actualRideData);
      
      // Ensure rideData has the correct status and store directly
      const updatedRideData = { ...actualRideData, status: 'confirmed' };
      
      // Store the ride directly in localStorage (not nested)
      rideManager.setActiveRide(updatedRideData);
      
      console.log('Updated ride status to confirmed and stored in localStorage:', updatedRideData);
    };

    const handleRideCancelled = (data) => {
      console.log('Ride cancelled event received:', data);
      
      // Extract the actual ride data from the socket event if needed
      let rideId = null;
      if (data && data.data && data.data.rideId) {
        rideId = data.data.rideId;
      } else if (data && data.rideId) {
        rideId = data.rideId;
      }
      
      // Clear ride state
      setRide(null);
      setVehicleFound(false);
      setWaitingForDriver(false);
      setShowLookingForDriver(false);
      
      // Clear ride from localStorage
      rideManager.clearRide();
      
      console.log('Ride cancelled, cleared all state and localStorage');
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
      
      setWaitingForDriver(false);
      navigate("/riding", { state: { ride: actualRideData } });
    };

    socket.on("ride-confirmed", handleRideConfirmed);
    socket.on("ride-started", handleRideStarted);
    socket.on("ride-cancelled", handleRideCancelled);

    return () => {
      socket.off("ride-confirmed", handleRideConfirmed);
      socket.off("ride-started", handleRideStarted);
      socket.off("ride-cancelled", handleRideCancelled);
    };
  }, [socket, navigate]);

  // GSAP Animations
  useGSAP(() => {
    if (panelRef.current && panelCloseRef.current) {
      gsap.to(panelRef.current, {
        height: panelOpen ? "70%" : "0%",
        padding: panelOpen ? 24 : 0,
        duration: 0.3
      });
      gsap.to(panelCloseRef.current, {
        opacity: panelOpen ? 1 : 0,
        duration: 0.3
      });
    }
  }, [panelOpen]);

  useGSAP(() => {
    if (vehiclePanelRef.current) {
      gsap.to(vehiclePanelRef.current, {
        transform: vehiclePanel ? "translateY(0)" : "translateY(100%)",
        duration: 0.3
      });
    }
  }, [vehiclePanel]);

  useGSAP(() => {
    if (confirmRidePanelRef.current) {
      gsap.to(confirmRidePanelRef.current, {
        transform: confirmRidePanel ? "translateY(0)" : "translateY(100%)",
        duration: 0.3
      });
    }
  }, [confirmRidePanel]);

  useGSAP(() => {
    if (vehicleFoundRef.current) {
      gsap.to(vehicleFoundRef.current, {
        transform: vehicleFound ? "translateY(0)" : "translateY(100%)",
        duration: 0.3
      });
    }
  }, [vehicleFound]);

  useGSAP(() => {
    if (waitingForDriverRef.current) {
      gsap.to(waitingForDriverRef.current, {
        transform: waitingForDriver ? "translateY(0)" : "translateY(100%)",
        duration: 0.3
      });
    }
  }, [waitingForDriver]);

  // Location search handlers
  const handlePickupChange = async (e) => {
    const value = e.target.value;
    setPickup(value);
    if (value.length < 3) {
      setPickupSuggestions([]);
      return;
    }
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/geoapify/search`,
        {
          params: { query: value },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      setPickupSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error("Error fetching pickup suggestions:", error);
      toast.error("Failed to load pickup suggestions");
      setPickupSuggestions([]);
    }
  };

  const handleDestinationChange = async (e) => {
    const value = e.target.value;
    setDestination(value);
    if (value.length < 3) {
      setDestinationSuggestions([]);
      return;
    }
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/geoapify/search`,
        {
          params: { query: value },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      setDestinationSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error("Error fetching destination suggestions:", error);
      toast.error("Failed to load destination suggestions");
      setDestinationSuggestions([]);
    }
  };

  // Calculate fare and show vehicle options
  const findTrip = async () => {
    try {
      if (!pickup || !destination) {
        toast.error("Please enter both pickup and destination locations");
        return;
      }

      setVehiclePanel(true);
      setPanelOpen(false);

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/rides/get-fare`,
        {
          params: {
            pickup: JSON.stringify(pickup),
            destination: JSON.stringify(destination)
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      setFareDetails(response.data);
    } catch (error) {
      console.error("Error calculating fare:", error);
      toast.error("Failed to calculate fare. Please try again.");
      setVehiclePanel(false);
    }
  };

  // Create ride request
  const createRide = async () => {
    try {
      if (!selectedVehicle || !pickup || !destination) {
        toast.error("Missing required ride information");
        return;
      }

      // Check for valid object structure
      if (!pickup.address || !destination.address) {
        toast.error("Invalid location data. Please search for valid addresses.");
        return;
      }

      const rideData = {
        pickup: {
          title: pickup.title || pickup.address,
          address: pickup.address,
          latitude: Number(pickup.latitude || pickup.lat),
          longitude: Number(pickup.longitude || pickup.lng)
        },
        destination: {
          title: destination.title || destination.address,
          address: destination.address,
          latitude: Number(destination.latitude || destination.lat),
          longitude: Number(destination.longitude || destination.lng)
        },
        vehicleType: selectedVehicle,
        fare: fareDetails.fare[selectedVehicle] || 0,
        distance: fareDetails.distance || { text: "Unknown", value: 0 },
        duration: fareDetails.duration || { text: "Unknown", value: 0 }
      };

      console.log("Creating ride with data:", rideData);

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/create`,
        rideData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        const rideData = response.data.data;
        setRide(rideData);
        // Store ride in localStorage for persistence
        rideManager.setActiveRide(rideData);
        setShowLookingForDriver(true);
        setVehicleFound(true);
        setConfirmRidePanel(false);
      } else {
        throw new Error(response.data.message || "Failed to create ride");
      }
    } catch (error) {
      console.error("Error creating ride:", error);
      
      // More descriptive error message
      let errorMessage = "Failed to create ride";
      
      if (error.response) {
        // Server responded with an error
        errorMessage = error.response.data?.message || 
                       `Server error: ${error.response.status}`;
        console.log("Server error details:", error.response.data);
      } else if (error.request) {
        // Request made but no response received
        errorMessage = "No response from server. Please check your connection.";
      } else {
        // Error in request setup
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-8 w-8 border-4 border-t-black rounded-full"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isLoading && !user) {
    navigate("/login");
    return null;
  }

  // If location permission is not granted, show permission prompt
  if (!locationPermission) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white p-4 text-center">
        <img
          className="w-16 mb-8"
          src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png"
          alt="Uber Logo"
        />
        <h3 className="text-xl font-bold mb-2">Location Access Required</h3>
        <p className="mb-4">Please enable location access to use the app and track your ride.</p>
        <button 
          onClick={requestLocationPermission}
          className="bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Enable Location
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen relative overflow-hidden">
      <img
        className="w-16 absolute left-5 top-5 z-10"
        src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png"
        alt="Uber Logo"
      />
      
      <div className="h-screen w-screen">
        <LiveTracking ride={ride} userType="user" />
      </div>

      {!waitingForDriver && !vehicleFound && (
        <div className="flex flex-col justify-end h-screen absolute top-0 w-full">
          <div className="h-[30%] p-6 bg-white relative">
            <h5
              ref={panelCloseRef}
              onClick={() => setPanelOpen(false)}
              className="absolute opacity-0 right-6 top-6 text-2xl cursor-pointer"
            >
              <i className="ri-arrow-down-wide-line"></i>
            </h5>
            <h4 className="text-2xl font-semibold">Find a trip</h4>
            
            <form className="relative py-3" onSubmit={(e) => e.preventDefault()}>
              <div className="line absolute h-16 w-1 top-[50%] -translate-y-1/2 left-5 bg-gray-700 rounded-full"></div>
              <input
                onClick={() => {
                  setPanelOpen(true);
                  setActiveField("pickup");
                }}
                value={typeof pickup === "object" ? pickup.title : pickup}
                onChange={handlePickupChange}
                className="bg-[#eee] px-12 py-2 text-lg rounded-lg w-full"
                type="text"
                placeholder="Add a pick-up location"
              />
              <input
                onClick={() => {
                  setPanelOpen(true);
                  setActiveField("destination");
                }}
                value={typeof destination === "object" ? destination.title : destination}
                onChange={handleDestinationChange}
                className="bg-[#eee] px-12 py-2 text-lg rounded-lg w-full mt-3"
                type="text"
                placeholder="Enter your destination"
              />
            </form>

            <button
              onClick={findTrip}
              className="bg-black text-white px-4 py-2 rounded-lg mt-3 w-full hover:bg-gray-800 transition-colors"
            >
              Find Trip
            </button>
          </div>

          <div ref={panelRef} className="bg-white h-0 overflow-hidden">
            <LocationSearchPanel
              suggestions={activeField === "pickup" ? pickupSuggestions : destinationSuggestions}
              setPanelOpen={setPanelOpen}
              setPickup={setPickup}
              setDestination={setDestination}
              activeField={activeField}
            />
          </div>
        </div>
      )}

      {/* Vehicle Selection Panel */}
      <div
        ref={vehiclePanelRef}
        className="fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12"
      >
        <VehiclePanel
          fare={fareDetails.fare}
          distance={fareDetails.distance}
          duration={fareDetails.duration}
          selectVehicle={setSelectedVehicle}
          setConfirmRidePanel={setConfirmRidePanel}
          setVehiclePanel={setVehiclePanel}
        />
      </div>

      {/* Ride Confirmation Panel */}
      <div
        ref={confirmRidePanelRef}
        className="fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12"
      >
        <ConfirmRide
          onConfirm={createRide}
          fare={fareDetails.fare[selectedVehicle] || 0}
          distance={fareDetails.distance}
          duration={fareDetails.duration}
          selectedVehicle={selectedVehicle}
        />
      </div>

      {/* Looking for Driver Panel */}
      <div
        ref={vehicleFoundRef}
        className="fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12"
      >
        <LookingForDriver
          pickup={pickup}
          destination={destination}
          fare={fareDetails.fare[selectedVehicle] || 0}
          vehicleType={selectedVehicle}
          distance={fareDetails.distance}
          duration={fareDetails.duration}
          setVehicleFound={setVehicleFound}
        />
      </div>

      {/* Waiting for Driver Panel */}
      <div
        ref={waitingForDriverRef}
        className="fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12"
      >
        <WaitingForDriver
          ride={ride}
          distance={fareDetails.distance}
          duration={fareDetails.duration}
          setWaitingForDriver={setWaitingForDriver}
        />
      </div>
    </div>
  );
};

export default Home;