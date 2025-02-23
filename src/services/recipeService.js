import { 
  collection, 
  addDoc, 
  query,
  orderBy,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'recipes';

export const recipeService = {
  // Add new recipe
  addRecipe: async (recipeData) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...recipeData,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding recipe:', error);
      throw error;
    }
  },

  // Subscribe to recipes
  subscribeToRecipes: (onUpdate) => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('lastUpdated', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const recipes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        onUpdate(recipes);
      });
    } catch (error) {
      console.error('Error setting up recipe subscription:', error);
      throw error;
    }
  }
}; 