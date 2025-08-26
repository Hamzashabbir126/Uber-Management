const express = require('express');
const router = express.Router();
const geoapifyService = require('../services/geoapify.service');
const { authUser } = require('../middlewares/auth.middleware');

router.use(authUser);

// Autocomplete
router.get('/search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Missing query' });
    try {
        const results = await geoapifyService.searchPlaces(query);
        res.json({ suggestions: results });
    } catch (e) {
        res.status(500).json({ error: 'Geoapify search error' });
    }
});

// Geocode
router.get('/geocode', async (req, res) => {
    const { address } = req.query;
    if (!address) return res.status(400).json({ error: 'Missing address' });
    try {
        const result = await geoapifyService.geocodeAddress(address);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: 'Geoapify geocode error' });
    }
});

// Reverse geocode
router.get('/reverse', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon' });
    try {
        const result = await geoapifyService.reverseGeocode(lat, lon);
        res.json({ address: result });
    } catch (e) {
        res.status(500).json({ error: 'Geoapify reverse geocode error' });
    }
});

// Directions
router.get('/directions', async (req, res) => {
    const { originLat, originLng, destLat, destLng } = req.query;
    if (!originLat || !originLng || !destLat || !destLng) return res.status(400).json({ error: 'Missing coordinates' });
    try {
        const result = await geoapifyService.getDirections(
            { lat: originLat, lng: originLng },
            { lat: destLat, lng: destLng }
        );
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: 'Geoapify directions error' });
    }
});

// Nearby places
router.get('/nearby', async (req, res) => {
    const { lat, lon, radius } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon' });
    try {
        const results = await geoapifyService.getNearbyPlaces(lat, lon, radius);
        res.json({ places: results });
    } catch (e) {
        res.status(500).json({ error: 'Geoapify nearby error' });
    }
});

module.exports = router;
