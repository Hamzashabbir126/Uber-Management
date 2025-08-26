const axios = require('axios');

class SerpAPIService {
    constructor() {
        this.apiKey = process.env.SERP_API_KEY || '4b1913fc498cd28f7f9e98d9707f8d10';
        this.baseUrl = 'https://serpapi.com/search.json';
    }

    async searchPlaces(query) {
        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    engine: 'google_maps',
                    q: query,
                    type: 'search',
                    api_key: this.apiKey
                }
            });
            return response.data;
        } catch (error) {
            console.error('SerpAPI search error:', error.message);
            // Return mock data if API fails
            return {
                local_results: [
                    {
                        title: 'University chock Bahawalpur',
                        address: 'Bahawalpur, Punjab, Pakistan',
                        gps_coordinates: { latitude: 29.3957, longitude: 71.6833 }
                    },
                    {
                        title: 'Baghdad campus IUB',
                        address: 'Bahawalpur, Punjab, Pakistan',
                        gps_coordinates: { latitude: 29.3957, longitude: 71.6833 }
                    },
                    {
                        title: 'Chock fawara Bahawalpur',
                        address: 'Bahawalpur, Punjab, Pakistan',
                        gps_coordinates: { latitude: 29.3957, longitude: 71.6833 }
                    }
                ]
            };
        }
    }

    async getPlaceDetails(placeId) {
        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    engine: 'google_maps',
                    place_id: placeId,
                    api_key: this.apiKey
                }
            });
            return response.data;
        } catch (error) {
            console.error('SerpAPI place details error:', error.message);
            return {
                place_results: {
                    title: 'Mock Place',
                    address: 'Bahawalpur, Punjab, Pakistan',
                    gps_coordinates: { latitude: 29.3957, longitude: 71.6833 }
                }
            };
        }
    }

    async getPlaceByCoordinates(latitude, longitude) {
        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    engine: 'google_maps',
                    ll: `@${latitude},${longitude},15z`,
                    type: 'search',
                    api_key: this.apiKey
                }
            });
            return response.data;
        } catch (error) {
            console.error('SerpAPI coordinates search error:', error.message);
            return {
                local_results: [
                    {
                        title: 'Nearby Location',
                        address: 'Bahawalpur, Punjab, Pakistan',
                        gps_coordinates: { latitude: 29.3957, longitude: 71.6833 }
                    }
                ]
            };
        }
    }

    async getNearbyPlaces(latitude, longitude, radius = 5000) {
        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    engine: 'google_maps',
                    q: 'nearby places',
                    ll: `@${latitude},${longitude},${radius}z`,
                    type: 'search',
                    api_key: this.apiKey
                }
            });
            return response.data;
        } catch (error) {
            console.error('SerpAPI nearby places error:', error.message);
            // Return mock nearby places if API key is invalid
            const mockPlaces = [
                {
                    title: 'Coffee Shop',
                    address: 'Nearby location',
                    gps_coordinates: { 
                        latitude: latitude + (Math.random() - 0.5) * 0.01, 
                        longitude: longitude + (Math.random() - 0.5) * 0.01 
                    }
                },
                {
                    title: 'Restaurant',
                    address: 'Nearby location',
                    gps_coordinates: { 
                        latitude: latitude + (Math.random() - 0.5) * 0.01, 
                        longitude: longitude + (Math.random() - 0.5) * 0.01 
                    }
                },
                {
                    title: 'Gas Station',
                    address: 'Nearby location',
                    gps_coordinates: { 
                        latitude: latitude + (Math.random() - 0.5) * 0.01, 
                        longitude: longitude + (Math.random() - 0.5) * 0.01 
                    }
                }
            ];
            return { local_results: mockPlaces };
        }
    }
}

module.exports = new SerpAPIService(); 