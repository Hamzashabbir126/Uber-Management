import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const UserDataContext = createContext();

const UserContext = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                const userId = localStorage.getItem('userId');
                const userType = localStorage.getItem('userType');
                
                if (!token || !userId || !userType) {
                    setIsLoading(false);
                    return;
                }

                // Try to auto-login based on stored credentials
                try {
                    // Only try to authenticate if userType is 'user'
                    if (userType === 'user') {
                        const response = await axios.get(`${import.meta.env.VITE_BASE_URL || 'http://localhost:3000'}/users/profile`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        if (response.status === 200) {
                            const userData = response.data;
                            setUser(userData);
                            localStorage.setItem('userData', JSON.stringify(userData));
                            console.log('User auto-login successful');
                        }
                    } else {
                        // For captains, just set loading to false without trying to authenticate
                        console.log('Captain detected in UserContext, skipping user auth');
                    }
                } catch (error) {
                    console.error('User auto-login failed:', error);
                    if (error.response?.status === 401) {
                        // Clear invalid credentials
                        localStorage.removeItem('token');
                        localStorage.removeItem('userId');
                        localStorage.removeItem('userType');
                        localStorage.removeItem('userData');
                        setUser(null);
                    }
                }
            } catch (error) {
                console.error('Error in initializeAuth:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const updateUser = (newUserData) => {
        setUser(newUserData);
        if (newUserData) {
            localStorage.setItem('userData', JSON.stringify(newUserData));
        } else {
            localStorage.removeItem('userData');
        }
    };

    const login = (userData, token, userType) => {
        setUser(userData);
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userData._id);
        localStorage.setItem('userType', userType);
        localStorage.setItem('userData', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');
    };

    return (
        <UserDataContext.Provider value={{ user, setUser: updateUser, isLoading, logout, login }}>
            {children}
        </UserDataContext.Provider>
    );
};

export { UserDataContext };
export default UserContext;