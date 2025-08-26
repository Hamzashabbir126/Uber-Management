const serpapiService = require('./services/serpapi.service');

async function testSerpAPI() {
    console.log('Testing SerpAPI integration...');
    
    try {
        // Test search places
        console.log('\n1. Testing search places...');
        const searchResults = await serpapiService.searchPlaces('bahawalpur');
        console.log('Search results:', JSON.stringify(searchResults, null, 2));
        
        // Test nearby places
        console.log('\n2. Testing nearby places...');
        const nearbyResults = await serpapiService.getNearbyPlaces(29.3957, 71.6833, 5000);
        console.log('Nearby results:', JSON.stringify(nearbyResults, null, 2));
        
        // Test place by coordinates
        console.log('\n3. Testing place by coordinates...');
        const coordResults = await serpapiService.getPlaceByCoordinates(29.3957, 71.6833);
        console.log('Coordinate results:', JSON.stringify(coordResults, null, 2));
        
        console.log('\n✅ All SerpAPI tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Error testing SerpAPI:', error.message);
    }
}

testSerpAPI(); 