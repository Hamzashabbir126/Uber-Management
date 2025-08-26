// d:\uber-video\frontend\src\context\SocketContext.jsx
import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useLocation } from 'react-router-dom';

export const SocketContext = createContext({
  socket: null
});

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const location = useLocation();
  
  // Check if current route is a public route (login/signup pages)
  const isPublicRoute = 
    location.pathname === '/' || 
    location.pathname === '/signup' ||
    location.pathname === '/captain-login' ||
    location.pathname === '/captain-signup' ||
    location.pathname === '/start';

  useEffect(() => {
    // Skip connection on public routes to avoid unnecessary errors
    if (isPublicRoute) {
      console.log('Public route detected, skipping socket connection');
      setSocket(null);
      return;
    }
    
    // Initialize socket with auth token for authenticated routes
    const token = localStorage.getItem('token');

    // Don't connect if there's no token
    if (!token) {
      console.log('No token available for socket connection');
      setSocket(null);
      return;
    }

    // Ensure token is properly formatted
    const formattedToken = typeof token === 'string'
      ? (token.startsWith('Bearer ') ? token.substring(7) : token)
      : token;

    try {
      const socketInstance = io(`${import.meta.env.VITE_BASE_URL || 'http://localhost:3000'}`, {
        auth: {
          token: formattedToken
        },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      // Socket event handlers
      socketInstance.on('connect', () => {
        console.log('Connected to server');
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        if (error.message === 'Unauthorized') {
          // Only redirect from authenticated routes
          if (!isPublicRoute) {
            console.log('Unauthorized socket connection, redirecting to login');
            localStorage.removeItem('token'); // Clear invalid token
            window.location.href = '/';
          }
        }
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      // Enhanced event logging for debugging
      socketInstance.onAny((event, ...args) => {
        console.log(`Socket event received: ${event}`, args);
      });

      // Create a global event handler for critical events like ride completion
      const createGlobalEventHandler = (socketInstance) => {
        // Global handler for ride-completed events
        socketInstance.on('ride-completed', (data) => {
          console.log('[GLOBAL] Ride completed event received:', data);
          
          // Create a custom event that any component can listen for
          const rideCompletedEvent = new CustomEvent('globalRideCompleted', { 
            detail: data 
          });
          
          // Dispatch the event globally
          window.dispatchEvent(rideCompletedEvent);
          
          // Show a global notification
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg bg-green-500 text-white text-center';
          notification.innerHTML = `
            <div class="flex items-center justify-center">
              <span class="font-medium">Ride completed! Please rate your experience.</span>
            </div>
          `;
          document.body.appendChild(notification);
          
          // Remove after 5 seconds
          setTimeout(() => {
            try {
              document.body.removeChild(notification);
            } catch (e) {
              console.log('Notification already removed');
            }
          }, 5000);
          
          // Try to automatically navigate to the rating page
          try {
            const currentPath = window.location.pathname;
            // Only navigate if we're in an active ride related page
            if (currentPath.includes('ride') && !currentPath.includes('complete')) {
              window.location.href = '/ride-complete?auto=true';
            }
          } catch (e) {
            console.error('Navigation error:', e);
          }
        });
      };

      // Add our global event handler
      createGlobalEventHandler(socketInstance);

      setSocket(socketInstance);

      // Cleanup on unmount
      return () => {
        if (socketInstance) {
          socketInstance.disconnect();
        }
      };
    } catch (error) {
      console.error('Error creating socket connection:', error);
      setSocket(null);
    }
  }, [isPublicRoute, location.pathname]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;