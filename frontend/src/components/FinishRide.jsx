import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FinishRide = ({ ride, setFinishRidePanel }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const endRide = async () => {
        try {
            setLoading(true);
            setError(null);
            
            if (!ride?._id) {
                throw new Error('Invalid ride data');
            }

            // Check if token exists
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication token not found. Please log in again.');
                setLoading(false);
                return;
            }

            // Fix the token check to avoid TypeError
            const authHeader = token && typeof token === 'string' && token.startsWith 
                ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`)
                : `Bearer ${token}`;

            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/rides/complete-ride`,
                { rideId: ride._id },
                {
                    headers: {
                        Authorization: authHeader
                    }
                }
            );

            if (response.data) {
                navigate('/captain-home');
            }
        } catch (error) {
            console.error('Error completing ride:', error);
            
            // Better error handling
            if (error.response) {
                console.log("Error response data:", error.response.data);
                console.log("Error response status:", error.response.status);
                
                if (error.response.status === 401) {
                    setError('Authentication failed. Please log in again.');
                } else if (error.response.status === 404) {
                    setError('The ride completion endpoint was not found. Please contact support.');
                } else {
                    setError(error.response.data?.message || 'Failed to complete ride');
                }
            } else if (error.request) {
                console.log("Error request:", error.request);
                setError('No response received from server. Please check your connection.');
            } else {
                setError('Failed to send request: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // Safely extract values with fallbacks
    const getUserName = () => {
        if (!ride?.user) return 'Passenger';
        if (typeof ride.user === 'string') return ride.user;
        return ride.user.fullname?.firstname || 'Passenger';
    };

    const getPickupLocation = () => {
        if (!ride?.pickup) return 'Pickup location not specified';
        if (typeof ride.pickup === 'string') return ride.pickup;
        return ride.pickup.address || 'Pickup location';
    };

    const getDestination = () => {
        if (!ride?.destination) return 'Destination not specified';
        if (typeof ride.destination === 'string') return ride.destination;
        return ride.destination.address || 'Destination';
    };

    const getFare = () => {
        if (typeof ride?.fare !== 'number') return '--';
        return ride.fare.toLocaleString('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0
        }).replace('PKR', 'Rs');
    };

    if (!ride) {
        return (
            <div className="p-4 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-t-black rounded-full mx-auto mb-2"></div>
                <p>Loading ride details...</p>
            </div>
        );
    }

    return (
        <div className="relative bg-white rounded-t-lg p-4 shadow-lg">
            {/* Close button */}
            <button 
                className="p-1 text-center w-full absolute top-0 left-0"
                onClick={() => setFinishRidePanel(false)}
                aria-label="Close ride panel"
            >
                <i className="text-3xl text-gray-400 ri-arrow-down-wide-line hover:text-gray-600 transition-colors"></i>
            </button>

            <h3 className="text-2xl font-semibold mb-5 pt-8">Finish this Ride</h3>
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}
            
            {/* Passenger info */}
            <div className="flex items-center justify-between p-4 border-2 border-yellow-400 rounded-lg mt-4">
                <div className="flex items-center gap-3">
                    <img 
                        className="h-12 w-12 rounded-full object-cover"
                        src="https://i.pinimg.com/236x/af/26/28/af26280b0ca305be47df0b799ed1b12b.jpg" 
                        alt="Passenger"
                    />
                    <h2 className="text-lg font-medium">{getUserName()}</h2>
                </div>
                <h5 className="text-lg font-semibold">2.2 KM</h5>
            </div>

            {/* Ride details */}
            <div className="flex flex-col items-center gap-2 w-full mt-5">
                <div className="w-full">
                    <div className="flex items-center gap-5 p-3 border-b-2">
                        <i className="ri-map-pin-user-fill text-lg"></i>
                        <div>
                            <h3 className="text-lg font-medium">{getPickupLocation()}</h3>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-5 p-3 border-b-2">
                        <i className="ri-map-pin-2-fill text-lg"></i>
                        <div>
                            <h3 className="text-lg font-medium">{getDestination()}</h3>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-5 p-3">
                        <i className="ri-currency-line text-lg"></i>
                        <div>
                            <h3 className="text-lg font-medium">{getFare()}</h3>
                            <p className="text-sm -mt-1 text-gray-600">Cash</p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 w-full">
                    <button
                        onClick={endRide}
                        disabled={loading}
                        className={`w-full mt-5 flex text-lg justify-center ${
                            loading 
                                ? 'bg-gray-300 cursor-not-allowed' 
                                : 'bg-green-600 hover:bg-green-700'
                        } text-white font-semibold p-3 rounded-lg transition-colors`}
                    >
                        {loading ? 'Processing...' : 'Finish Ride'}
                    </button>
                </div>
            </div>
        </div>
    );
};

FinishRide.propTypes = {
    ride: PropTypes.shape({
        _id: PropTypes.string,
        user: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                fullname: PropTypes.shape({
                    firstname: PropTypes.string
                })
            })
        ]),
        pickup: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                address: PropTypes.string
            })
        ]),
        destination: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                address: PropTypes.string
            })
        ]),
        fare: PropTypes.number
    }),
    setFinishRidePanel: PropTypes.func.isRequired
};

FinishRide.defaultProps = {
    ride: null
};

export default FinishRide;