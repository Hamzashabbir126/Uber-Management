import React from 'react';

const ConfirmRide = ({ onConfirm, fare, distance, duration, selectedVehicle }) => {
    const handleConfirmRide = async () => {
        try {
            await onConfirm();
        } catch (error) {
            console.error('Error in confirm ride:', error);
        }
    };

    // Safe fare calculation with type checking
    const calculateFare = () => {
        if (!fare || typeof fare !== 'object') return '-';
        
        const vehicleFares = {
            car: fare.car,
            moto: fare.moto,
            auto: fare.auto
        };

        return vehicleFares[selectedVehicle] || '-';
    };

    return (
        <div className="p-4">
            <div className="ride-details space-y-3">
                <h3 className="text-xl font-semibold mb-4">Confirm Your Ride</h3>
                
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Vehicle Type:</span>
                    <span className="font-medium capitalize">{selectedVehicle || '-'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Fare:</span>
                    <span className="font-medium">Rs. {calculateFare()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Distance:</span>
                    <span className="font-medium">{distance?.text || '-'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{duration?.text || '-'}</span>
                </div>
            </div>
            
            <button 
                onClick={handleConfirmRide}
                className="w-full mt-6 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
                Confirm Ride
            </button>
        </div>
    );
};

export default ConfirmRide;