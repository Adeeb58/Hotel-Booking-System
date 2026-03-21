import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [role, setRole] = useState(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decoded = jwtDecode(storedToken);
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setToken(storedToken);
                    setUser(decoded.sub);
                    setUserId(decoded.userId);
                    setRole(decoded.role || 'USER');
                }
            } catch (err) {
                logout();
            }
        }
    }, []);

    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        const decoded = jwtDecode(newToken);
        setUser(decoded.sub);
        setUserId(decoded.userId);
        setRole(decoded.role || 'USER');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setUserId(null);
        setRole(null);
    };

    return (
        <AuthContext.Provider value={{ user, userId, role, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
