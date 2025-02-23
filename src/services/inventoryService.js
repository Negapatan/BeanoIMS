import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'inventory';

export const inventoryService = {
  // Get all inventory items
  getAllItems: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting inventory items:', error);
      throw error;
    }
  },

  // Subscribe to inventory changes
  subscribeToInventory: (callback) => {
    return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(items);
    });
  },

  // Add new inventory item
  addItem: async (itemData) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...itemData,
        lastUpdated: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  },

  // Update inventory item
  updateItem: async (itemId, itemData) => {
    try {
      const itemRef = doc(db, COLLECTION_NAME, itemId);
      await updateDoc(itemRef, {
        ...itemData,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  },

  // Delete inventory item
  deleteItem: async (itemId) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, itemId));
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  },

  // Search items
  searchItems: async (searchTerm, category, supplier) => {
    try {
      let q = collection(db, COLLECTION_NAME);
      const conditions = [];

      if (searchTerm) {
        conditions.push(where('itemName', '>=', searchTerm));
        conditions.push(where('itemName', '<=', searchTerm + '\uf8ff'));
      }
      if (category) {
        conditions.push(where('category', '==', category));
      }
      if (supplier) {
        conditions.push(where('supplier', '==', supplier));
      }

      if (conditions.length > 0) {
        q = query(q, ...conditions);
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error searching inventory items:', error);
      throw error;
    }
  },

  // Add new method to handle purchase completion
  handlePurchaseCompletion: async (purchaseData) => {
    try {
      // Check if item exists in inventory
      const q = query(
        collection(db, COLLECTION_NAME),
        where('itemName', '==', purchaseData.itemName)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Update existing inventory item
        const inventoryDoc = querySnapshot.docs[0];
        const currentData = inventoryDoc.data();
        
        await updateDoc(doc(db, COLLECTION_NAME, inventoryDoc.id), {
          quantity: currentData.quantity + purchaseData.quantity,
          lastUpdated: serverTimestamp(),
          // Update price if different
          price: purchaseData.pricePerUnit,
          // Update supplier if provided
          ...(purchaseData.supplier && { supplier: purchaseData.supplier })
        });
      } else {
        // Create new inventory item
        await addDoc(collection(db, COLLECTION_NAME), {
          itemName: purchaseData.itemName,
          quantity: purchaseData.quantity,
          unit: purchaseData.unit,
          price: purchaseData.pricePerUnit,
          supplier: purchaseData.supplier,
          category: 'Uncategorized', // Default category
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error handling purchase completion:', error);
      throw error;
    }
  },

  // Subscribe to inventory updates
  subscribeToInventoryUpdates: (onUpdate) => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('lastUpdated', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const inventory = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        onUpdate(inventory);
      });
    } catch (error) {
      console.error('Error setting up inventory subscription:', error);
      throw error;
    }
  },

  // Get all inventory items
  getInventoryItems: async () => {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting inventory items:', error);
      throw error;
    }
  },

  // Update item quantity
  updateItemQuantity: async (itemName, quantityChange) => {
    try {
      const items = await inventoryService.getInventoryItems();
      const item = items.find(i => i.itemName === itemName);
      
      if (!item) {
        throw new Error(`Item ${itemName} not found in inventory`);
      }

      const newQuantity = item.quantity + quantityChange;
      if (newQuantity < 0) {
        throw new Error(`Not enough ${itemName} in inventory`);
      }

      await updateDoc(doc(db, COLLECTION_NAME, item.id), {
        quantity: newQuantity,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    }
  }
}; 