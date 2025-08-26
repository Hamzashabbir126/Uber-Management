import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import Toast from './Toast';

const ConfirmRidePopUp = ({ ride, setConfirmRidePopupPanel }) => {
    const navigate = useNavigate();
    const { socket } = useContext(SocketContext);

    // Add this useEffect to listen for ride completion events
    useEffect(() => {
        if (socket && ride) {
            console.log(`[ConfirmRidePopUp] Setting up ride-completed listener for ride: ${ride._id}`);
            
            const handleRideCompleted = (data) => {
                console.log('[ConfirmRidePopUp] Ride completed event received:', data);
                
                // Show completion notification
                const completionMessage = document.createElement('div');
                completionMessage.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg bg-green-500 text-white text-center w-10/12 mx-auto';
                completionMessage.innerHTML = `
                    <div class="flex flex-col items-center">
                        <span class="text-xl mb-2">✓</span>
                        <span class="font-medium">Ride completed!</span>
                        <span class="text-sm mt-1">Redirecting to rating page...</span>
                    </div>
                `;
                document.body.appendChild(completionMessage);
                
                // Navigate to rating page after a short delay
                setTimeout(() => {
                    document.body.removeChild(completionMessage);
                    // Use a real ride object for the rating page
                    const rideData = data.ride || ride;
                    navigate('/ride-complete', { state: { ride: rideData } });
                }, 3000);
            };
            
            // Add event listener
            socket.on('ride-completed', handleRideCompleted);
            
            // Clean up event listener
            return () => {
                console.log('[ConfirmRidePopUp] Cleaning up ride-completed listener');
                socket.off('ride-completed', handleRideCompleted);
            };
        }
    }, [socket, ride, navigate]);

    if (!ride) {
        return (
            <div className="p-4 text-center">
                <p>No ride details available</p>
                <button 
                    onClick={() => setConfirmRidePopupPanel(false)}
                    className="mt-4 px-4 py-2 bg-gray-200 rounded-lg"
                >
                    Close
                </button>
            </div>
        );
    }

    // Safely extract ride data
    const pickupAddress = typeof ride.pickup === 'object' ? ride.pickup.address : String(ride.pickup || 'Pickup location');
    const destinationAddress = typeof ride.destination === 'object' ? ride.destination.address : String(ride.destination || 'Destination');
    const userName = ride.user?.fullname?.firstname || 'User';
    const fareAmount = ride.fare || 0;

    // Format currency if needed
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <button
                onClick={() => setConfirmRidePopupPanel(false)}
                className="p-1 text-center w-full mb-4"
            >
                <i className="text-3xl text-gray-400 ri-arrow-down-wide-line"></i>
            </button>

            <h2 className="text-2xl font-semibold mb-6">Ride Confirmed!</h2>

            <div className="flex items-center justify-between p-4 border rounded-lg mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <i className="ri-user-3-line text-xl"></i>
                    </div>
                    <h3 className="font-medium">{userName}</h3>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Fare</p>
                    <p className="font-semibold">{formatCurrency(fareAmount)}</p>
                </div>
            </div>

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
            </div>

            <div className="mt-auto">
                <button
                    onClick={() => navigate('/confirm-ride-details', { state: { ride } })}
                    className="w-full py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800"
                >
                    Start Navigation
                </button>
            </div>
        </div>
    );
};

export default ConfirmRidePopUp;