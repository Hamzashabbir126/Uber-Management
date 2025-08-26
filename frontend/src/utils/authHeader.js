import axios from 'axios';

// Helper function to get auth header for API calls
export const getAuthHeader = () => {
  try {
    const token = localStorage.getItem('token');
    
    // If token doesn't exist or is empty
    if (!token) {
      console.log('No authentication token found');
      return null;
    }
    
    // Check if token is a string and has the startsWith method
    if (typeof token === 'string') {
      return {
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`
      };
    } else {
      // Handle non-string tokens
      console.log('Token is not a string:', typeof token);
      return {
        Authorization: `Bearer ${token}`
      };
    }
  } catch (error) {
    console.error('Error getting auth header:', error);
    return null;
  }
};

// API utility methods that use the getAuthHeader function
export const api = {
  get: async (url) => {
    try {
      const headers = getAuthHeader();
      if (!headers) {
        // Return a default response for unauthenticated requests
        // instead of throwing an error
        return { data: null, status: 401 };
      }
      return await axios.get(url, { headers });
    } catch (error) {
      console.error(`API GET error for ${url}:`, error);
      throw error;
    }
  },
  
  post: async (url, data) => {
    try {
      const headers = getAuthHeader();
      if (!headers) {
        console.error("No authentication token available for POST request to", url);
        throw new Error("Authentication required");
      }
      
      console.log(`Sending POST request to ${url} with data:`, data);
      const response = await axios.post(url, data, { headers });
      console.log(`Response from ${url}:`, response.data);
      
      return response;
    } catch (error) {
      console.error(`API POST error for ${url}:`, error);
      throw error;
    }
  },
  
  put: async (url, data) => {
    try {
      const headers = getAuthHeader();
      if (!headers) {
        return { data: null, status: 401 };
      }
      return await axios.put(url, data, { headers });
    } catch (error) {
      console.error(`API PUT error for ${url}:`, error);
      throw error;
    }
  },
  
  delete: async (url) => {
    try {
      const headers = getAuthHeader();
      if (!headers) {
        return { data: null, status: 401 };
      }
      return await axios.delete(url, { headers });
    } catch (error) {
      console.error(`API DELETE error for ${url}:`, error);
      throw error;
    }
  }
};

// Add a utility function to directly get the token in the format needed
export const getAuthToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    return typeof token === 'string' 
      ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`)
      : `Bearer ${token}`;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Add a utility function to check if a user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Utility functions for formatting and data handling
export const formatDistance = (distance) => {
  if (!distance) return "0 km";
  if (typeof distance === "string") return distance;
  return distance.text || "0 km";
};

export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

export const formatTime = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  } catch (error) {
    console.error("Error formatting time:", error);
    return "Invalid time";
  }
};

export const getAddressSafely = (location) => {
  if (!location) return "Location not specified";
  if (typeof location === "string") return location;
  return location.address || location.title || "Location not specified";
};