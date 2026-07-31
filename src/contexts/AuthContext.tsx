import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types';
import { 
  loginWithGoogle, 
  loginAsGuest, 
  logoutUser, 
  subscribeToAuth 
} from '../firebase/authService';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<UserProfile>;
  signInAnonymously: () => Promise<UserProfile>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      setCurrentUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const signInAnonymously = async () => {
    setLoading(true);
    try {
      const user = await loginAsGuest();
      setCurrentUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        signInWithGoogle,
        signInAnonymously,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
