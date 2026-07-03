import { createContext, useContext, useState, useEffect } from 'react';
import { getUser, saveUser, getSession, startSession, endSession, deleteAccount } from '../utils/storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const sessionUser = getSession();
    if (sessionUser) {
      setUser(sessionUser);
      setLoggedIn(true);
    }
    setAuthLoading(false);
  }, []);

  const signup = (userData) => {
    saveUser(userData);
    startSession(userData);
    setUser(userData);
    setLoggedIn(true);
  };

  const login = (userData) => {
    startSession(userData);
    setUser(userData);
    setLoggedIn(true);
  };

  const logout = () => {
    endSession();
    setUser(null);
    setLoggedIn(false);
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    saveUser(updatedUser);
    startSession(updatedUser);
    setUser(updatedUser);
  };

  const deleteMyAccount = () => {
    deleteAccount();
    setUser(null);
    setLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ user, loggedIn, authLoading, signup, login, logout, updateUser, deleteMyAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);