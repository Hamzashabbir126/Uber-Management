import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserDataContext } from '../context/UserContext';
import { CaptainDataContext } from '../context/CapatainContext';
import rideManager from '../utils/rideManager';

const Header = () => {
    const navigate = useNavigate();
    const { user, logout: userLogout } = useContext(UserDataContext);
    const { captain, logout: captainLogout } = useContext(CaptainDataContext);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const userType = localStorage.getItem('userType');
    let activeRide = null;
    
    try {
        activeRide = rideManager.getActiveRide();
    } catch (error) {
        console.error('Error getting active ride:', error);
        activeRide = null;
    }

    const handleLogout = () => {
        if (userType === 'captain') {
            captainLogout();
        } else {
            userLogout();
        }
        navigate('/');
    };

    const getRideStatusText = () => {
        if (!activeRide || !activeRide.status) return null;
        
        switch (activeRide.status) {
            case 'confirmed':
                return 'Driver on the way';
            case 'started':
                return 'Ride in progress';
            case 'waiting_for_rating':
                return 'Rate your ride';
            default:
                return null;
        }
    };

    const getRideStatusColor = () => {
        if (!activeRide || !activeRide.status) return '';
        
        switch (activeRide.status) {
            case 'confirmed':
                return 'text-blue-600';
            case 'started':
                return 'text-green-600';
            case 'waiting_for_rating':
                return 'text-orange-600';
            default:
                return '';
        }
    };

    const userName = userType === 'captain' 
        ? (captain?.fullname?.firstname || captain?.fullname || 'Captain')
        : (user?.fullname?.firstname || user?.fullname || 'User');

    // Debug logging
    console.log('Header render - userType:', userType, 'activeRide:', activeRide);
    
    // Safety check for activeRide
    if (!activeRide && userType === 'captain') {
        console.log('No active ride for captain');
    }

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and Title */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <h1 className="text-xl font-bold text-gray-900">🚗 UberRide</h1>
                        </div>
                    </div>

                    {/* Ride Status */}
                    {activeRide && (
                        <div className="flex-1 flex justify-center">
                            <div className={`text-sm font-medium ${getRideStatusColor()}`}>
                                {getRideStatusText()}
                            </div>
                        </div>
                    )}

                    {/* User Menu */}
                    <div className="flex items-center">
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md p-2"
                            >
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    {(userName && userName.length > 0) ? userName.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span className="hidden md:block text-sm font-medium">{userName}</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                                    <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200">
                                        {userType === 'captain' ? 'Captain Account' : 'User Account'}
                                    </div>
                                    
                                    <button
                                        onClick={() => navigate(userType === 'captain' ? '/captain-home' : '/home')}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Home
                                    </button>
                                    
                                    {userType === 'captain' && (
                                        <button
                                            onClick={() => navigate('/captain-waiting')}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Active Rides
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
