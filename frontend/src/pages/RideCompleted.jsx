import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const RideCompleted = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [ride] = useState(location.state?.ride);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // If no ride data, redirect to home
    React.useEffect(() => {
        if (!ride) {
            navigate('/');
        }
    }, [ride, navigate]);

    // Submit rating
    const handleSubmitRating = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/rides/rate`,
                {
                    rideId: ride._id,
                    rating,
                    comment
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            
            if (response.data) {
                setSuccess(true);
                // Redirect after short delay
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            setError('Failed to submit rating. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
    const captainName = ride.captain?.fullname?.firstname || 'Your driver';
    const fareAmount = ride.fare || 0;
    const pickupAddress = typeof ride.pickup === 'object' ? ride.pickup.address : String(ride.pickup || 'Pickup location');
    const destinationAddress = typeof ride.destination === 'object' ? ride.destination.address : String(ride.destination || 'Destination');

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                {success ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="ri-check-line text-3xl"></i>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
                        <p className="text-gray-600 mb-4">Your rating has been submitted.</p>
                        <p className="text-gray-500">Redirecting to home...</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="ri-taxi-line text-3xl"></i>
                            </div>
                            <h2 className="text-2xl font-bold">Ride Completed</h2>
                            <p className="text-gray-600">How was your trip?</p>
                        </div>
                        
                        {/* Trip details */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Trip fare</span>
                                <span className="font-semibold">{formatCurrency(fareAmount)}</span>
                            </div>
                            <div className="flex items-start gap-2 mb-2">
                                <i className="ri-map-pin-line text-green-500 mt-1"></i>
                                <div>
                                    <p className="text-xs text-gray-500">From</p>
                                    <p className="text-sm">{pickupAddress}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <i className="ri-flag-line text-red-500 mt-1"></i>
                                <div>
                                    <p className="text-xs text-gray-500">To</p>
                                    <p className="text-sm">{destinationAddress}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Captain details */}
                        <div className="mb-6">
                            <p className="text-sm text-gray-600 mb-2">Rate your captain</p>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                    <i className="ri-user-3-line text-xl"></i>
                                </div>
                                <p className="font-medium">{captainName}</p>
                            </div>
                            
                            {/* Rating stars */}
                            <div className="flex justify-center gap-2 mb-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className="text-3xl focus:outline-none"
                                    >
                                        {star <= rating ? (
                                            <i className="ri-star-fill text-yellow-400"></i>
                                        ) : (
                                            <i className="ri-star-line text-gray-300"></i>
                                        )}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Comment */}
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a comment (optional)"
                                className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                rows="3"
                            ></textarea>
                        </div>
                        
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                                {error}
                            </div>
                        )}
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
                            >
                                Skip
                            </button>
                            <button
                                onClick={handleSubmitRating}
                                disabled={loading}
                                className={`flex-1 py-3 rounded-lg font-semibold ${
                                    loading
                                        ? 'bg-blue-300 text-blue-800'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                            >
                                {loading ? 'Submitting...' : 'Submit Rating'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RideCompleted;