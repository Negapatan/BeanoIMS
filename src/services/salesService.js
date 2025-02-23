import { 
  collection, 
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'sales';

export const salesService = {
  // Record a sale
  recordSale: async (saleData) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...saleData,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error recording sale:', error);
      throw error;
    }
  },

  // Subscribe to sales
  subscribeToSales: (onUpdate) => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('date', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const sales = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        onUpdate(sales);
      });
    } catch (error) {
      console.error('Error setting up sales subscription:', error);
      throw error;
    }
  }
}; 