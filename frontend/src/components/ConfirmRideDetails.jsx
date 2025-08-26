import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';

const ConfirmRideDetails = () => {
    const [arrivalTime, setArrivalTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { socket } = useContext(SocketContext);
    
    // Get ride from location state or redirect back if none
    const ride = location.state?.ride;
    if (!ride) {
        // Redirect back if no ride data is available
        React.useEffect(() => {
            navigate('/captain-home');
        }, [navigate]);
        
        return (
            <div className="p-4 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-t-black rounded-full mx-auto mb-2"></div>
                <p>Loading ride details...</p>
            </div>
        );
    }

    // Safely extract ride data
    const pickupAddress = typeof ride.pickup === 'object' ? ride.pickup.address : String(ride.pickup || 'Pickup location');
    const destinationAddress = typeof ride.destination === 'object' ? ride.destination.address : String(ride.destination || 'Destination');
    const userName = ride.user?.fullname?.firstname || 'User';
    const fareAmount = ride.fare || 0;

    // Format currency
    const formatCurrency = (amount) => {
        try {
            return new Intl.NumberFormat('en-PK', {
                style: 'currency',
                currency: 'PKR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        } catch (error) {
            console.error('Currency formatting error:', error);
            return `Rs ${amount}`;
        }
    };

    // Update the handleSubmitArrivalTime function
    const handleSubmitArrivalTime = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!arrivalTime) {
                setError('Please enter an estimated arrival time');
                setLoading(false);
                return;
            }

            if (arrivalTime < 1 || arrivalTime > 60) {
                setError('Arrival time must be between 1 and 60 minutes');
                setLoading(false);
                return;
            }

            // Check for token
            const token = localStorage.getItem('token');
            if (!token) {
                setError('You are not logged in. Please log in again.');
                setLoading(false);
                return;
            }

            console.log('Submitting arrival time:', {
                rideId: ride._id,
                arrivalTime: parseInt(arrivalTime)
            });

            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/rides/update-arrival`,
                {
                    rideId: ride._id,
                    arrivalTime: parseInt(arrivalTime)
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
                    socket.emit('captain-arrival-time', {
                        rideId: ride._id,
                        arrivalTime: parseInt(arrivalTime),
                        userId: typeof ride.user === 'object' ? ride.user._id : ride.user
                    });
                }
                navigate('/captain-waiting', { state: { ride: response.data } });
            }
        } catch (error) {
            console.error('Error updating arrival time:', error);
            let errorMessage = 'Failed to update arrival time';
            
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

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg max-w-lg mx-auto my-8">
            <h2 className="text-2xl font-semibold mb-6">Confirm Ride Details</h2>

            {/* User Details */}
            <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <i className="ri-user-3-line text-xl"></i>
                    </div>
                    <div>
                        <h3 className="font-semibold">{userName}</h3>
                        <p className="text-sm text-gray-500">Passenger</p>
                    </div>
                </div>
            </div>

            {/* Ride Details */}
            <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                    <i className="ri-map-pin-line text-green-500 text-xl"></i>
                    <div>
                        <p className="text-sm text-gray-500">Pickup</p>
                        <p className="font-medium">{pickupAddress}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <i className="ri-flag-line text-red-500 text-xl"></i>
                    <div>
                        <p className="text-sm text-gray-500">Destination</p>
                        <p className="font-medium">{destinationAddress}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <i className="ri-money-dollar-circle-line text-green-500 text-xl"></i>
                    <div>
                        <p className="text-sm text-gray-500">Fare</p>
                        <p className="font-medium">{formatCurrency(fareAmount)}</p>
                    </div>
                </div>
            </div>

            {/* Arrival Time Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Arrival Time (minutes)
                </label>
                <input
                    type="number"
                    min="1"
                    max="60"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter arrival time in minutes"
                />
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <button
                onClick={handleSubmitArrivalTime}
                disabled={!arrivalTime || loading}
                className={`w-full py-3 rounded-lg font-semibold ${
                    loading || !arrivalTime
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
                {loading ? 'Updating...' : 'Confirm & Send Arrival Time'}
            </button>
        </div>
    );
};

export default ConfirmRideDetails;