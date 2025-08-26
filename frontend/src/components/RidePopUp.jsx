import React from 'react';

const RidePopUp = ({ ride, setRidePopupPanel, confirmRide, loading, error }) => {
    if (!ride) {
        return (
            <div className="p-4 text-center">
                <p>No ride details available</p>
                <button 
                    onClick={() => setRidePopupPanel(false)}
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
    const distance = typeof ride.distance === 'object' ? ride.distance.text : '0 km';
    const duration = typeof ride.duration === 'object' ? ride.duration.text : '0 min';

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
        <div className="p-6">
            <button
                onClick={() => setRidePopupPanel(false)}
                className="p-1 text-center w-full mb-4"
            >
                <i className="text-3xl text-gray-400 ri-arrow-down-wide-line"></i>
            </button>

            <h2 className="text-2xl font-semibold mb-6">New Ride Request</h2>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center">
                    <i className="ri-user-3-line text-xl"></i>
                </div>
                <div>
                    <h3 className="text-lg font-medium">{userName}</h3>
                    <div className="flex items-center text-yellow-400">
                        <span>★★★★★</span>
                        <span className="text-gray-500 ml-1">5.0</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4 mb-6 border-t border-b py-4">
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

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                    <p className="text-sm text-gray-500">Distance</p>
                    <p className="font-semibold">{distance}</p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-semibold">{duration}</p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-500">Fare</p>
                    <p className="font-semibold">{formatCurrency(fareAmount)}</p>
                </div>
            </div>

            <button
                onClick={confirmRide}
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold ${
                    loading
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-gray-800'
                }`}
            >
                {loading ? 'Processing...' : 'Accept Ride'}
            </button>
        </div>
    );
};

export default RidePopUp;