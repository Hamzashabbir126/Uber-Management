const axios = require('axios');

class GeoapifyService {
    constructor() {
        this.apiKey = process.env.GEOAPIFY_API_KEY || 'fcd72180115e422aaa0f0528667cb92d';
        this.baseUrl = 'https://api.geoapify.com/v1';
    }

    async geocodeAddress(address) {
        try {
            const url = `${this.baseUrl}/geocode/search?text=${encodeURIComponent(address)}&apiKey=${this.apiKey}`;
            console.log('Geoapify Geocode URL:', url);
            const response = await axios.get(url);
            if (response.data.features && response.data.features.length > 0) {
                const feature = response.data.features[0];
                console.log('Geoapify response:', feature);
                console.log('Geoapify response:', feature.geometry.coordinates);
                return {
                    latitude: feature.geometry.coordinates[1],
                    longitude: feature.geometry.coordinates[0],
                    address: feature.properties.formatted
                };
            }
            return null;
        } catch (error) {
            console.error('Geoapify geocode error:', error.message);
            return null;
        }
    }

    async reverseGeocode(lat, lon) {
        try {
            const url = `${this.baseUrl}/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${this.apiKey}`;
            const response = await axios.get(url);
            if (response.data.features && response.data.features.length > 0) {
                return response.data.features[0].properties.formatted;
            }
            return null;
        } catch (error) {
            console.error('Geoapify reverse geocode error:', error.message);
            return null;
        }
    }

    async searchPlaces(query) {
        try {
            const url = `${this.baseUrl}/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${this.apiKey}`;
            const response = await axios.get(url);
            if (response.data.features && response.data.features.length > 0) {
                return response.data.features.map(feature => ({
                    title: feature.properties.address_line1 || feature.properties.formatted,
                    address: feature.properties.address_line2 || '',
                    latitude: feature.geometry.coordinates[1],
                    longitude: feature.geometry.coordinates[0]
                }));
            }
            return [];
        } catch (error) {
            console.error('Geoapify autocomplete error:', error.message);
            return [];
        }
    }

    async getDirections(origin, destination) {
        try {
            // origin and destination: { ltd, lng } or { lat, lng }
            const lat1 = origin.ltd || origin.lat;
            const lon1 = origin.lng;
            const lat2 = destination.ltd || destination.lat;
            const lon2 = destination.lng;
            const waypoints = `${lat1},${lon1}|${lat2},${lon2}`;
            const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=drive&apiKey=${this.apiKey}`;
            console.log('Geoapify Routing URL:', url);
            const response = await axios.get(url);
            console.log('Geoapify Routing Response:', response.data);
            if (response.data.features && response.data.features.length > 0) {
                const props = response.data.features[0].properties;
                console.log('Routing Properties:', props);
                return {
                    distance: { value: props.distance, text: `${(props.distance / 1000).toFixed(1)} km` },
                    duration: { value: props.time, text: `${Math.round(props.time / 60)} mins` }
                };
            }
            return null;
        } catch (error) {
            console.error('Geoapify routing error:', error.message);
            return null;
        }
    }

    async getNearbyPlaces(lat, lon, radius = 5000) {
        try {
            // Use Geoapify Places API
            const url = `https://api.geoapify.com/v2/places?categories=service,commercial,entertainment,accommodation,activity&filter=circle:${lon},${lat},${radius}&limit=10&apiKey=${this.apiKey}`;
            const response = await axios.get(url);
            if (response.data.features && response.data.features.length > 0) {
                return response.data.features.map(feature => ({
                    title: feature.properties.name || feature.properties.address_line1 || feature.properties.formatted,
                    address: feature.properties.address_line2 || '',
                    latitude: feature.geometry.coordinates[1],
                    longitude: feature.geometry.coordinates[0]
                }));
            }
            return [];
        } catch (error) {
            console.error('Geoapify nearby places error:', error.message);
            return [];
        }
    }
}

module.exports = new GeoapifyService();
