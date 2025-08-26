import React from 'react'

/*
onClick={() => {
  if (props.activeField === 'pickup') {
    props.setPickup(suggestion); // full object
  } else {
    props.setDestination(suggestion);
  }
  props.setPanelOpen(false);
}}
*/

const LocationSearchPanel = ({ suggestions, setVehiclePanel, setPanelOpen, setPickup, setDestination, activeField }) => {
    const handleSuggestionClick = (suggestion) => {
        if (activeField === 'pickup') {
            setPickup(suggestion);
        } else if (activeField === 'destination') {
            setDestination(suggestion);
        }
        setPanelOpen(false);
    }

    // Ensure suggestions is an array and has items
    const validSuggestions = Array.isArray(suggestions) ? suggestions : [];

    return (
        <div>
            {/* Display fetched suggestions */}
            {validSuggestions.length > 0 ? (
                validSuggestions.map((elem, idx) => (
                    <div key={idx} onClick={() => handleSuggestionClick(elem)} className='flex gap-4 border-2 p-3 border-gray-50 active:border-black rounded-xl items-center my-2 justify-start'>
                        <h2 className='bg-[#eee] h-8 flex items-center justify-center w-12 rounded-full'><i className="ri-map-pin-fill"></i></h2>
                        <div>
                            <h4 className='font-medium'>{elem.title}</h4>
                            {elem.address && <div className='text-xs text-gray-500'>{elem.address}</div>}
                        </div>
                    </div>
                ))
            ) : (
                <div className='text-center py-4 text-gray-500'>
                    <p>No suggestions available</p>
                </div>
            )}
        </div>
    )
}

export default LocationSearchPanel