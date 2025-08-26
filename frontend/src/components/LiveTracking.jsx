import React, { useEffect, useRef, useState, useContext } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { SocketContext } from '../context/SocketContext';

// Replace with a valid Mapbox token
// Get a valid token from https://account.mapbox.com/access-tokens/
mapboxgl.accessToken = 'pk.eyJ1IjoiamFtYWxpaGFzc2FuMDMwNyIsImEiOiJjbWUweXptZzAwYnM5Mmlxdzg1Z2ljOWhrIn0.Z75BfIE30m6f3UuEFuYF7A';

const LiveTracking = ({ ride, userType }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [locationPermission, setLocationPermission] = useState(false);
    const { socket } = useContext(SocketContext);
    const [captainLocation, setCaptainLocation] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const captainMarker = useRef(null);
    const userMarker = useRef(null);
    const [showPermissionPrompt, setShowPermissionPrompt] = useState(true);
    const [mapError, setMapError] = useState(null);
    
    // Improved location permission request
    const requestLocationPermission = () => {
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by this browser.');
            setLocationPermission(false);
            setShowPermissionPrompt(true);
            return;
        }
        
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('Location permission granted', position);
                setLocationPermission(true);
                setShowPermissionPrompt(false);
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                console.error('Error getting location:', error);
                setLocationPermission(false);
                setShowPermissionPrompt(true);
            },
            options
        );
    };
    
    // Request location on component mount
    useEffect(() => {
        requestLocationPermission();
    }, []);
    
    // Initialize map with error handling
    useEffect(() => {
        if (!map.current && mapContainer.current && !showPermissionPrompt) {
            try {
                // Default center if no location data available
                let center = [77.2090, 28.6139]; // Delhi
                
                // Use user location if available
                if (userLocation) {
                    center = [userLocation.lng, userLocation.lat];
                }
                // Use ride pickup location if available
                else if (ride?.pickup && typeof ride.pickup === 'object' && 
                         ride.pickup.longitude && ride.pickup.latitude) {
                    center = [ride.pickup.longitude, ride.pickup.latitude];
                }
                
                // Create map instance with error handling
                map.current = new mapboxgl.Map({
                    container: mapContainer.current,
                    style: 'mapbox://styles/mapbox/streets-v11',
                    center,
                    zoom: 12
                });
                
                // Add error handling for map
                map.current.on('error', (e) => {
                    console.error('Map error:', e.error);
                    setMapError(e.error.message || 'Error loading map');
                });
                
                map.current.on('load', () => {
                    console.log('Map loaded successfully');
                    
                    // Add navigation control
                    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
                    
                    // Add markers for pickup and destination
                    if (ride?.pickup && typeof ride.pickup === 'object' && 
                        ride.pickup.longitude && ride.pickup.latitude) {
                        new mapboxgl.Marker({ color: '#22c55e' })
                            .setLngLat([ride.pickup.longitude, ride.pickup.latitude])
                            .setPopup(new mapboxgl.Popup().setHTML(`<p>Pickup: ${ride.pickup.address || 'Pickup location'}</p>`))
                            .addTo(map.current);
                    }
                    
                    if (ride?.destination && typeof ride.destination === 'object' && 
                        ride.destination.longitude && ride.destination.latitude) {
                        new mapboxgl.Marker({ color: '#ef4444' })
                            .setLngLat([ride.destination.longitude, ride.destination.latitude])
                            .setPopup(new mapboxgl.Popup().setHTML(`<p>Destination: ${ride.destination.address || 'Destination'}</p>`))
                            .addTo(map.current);
                    }
                    
                    // Add route between points if available
                    if (ride?.pickup && ride?.destination && 
                        typeof ride.pickup === 'object' && typeof ride.destination === 'object' && 
                        ride.pickup.longitude && ride.pickup.latitude && 
                        ride.destination.longitude && ride.destination.latitude) {
                        fetchDirections([ride.pickup.longitude, ride.pickup.latitude], 
                                       [ride.destination.longitude, ride.destination.latitude]);
                    }
                    
                    // Add user marker if location is available
                    if (userLocation) {
                        const el = document.createElement('div');
                        el.className = 'user-marker';
                        el.style.width = '20px';
                        el.style.height = '20px';
                        el.style.borderRadius = '50%';
                        el.style.backgroundColor = '#6366f1';
                        el.style.border = '2px solid white';
                        
                        userMarker.current = new mapboxgl.Marker(el)
                            .setLngLat([userLocation.lng, userLocation.lat])
                            .addTo(map.current);
                    }
                });
            } catch (error) {
                console.error('Error initializing map:', error);
                setMapError(error.message || 'Failed to initialize map');
            }
        }
    }, [ride, userLocation, showPermissionPrompt]);
    
    // Update markers when locations change
    useEffect(() => {
        if (map.current) {
            // Update captain marker
            if (captainLocation) {
                // Validate coordinates to prevent NaN errors
                const isValidCoord = captainLocation.lng && !isNaN(captainLocation.lng) && 
                                     captainLocation.lat && !isNaN(captainLocation.lat);
                
                if (isValidCoord) {
                    if (!captainMarker.current) {
                        const el = document.createElement('div');
                        el.className = 'captain-marker';
                        el.style.width = '30px';
                        el.style.height = '30px';
                        el.style.borderRadius = '50%';
                        el.style.backgroundColor = '#3b82f6';
                        el.style.display = 'flex';
                        el.style.alignItems = 'center';
                        el.style.justifyContent = 'center';
                        el.innerHTML = '<i class="ri-car-fill text-white"></i>';
                        
                        captainMarker.current = new mapboxgl.Marker(el)
                            .setLngLat([captainLocation.lng, captainLocation.lat])
                            .addTo(map.current);
                    } else {
                        captainMarker.current.setLngLat([captainLocation.lng, captainLocation.lat]);
                    }
                } else {
                    console.warn('Invalid captain coordinates received:', captainLocation);
                }
            }
            
            // Update user marker
            if (userLocation) {
                // Validate coordinates to prevent NaN errors
                const isValidCoord = userLocation.lng && !isNaN(userLocation.lng) && 
                                     userLocation.lat && !isNaN(userLocation.lat);
                
                if (isValidCoord) {
                    if (!userMarker.current) {
                        const el = document.createElement('div');
                        el.className = 'user-marker';
                        el.style.width = '20px';
                        el.style.height = '20px';
                        el.style.borderRadius = '50%';
                        el.style.backgroundColor = '#6366f1';
                        el.style.border = '2px solid white';
                        
                        userMarker.current = new mapboxgl.Marker(el)
                            .setLngLat([userLocation.lng, userLocation.lat])
                            .addTo(map.current);
                    } else {
                        userMarker.current.setLngLat([userLocation.lng, userLocation.lat]);
                    }
                } else {
                    console.warn('Invalid user coordinates received:', userLocation);
                }
            }
        }
    }, [captainLocation, userLocation]);
    
    // Listen for location updates from socket
    useEffect(() => {
        if (socket && ride) {
            const captainId = typeof ride.captain === 'object' ? ride.captain._id : ride.captain;
            
            const handleCaptainLocationChange = (data) => {
                if (data.captainId === captainId) {
                    setCaptainLocation(data.location);
                }
            };
            
            socket.on('captain-location-changed', handleCaptainLocationChange);
            
            return () => {
                socket.off('captain-location-changed', handleCaptainLocationChange);
            };
        }
    }, [socket, ride]);
    
    // Update captain location periodically
    useEffect(() => {
        if (userType === 'captain' && socket && locationPermission && userLocation && ride) {
            const captainId = typeof ride.captain === 'object' ? ride.captain._id : ride.captain;
            
            const intervalId = setInterval(() => {
                socket.emit('update-location-captain', {
                    userId: captainId,
                    location: {
                        ltd: userLocation.lat,
                        lng: userLocation.lng
                    }
                });
            }, 5000);
            
            return () => clearInterval(intervalId);
        }
    }, [userType, socket, locationPermission, userLocation, ride]);
    
    // Fetch directions between points
    const fetchDirections = async (start, end) => {
        try {
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
            );
            
            if (!response.ok) {
                throw new Error(`Directions API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.routes && data.routes.length > 0 && map.current) {
                const route = data.routes[0];
                
                // Remove existing route if it exists
                if (map.current.getSource('route')) {
                    map.current.removeLayer('route');
                    map.current.removeSource('route');
                }
                
                map.current.addSource('route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: route.geometry
                    }
                });
                
                map.current.addLayer({
                    id: 'route',
                    type: 'line',
                    source: 'route',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#3b82f6',
                        'line-width': 5,
                        'line-opacity': 0.75
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching directions:', error);
        }
    };
    
    return (
        <div className="relative h-full">
            <div ref={mapContainer} className="h-full" />
            
            {/* Location permission prompt */}
            {showPermissionPrompt && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-sm text-center">
                        <i className="ri-map-pin-user-line text-4xl text-red-500 mb-2"></i>
                        <h3 className="text-lg font-bold mb-2">Location Access Required</h3>
                        <p className="mb-4">Please enable location access to track your ride in real-time.</p>
                        <button 
                            onClick={requestLocationPermission}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Enable Location
                        </button>
                    </div>
                </div>
            )}
            
            {/* Map error message */}
            {mapError && (
                <div className="absolute bottom-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
                    <strong className="font-bold">Map error:</strong>
                    <span className="block sm:inline"> {mapError}</span>
                </div>
            )}
        </div>
    );
};

export default LiveTracking;