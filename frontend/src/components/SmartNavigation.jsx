import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserDataContext } from '../context/UserContext';
import { CaptainDataContext } from '../context/CapatainContext';

const SmartNavigation = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isLoading: userLoading } = useContext(UserDataContext);
    const { captain, isLoading: captainLoading } = useContext(CaptainDataContext);

    useEffect(() => {
        // Don't redirect while loading
        if (userLoading || captainLoading) return;

        const currentPath = location.pathname;
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');

        // Public routes that don't need authentication
        const publicRoutes = ['/', '/login', '/signup', '/captain-login', '/captain-signup'];
        
        if (publicRoutes.includes(currentPath)) {
            // If user is already authenticated, redirect to appropriate home
            if (token && userType) {
                if (userType === 'captain' && captain) {
                    navigate('/captain-home');
                } else if (userType === 'user' && user) {
                    navigate('/home');
                }
            }
            return;
        }

        // Check if user is authenticated
        if (!token || !userType) {
            navigate('/');
            return;
        }

        // Check if user data is loaded
        if (userType === 'captain' && !captain) {
            navigate('/captain-login');
            return;
        }

        if (userType === 'user' && !user) {
            navigate('/login');
            return;
        }

        // Check for ride in progress and redirect accordingly
        const activeRide = localStorage.getItem('activeRide');
        if (activeRide) {
            try {
                const rideData = JSON.parse(activeRide);
                const rideStatus = rideData.status;
                
                // Only redirect if we're not already on the correct page
                if (rideStatus === 'confirmed' && userType === 'user' && currentPath !== '/waiting-for-driver') {
                    console.log('SmartNavigation: Redirecting to waiting-for-driver');
                    navigate('/waiting-for-driver', { state: { ride: rideData } });
                } else if (rideStatus === 'started' && currentPath !== '/ride-in-progress') {
                    console.log('SmartNavigation: Redirecting to ride-in-progress');
                    navigate('/ride-in-progress', { state: { ride: rideData } });
                } else if (rideStatus === 'waiting_for_rating' && userType === 'user' && currentPath !== '/ride-complete') {
                    console.log('SmartNavigation: Redirecting to ride-complete for rating');
                    navigate('/ride-complete', { state: { ride: rideData } });
                } else if (rideStatus === 'cancelled') {
                    console.log('SmartNavigation: Ride was cancelled, clearing from localStorage');
                    localStorage.removeItem('activeRide');
                }
            } catch (e) {
                console.error('Error parsing active ride:', e);
                localStorage.removeItem('activeRide');
            }
        }

    }, [user, captain, userLoading, captainLoading, location.pathname, navigate]);

    // Show loading while determining navigation
    if (userLoading || captainLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return children;
};

export default SmartNavigation;
