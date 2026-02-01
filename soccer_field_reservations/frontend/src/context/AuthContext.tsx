import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';

interface AuthContextType {
    token: string | null;
    user: string | null;
    role: string | null;
    login: (token: string, user: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<string | null>(localStorage.getItem('user'));
    const [role, setRole] = useState<string | null>(localStorage.getItem('role'));

    useEffect(() => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            try {
                // Manually decode JWT payload
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const decoded = JSON.parse(jsonPayload);
                if (decoded.role) {
                    setRole(decoded.role);
                    localStorage.setItem('role', decoded.role);
                }
            } catch (e) {
                console.error("Failed to decode token", e);
            }
        } else {
            delete api.defaults.headers.common['Authorization'];
            setRole(null);
            localStorage.removeItem('role');
        }
    }, [token]);

    const login = (newToken: string, newUser: string) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', newUser);
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        setToken(null);
        setUser(null);
        setRole(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, role, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
