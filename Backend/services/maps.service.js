const axios = require('axios');
const captainModel = require('../models/captain.model');
const geoapifyService = require('./geoapify.service');

module.exports.getAddressCoordinate = async (address) => {
    try {
        // Use Geoapify service for geocoding
        const result = await geoapifyService.geocodeAddress(address);
        if (result) {
            return {
                ltd: result.latitude,
                lng: result.longitude
            };
        }
        // Fallback to default coordinates if no results
        console.warn('No coordinates found for address, using default coordinates');
        return {
            ltd: 29.3957,
            lng: 71.6833
        };
    } catch (error) {
        console.error('Error getting coordinates from Geoapify:', error.message);
        return {
            ltd: 29.3957,
            lng: 71.6833
        };
    }
}

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }
    try {
        // If origin/destination are objects with lat/lng or latitude/longitude, use them directly
        let originCoord = origin;
        let destinationCoord = destination;
        if (typeof origin === 'string') {
            const geo = await geoapifyService.geocodeAddress(origin);
            console.log('Origin Geoapify response:', geo);

            if (!geo) throw new Error('Could not geocode origin');
            originCoord = { lat: geo.latitude, lng: geo.longitude };
        } else if (origin.latitude && origin.longitude) {
            originCoord = { lat: origin.latitude, lng: origin.longitude };
        } else if (origin.ltd && origin.lng) {
            originCoord = { lat: origin.ltd, lng: origin.lng };
        }
        if (typeof destination === 'string') {
            const geo = await geoapifyService.geocodeAddress(destination);
            console.log('Destination Geoapify response:', geo);
            if (!geo) throw new Error('Could not geocode destination');
            destinationCoord = { lat: geo.latitude, lng: geo.longitude };
        } else if (destination.latitude && destination.longitude) {
            destinationCoord = { lat: destination.latitude, lng: destination.longitude };
        } else if (destination.ltd && destination.lng) {
            destinationCoord = { lat: destination.ltd, lng: destination.lng };
        }
        
        console.log('Origin Coord:', originCoord);
        console.log('Destination Coord:', destinationCoord);
        
        // Use Geoapify service for distance and time calculation
        const result = await geoapifyService.getDirections(originCoord, destinationCoord);
        if (result) {
            return {
                distance: result.distance,
                duration: result.duration
            };
        }
        // Fallback to default values if no route found
        console.warn('No route found, using default distance/time data');
        return {
            distance: { value: 5000, text: '5.0 km' },
            duration: { value: 900, text: '15 mins' }
        };
    } catch (error) {
        console.error('Error getting distance/time from Geoapify:', error.message);
        return {
            distance: { value: 5000, text: '5.0 km' },
            duration: { value: 900, text: '15 mins' }
        };
    }
}

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('query is required');
    }
    try {
        // Use Geoapify service for autocomplete suggestions
        const results = await geoapifyService.searchPlaces(input);
        if (results && results.length > 0) {
            // Extract suggestions from Geoapify results
            const suggestions = results.map(result => {
                const address = result.address || '';
                const title = result.title || '';
                return `${title}${address ? ` - ${address}` : ''}`;
            }).filter(suggestion => suggestion.trim() !== '');
            return suggestions.slice(0, 5); // Return top 5 suggestions
        }
        // Return empty array if no results
        console.warn('No suggestions found');
        return [];
    } catch (error) {
        console.error('Error getting suggestions from Geoapify:', error.message);
        return [];
    }
}

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {
    // radius in km
    const captains = await captainModel.find({
        location: {
            $geoWithin: {
                $centerSphere: [ [ ltd, lng ], radius / 6371 ]
            }
        }
    });
    return captains;
}