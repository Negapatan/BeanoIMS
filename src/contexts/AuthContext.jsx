import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth';
import { userService } from '../services/userService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up function
  const signup = async (email, password, username) => {
    try {
      // First check if username exists
      const existingUser = await userService.getUserByUsername(username);
      if (existingUser) {
        throw new Error('Username already taken');
      }

      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update auth profile with username
      await updateProfile(user, {
        displayName: username
      });

      // Create user document in Firestore
      await userService.createUser(user.uid, {
        username,
        email,
        role: 'user'
      });

      return user;
    } catch (error) {
      console.error("Signup error:", error);
      // Convert Firebase errors to user-friendly messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email already in use');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/password accounts are not enabled');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak');
      }
      throw error;
    }
  };

  // Login function
  const login = async (usernameOrEmail, password) => {
    try {
      let loginEmail = usernameOrEmail.toLowerCase().trim();
      let userCredential;

      // Try direct email login first
      try {
        if (loginEmail.includes('@')) {
          userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
        } else {
          // If not an email, try to find user by username
          const user = await userService.getUserByUsername(loginEmail);
          if (!user) {
            throw new Error('Invalid username or password');
          }
          userCredential = await signInWithEmailAndPassword(auth, user.email, password);
        }
        
        // Get additional user data from Firestore
        const userData = await userService.getUserById(userCredential.user.uid);
        const fullUser = { ...userCredential.user, ...userData };
        setCurrentUser(fullUser);
        
        return fullUser;
      } catch (error) {
        console.error("Login attempt error:", error);
        if (error.code === 'auth/invalid-email' || 
            error.code === 'auth/user-not-found' || 
            error.code === 'auth/wrong-password') {
          throw new Error('Invalid username or password');
        }
        throw error;
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    return signOut(auth);
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userData = await userService.getUserById(user.uid);
          setCurrentUser({ ...user, ...userData });
        } catch (error) {
          console.error("Error fetching user data:", error);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 