import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import rideManager from '../utils/rideManager';

const CaptainWaiting = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { socket } = useContext(SocketContext);
    const [ride, setRide] = useState(location.state?.ride);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (!ride) {
            navigate('/captain-home');
        }
    }, [ride, navigate]);

    useEffect(() => {
        if (socket && ride) {
            socket.emit('join-ride', { rideId: ride._id });
        }
    }, [socket, ride]);

    const handlePickupUser = async () => {
        try {
            setLoading(true);
            setError(null);

            // Check for token
            const token = localStorage.getItem('token');
            if (!token) {
                setError('You are not logged in. Please log in again.');
                setLoading(false);
                return;
            }

            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/rides/start-ride`,
                { 
                    rideId: ride._id 
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                if (socket) {
                    socket.emit('ride-started', {
                        rideId: ride._id,
                        userId: typeof ride.user === 'object' ? ride.user._id : ride.user
                    });
                }
                navigate('/ride-in-progress', { state: { ride: response.data } });
            }
        } catch (error) {
            console.error('Error starting ride:', error);
            let errorMessage = 'Failed to start ride';
            
            if (error.response) {
                // Handle specific status codes
                if (error.response.status === 401) {
                    errorMessage = 'Authentication failed. Please log in again.';
                    // Optionally redirect to login page
                    // navigate('/login');
                } else {
                    errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
                }
            } else if (error.request) {
                errorMessage = 'No response from server. Please check your connection.';
            } else {
                errorMessage = error.message;
            }
            
            setError(errorMessage);
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

    const handleCancelRide = async () => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            
            if (!ride || !ride._id) {
                setError("Cannot cancel: Ride ID is not available");
                setLoading(false);
                return;
            }
            
            console.log("Cancelling ride:", ride._id);
            
            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL || 'http://localhost:3000'}/rides/captain/cancel`,
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
                
                // Clear ride from localStorage
                rideManager.clearRide();
                
                if (socket) {
                    socket.emit('ride-cancelled', { 
                        rideId: ride._id,
                        userId: typeof ride.user === 'object' ? ride.user._id : ride.user,
                        captainId: typeof ride.captain === 'object' ? ride.captain._id : ride.captain
                    });
                }
                
                setTimeout(() => {
                    navigate('/captain-home');
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
                    navigate('/captain-login');
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

    // Safely extract user info
    const userName = ride.user?.fullname?.firstname || 'Passenger';
    const userEmail = ride.user?.email || '';
    const userRating = ride.user?.rating || 5;

    // Safely extract locations
    const pickupAddress = typeof ride.pickup === 'object' ? ride.pickup.address : ride.pickup || 'Pickup location';
    const destinationAddress = typeof ride.destination === 'object' ? ride.destination.address : ride.destination || 'Destination';

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold mb-6">Waiting for Passenger</h1>

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

                <div className="mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Passenger Details</h2>
                            <div className="flex items-center">
                                <span className="text-yellow-500 mr-1">★</span>
                                <span>{userRating.toFixed(1)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                                <i className="ri-user-3-line text-2xl text-gray-500"></i>
                            </div>
                            <div>
                                <p className="font-semibold">{userName}</p>
                                <p className="text-gray-500 text-sm">{userEmail}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="font-semibold mb-2">Trip Details</h3>
                    <div className="space-y-4">
                        <div className="flex">
                            <div className="w-8 flex-shrink-0 flex flex-col items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <div className="w-0.5 h-full bg-gray-300 mx-auto"></div>
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">Pickup</p>
                                <p className="text-gray-600">{pickupAddress}</p>
                            </div>
                        </div>
                        <div className="flex">
                            <div className="w-8 flex-shrink-0 flex flex-col items-center">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">Destination</p>
                                <p className="text-gray-600">{destinationAddress}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handlePickupUser}
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-semibold ${
                            loading
                                ? 'bg-gray-300 text-gray-500'
                                : 'bg-black text-white hover:bg-gray-800'
                        } transition-colors`}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin h-5 w-5 border-2 border-t-white rounded-full mr-2"></div>
                                Processing...
                            </div>
                        ) : (
                            'Start Ride'
                        )}
                    </button>

                    <button
                        onClick={handleCancelRide}
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-semibold ${
                            loading
                                ? 'bg-gray-300 text-gray-500'
                                : 'text-red-600 border border-red-600 hover:bg-red-50'
                        } transition-colors`}
                    >
                        Cancel Ride
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CaptainWaiting;