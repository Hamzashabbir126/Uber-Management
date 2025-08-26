import React from 'react'

const LookingForDriver = (props) => {
    // Extract values and provide fallbacks
    const pickup = typeof props.pickup === 'object' ? props.pickup.title : props.pickup || '';
    const destination = typeof props.destination === 'object' ? props.destination.title : props.destination || '';
    const fare = props.fare && props.vehicleType ? props.fare[props.vehicleType] : '-';
    const distance = props.distance?.text || '-';
    const duration = props.duration?.text || '-';

    return (
        <div>
            <h3 className='text-2xl font-semibold mb-5'>Looking for nearby drivers</h3>
            <div className='flex gap-4 border-2 p-3 rounded-xl items-center justify-start'>
                <h2 className='bg-[#eee] h-12 flex items-center justify-center w-12 rounded-full'><i className="ri-map-pin-fill"></i></h2>
                <div>
                    <h4 className='font-medium'>{pickup}</h4>
                    <h4 className='font-medium'>{destination}</h4>
                </div>
            </div>
            <div className='flex items-center justify-between mt-5'>
                <div>
                    <h2 className='font-medium text-lg'>Distance</h2>
                    <p className='text-sm text-gray-500'>{distance}</p>
                </div>
                <div>
                    <h2 className='font-medium text-lg'>Time</h2>
                    <p className='text-sm text-gray-500'>{duration}</p>
                </div>
                <div>
                    <h2 className='font-medium text-lg'>Fare</h2>
                    <p className='text-sm text-gray-500'>Rs {fare}</p>
                </div>
            </div>
            <div className='flex justify-center mt-8'>
                <div className='animate-spin h-12 w-12 border-4 border-t-black rounded-full'></div>
            </div>
        </div>
    )
}

export default LookingForDriver