import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const CaptainDataContext = createContext();

const CaptainContext = ({ children }) => {
    const [ captain, setCaptain ] = useState(null);
    const [ isLoading, setIsLoading ] = useState(true);
    const [ error, setError ] = useState(null);

    useEffect(() => {
        const initializeCaptain = async () => {
            try {
                const token = localStorage.getItem('token');
                const userId = localStorage.getItem('userId');
                const userType = localStorage.getItem('userType');
                
                if (!token || !userId) {
                    setIsLoading(false);
                    return;
                }
                
                // Only proceed if userType is captain
                if (userType !== 'captain') {
                    console.log('User is not a captain, skipping captain auth');
                    setIsLoading(false);
                    return;
                }

                // Try to auto-login captain
                try {
                    const response = await axios.get(`${import.meta.env.VITE_BASE_URL || 'http://localhost:3000'}/captains/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (response.status === 200) {
                        const captainData = response.data;
                        setCaptain(captainData);
                        localStorage.setItem('captainData', JSON.stringify(captainData));
                        console.log('Captain auto-login successful');
                    }
                } catch (error) {
                    console.error('Captain auto-login failed:', error);
                    if (error.response?.status === 401) {
                        // Clear invalid credentials
                        localStorage.removeItem('token');
                        localStorage.removeItem('userId');
                        localStorage.removeItem('userType');
                        localStorage.removeItem('captainData');
                        setCaptain(null);
                    }
                }
            } catch (error) {
                console.error('Error in initializeCaptain:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeCaptain();
    }, []);

    const updateCaptain = (captainData) => {
        setCaptain(captainData);
        if (captainData) {
            localStorage.setItem('captainData', JSON.stringify(captainData));
        } else {
            localStorage.removeItem('captainData');
        }
    };

    const logout = () => {
        setCaptain(null);
        localStorage.removeItem('token');
        localStorage.removeItem('captainData');
    };

    const value = {
        captain,
        setCaptain: updateCaptain,
        isLoading,
        setIsLoading,
        error,
        setError,
        updateCaptain,
        logout
    };

    return (
        <CaptainDataContext.Provider value={value}>
            {children}
        </CaptainDataContext.Provider>
    );
};

export { CaptainDataContext };
export default CaptainContext;