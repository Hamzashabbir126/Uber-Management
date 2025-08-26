// Ride state management utility
export const rideManager = {
  // Store active ride
  setActiveRide: (ride) => {
    console.log('rideManager.setActiveRide - input ride:', ride);
    if (ride) {
      const rideString = JSON.stringify(ride);
      console.log('rideManager.setActiveRide - storing in localStorage:', rideString);
      localStorage.setItem('activeRide', rideString);
    } else {
      console.log('rideManager.setActiveRide - clearing localStorage');
      localStorage.removeItem('activeRide');
    }
  },

  // Get active ride
  getActiveRide: () => {
    try {
      const ride = localStorage.getItem('activeRide');
      console.log('rideManager.getActiveRide - raw localStorage value:', ride);
      if (ride) {
        const parsedRide = JSON.parse(ride);
        console.log('rideManager.getActiveRide - parsed ride:', parsedRide);
        return parsedRide;
      }
      return null;
    } catch (e) {
      console.error('Error parsing active ride:', e);
      localStorage.removeItem('activeRide');
      return null;
    }
  },

  // Update ride status
  updateRideStatus: (rideId, status, additionalData = {}) => {
    try {
      const currentRide = rideManager.getActiveRide();
      if (currentRide && currentRide._id === rideId) {
        const updatedRide = { ...currentRide, status, ...additionalData };
        rideManager.setActiveRide(updatedRide);
        return updatedRide;
      }
    } catch (e) {
      console.error('Error updating ride status:', e);
    }
    return null;
  },

  // Clear ride data
  clearRide: () => {
    localStorage.removeItem('activeRide');
  },

  // Check if user has active ride
  hasActiveRide: () => {
    const ride = rideManager.getActiveRide();
    console.log('rideManager.hasActiveRide - ride:', ride, 'status:', ride?.status);
    return ride && ['pending', 'confirmed', 'started', 'waiting_for_rating'].includes(ride.status);
  },

  // Get ride status
  getRideStatus: () => {
    const ride = rideManager.getActiveRide();
    console.log('rideManager.getRideStatus - ride:', ride, 'status:', ride?.status);
    return ride ? ride.status : null;
  }
};

export default rideManager;
