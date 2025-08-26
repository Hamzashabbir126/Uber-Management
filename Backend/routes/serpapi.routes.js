const express = require('express');
const router = express.Router();
const serpapiService = require('../services/serpapi.service');
const { authUser } = require('../middlewares/auth.middleware');

// Apply auth middleware to all routes
router.use(authUser);

// Search places
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }
        
        const results = await serpapiService.searchPlaces(q);
        res.json(results);
    } catch (error) {
        console.error('SerpAPI search error:', error);
        res.status(500).json({ error: 'Failed to search places' });
    }
});

// Get place details by place_id
router.get('/place/:placeId', async (req, res) => {
    try {
        const { placeId } = req.params;
        const results = await serpapiService.getPlaceDetails(placeId);
        res.json(results);
    } catch (error) {
        console.error('SerpAPI place details error:', error);
        res.status(500).json({ error: 'Failed to get place details' });
    }
});

// Get place by coordinates
router.get('/coordinates', async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }
        
        const results = await serpapiService.getPlaceByCoordinates(lat, lng);
        res.json(results);
    } catch (error) {
        console.error('SerpAPI coordinates error:', error);
        res.status(500).json({ error: 'Failed to get place by coordinates' });
    }
});

// Get nearby places
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 5000 } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }
        
        const results = await serpapiService.getNearbyPlaces(lat, lng, radius);
        res.json(results);
    } catch (error) {
        console.error('SerpAPI nearby places error:', error);
        res.status(500).json({ error: 'Failed to get nearby places' });
    }
});

module.exports = router; 