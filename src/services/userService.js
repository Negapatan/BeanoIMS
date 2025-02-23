import { 
  collection, 
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'users';

export const userService = {
  // Create new user
  createUser: async (userData) => {
    try {
      const usernameLower = userData.username.toLowerCase();
      
      // Check if username already exists
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('usernameLower', '==', usernameLower)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('Username already exists');
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...userData,
        usernameLower,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Get user by username
  getUserByUsername: async (username) => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('usernameLower', '==', username.toLowerCase())
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (uid) => {
    try {
      const userDoc = doc(db, COLLECTION_NAME, uid);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }
}; 