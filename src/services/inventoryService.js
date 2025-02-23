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
  subscribeToInventory: (onUpdate) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('lastUpdated', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });
      onUpdate(items);
    }, (error) => {
      console.error('Error fetching inventory:', error);
      throw error;
    });
  },

  // Add or update inventory item
  addInventoryItem: async (itemData) => {
    try {
      // Check if item already exists
      const q = query(
        collection(db, COLLECTION_NAME),
        where('itemName', '==', itemData.itemName)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const existingItem = querySnapshot.docs[0];
        const existingData = existingItem.data();

        // If units match, add quantities
        if (existingData.unit === itemData.unit) {
          await updateDoc(doc(db, COLLECTION_NAME, existingItem.id), {
            quantity: existingData.quantity + Number(itemData.quantity),
            lastUpdated: serverTimestamp()
          });
          return existingItem.id;
        } else {
          // If units don't match, create new item with modified name
          const newItemName = `${itemData.itemName} (${itemData.unit})`;
          const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...itemData,
            itemName: newItemName,
            lastUpdated: serverTimestamp()
          });
          return docRef.id;
        }
      }

      // If item doesn't exist, create new entry
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

  // Update item
  updateItem: async (id, itemData) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...itemData,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  },

  // Delete item
  deleteItem: async (id) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
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