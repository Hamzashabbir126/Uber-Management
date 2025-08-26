import React from 'react';
import PropTypes from 'prop-types';

const VehiclePanel = ({ 
    fare = {},
    distance = { text: '--' },
    duration = { text: '--' },
    selectVehicle,
    setConfirmRidePanel,
    setVehiclePanel 
}) => {
    // Normalize fare data structure
    const normalizeFares = (fareData) => {
        if (!fareData) return {};
        
        // Handle number input
        if (typeof fareData === 'number') {
            return {
                car: fareData,
                bike: Math.round(fareData * 0.7),
                auto: Math.round(fareData * 0.8)
            };
        }
        
        // Handle nested fare object
        if (fareData.fare && typeof fareData.fare === 'object') {
            return fareData.fare;
        }
        
        // Default case
        return fareData;
    };

    const fares = normalizeFares(fare);
    
    // Loading state if fares aren't available
    if (!fares || Object.keys(fares).length === 0) {
        return (
            <div className="p-4">
                <div className="animate-spin h-8 w-8 border-4 border-t-black rounded-full mx-auto mb-2"></div>
                <p className="text-center">Calculating fares...</p>
            </div>
        );
    }

    // Vehicle options configuration
    const vehicleOptions = [
        {
            type: 'car',
            name: 'UberGo Car',
            capacity: 4,
            image: 'https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg',
            description: 'Affordable, compact rides',
            eta: '2 mins away',
            multiplier: 1
        },
        {
            type: 'bike',
            name: 'Moto',
            capacity: 1,
            image: 'https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_638,w_956/v1649231091/assets/2c/7fa194-c954-49b2-9c6d-a3b8601370f5/original/Uber_Moto_Orange_312x208_pixels_Mobile.png',
            description: 'Affordable motorcycle rides',
            eta: '3 mins away',
            multiplier: 0.7
        },
        {
            type: 'auto',
            name: 'UberAuto',
            capacity: 3,
            image: 'https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_368,w_552/v1648431773/assets/1d/db8c56-0204-4ce4-81ce-56a11a07fe98/original/Uber_Auto_558x372_pixels_Desktop.png',
            description: 'Affordable Auto rides',
            eta: '3 mins away',
            multiplier: 0.8
        }
    ];

    const handleVehicleSelect = (vehicleType) => {
        selectVehicle(vehicleType);
        setConfirmRidePanel(true);
        setVehiclePanel(false);
    };

    // Format currency for display
    const formatPrice = (amount) => {
        if (typeof amount !== 'number') return '--';
        return amount.toLocaleString('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).replace('PKR', 'Rs');
    };

    // Render individual vehicle option
    const renderVehicleOption = (option) => {
        const price = fares[option.type] || 
                     (fares.car ? Math.round(fares.car * option.multiplier) : null);
        
        return (
            <div 
                key={option.type}
                onClick={() => handleVehicleSelect(option.type)}
                className="flex border-2 border-gray-200 active:border-black mb-3 rounded-xl w-full p-3 items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
            >
                <img 
                    className="h-10 w-10 object-contain" 
                    src={option.image} 
                    alt={option.name} 
                    loading="lazy"
                />
                <div className="ml-2 w-1/2">
                    <h4 className="font-medium text-base">
                        {option.name} <span className="ml-1"><i className="ri-user-3-fill"></i>{option.capacity}</span>
                    </h4>
                    <h5 className="font-medium text-sm text-gray-700">{option.eta}</h5>
                    <p className="font-normal text-xs text-gray-500">{option.description}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-lg font-semibold">
                        {formatPrice(price)}
                    </h2>
                    <div className="text-xs text-gray-500">
                        {distance.text} • {duration.text}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="relative bg-white rounded-t-lg p-4 shadow-lg">
            {/* Close button */}
            <button 
                className="p-1 text-center w-full absolute top-0 left-0" 
                onClick={() => setVehiclePanel(false)}
                aria-label="Close vehicle panel"
            >
                <i className="text-3xl text-gray-400 ri-arrow-down-wide-line hover:text-gray-600 transition-colors"></i>
            </button>

            <h3 className="text-2xl font-semibold mb-5 pt-8">Choose a Vehicle</h3>

            {/* Render all vehicle options */}
            {vehicleOptions.map(renderVehicleOption)}
        </div>
    );
};

VehiclePanel.propTypes = {
    fare: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.shape({
            car: PropTypes.number,
            bike: PropTypes.number,
            auto: PropTypes.number,
            fare: PropTypes.shape({
                car: PropTypes.number,
                bike: PropTypes.number,
                auto: PropTypes.number
            })
        })
    ]),
    distance: PropTypes.shape({
        text: PropTypes.string
    }),
    duration: PropTypes.shape({
        text: PropTypes.string
    }),
    selectVehicle: PropTypes.func.isRequired,
    setConfirmRidePanel: PropTypes.func.isRequired,
    setVehiclePanel: PropTypes.func.isRequired
};

export default VehiclePanel;