const mapboxService = require('./services/mapbox.service');

async function testMapbox() {
    console.log('Testing Mapbox integration...');
    
    try {
        // Test geocoding
        console.log('\n1. Testing geocoding...');
        const geocodeResult = await mapboxService.geocodeAddress('Lahore, Pakistan');
        console.log('Geocoding result:', JSON.stringify(geocodeResult, null, 2));
        
        // Test search places
        console.log('\n2. Testing search places...');
        const searchResults = await mapboxService.searchPlaces('Lahore');
        console.log('Search results:', JSON.stringify(searchResults, null, 2));
        
        // Test directions
        console.log('\n3. Testing directions...');
        const directionsResult = await mapboxService.getDirections('74.3587,31.5204', '74.3529,31.5202');
        console.log('Directions result:', JSON.stringify(directionsResult, null, 2));
        
        // Test nearby places
        console.log('\n4. Testing nearby places...');
        const nearbyResults = await mapboxService.getNearbyPlaces(31.5204, 74.3587, 5000);
        console.log('Nearby results:', JSON.stringify(nearbyResults, null, 2));
        
        // Test place by coordinates
        console.log('\n5. Testing place by coordinates...');
        const coordResults = await mapboxService.getPlaceByCoordinates(31.5204, 74.3587);
        console.log('Coordinate results:', JSON.stringify(coordResults, null, 2));
        
        console.log('\n✅ All Mapbox tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Error testing Mapbox:', error.message);
    }
}

testMapbox(); 