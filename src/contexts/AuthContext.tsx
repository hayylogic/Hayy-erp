import React, { createContext, useState, useContext, useEffect } from 'react';
import { db, User } from '../db/db';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isCashier: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check for stored user on mount
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser && mounted) {
          setCurrentUser(JSON.parse(storedUser));
        }
        
        // Initialize database with default data
        await db.initializeDefaultData();
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const user = await db.users
        .where('username')
        .equals(username)
        .and(user => user.active === true)
        .first();
      
      if (user && user.password === password) { // In a real app, use proper password hashing
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const isAdmin = () => currentUser?.role === 'admin';
  const isManager = () => ['admin', 'manager'].includes(currentUser?.role || '');
  const isCashier = () => ['admin', 'manager', 'cashier'].includes(currentUser?.role || '');

  const value = {
    currentUser,
    loading,
    login,
    logout,
    isAdmin,
    isManager,
    isCashier
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};