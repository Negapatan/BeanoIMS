import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import './RecordSale.css';
import { recipeService } from '../../services/recipeService';
import Notification from '../Notification/Notification';
import SaleQuantityModal from './SaleQuantityModal';
import { inventoryService } from '../../services/inventoryService';

const RecordSale = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [notification, setNotification] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = recipeService.subscribeToRecipes((updatedRecipes) => {
      setRecipes(updatedRecipes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleSaleConfirm = async (saleData) => {
    try {
      setLoading(true);
      
      // Convert date string to Firestore timestamp
      const saleTimestamp = new Date(saleData.saleDate);
      
      // Check if we have enough packaging materials
      const hasEnoughPackaging = await checkPackagingAvailability(selectedItem.packaging, saleData.quantity);
      if (!hasEnoughPackaging) {
        showNotification('error', 'Not enough packaging materials in inventory!');
        return;
      }

      const salesRef = collection(db, 'sales');
      const q = query(
        salesRef,
        where('productName', '==', selectedItem.recipeName),
        where('ingredients', '==', selectedItem.ingredients),
        where('packaging', '==', selectedItem.packaging),
        where('saleDate', '==', saleTimestamp)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Update existing sale
        const existingSale = querySnapshot.docs[0];
        const existingData = existingSale.data();
        
        // Update quantity of existing sale
        await updateDoc(doc(db, 'sales', existingSale.id), {
          quantity: existingData.quantity + Number(saleData.quantity),
          lastUpdated: serverTimestamp()
        });

        // Update packaging quantities
        await updatePackagingQuantities(selectedItem.packaging, saleData.quantity);
      } else {
        // Create new sale
        await addDoc(collection(db, 'sales'), {
          productName: selectedItem.recipeName,
          category: selectedItem.category,
          quantity: saleData.quantity,
          ingredients: selectedItem.ingredients,
          packaging: selectedItem.packaging || [],
          saleDate: saleTimestamp,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        });

        // Update packaging quantities
        await updatePackagingQuantities(selectedItem.packaging, saleData.quantity);
      }

      showNotification('success', 'Sale recorded successfully!');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error recording sale:', error);
      showNotification('error', 'Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  const checkPackagingAvailability = async (packaging, orderQuantity) => {
    try {
      const inventoryItems = await inventoryService.getInventoryItems();
      
      for (const pkg of packaging) {
        const inventoryItem = inventoryItems.find(item => 
          item.itemName.toLowerCase() === pkg.name.toLowerCase()
        );
        
        // Calculate total needed quantity
        const neededQuantity = pkg.quantity * orderQuantity;
        
        if (!inventoryItem || inventoryItem.quantity < neededQuantity) {
          showNotification('error', `Not enough ${pkg.name} in inventory!`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking packaging:', error);
      return false;
    }
  };

  const updatePackagingQuantities = async (packaging, orderQuantity) => {
    try {
      for (const pkg of packaging) {
        // Calculate total quantity to subtract
        const quantityToSubtract = pkg.quantity * orderQuantity;
        
        await inventoryService.updateItemQuantity(
          pkg.name,
          -quantityToSubtract // Subtract the total used quantity
        );
      }
    } catch (error) {
      console.error('Error updating packaging quantities:', error);
      throw new Error('Failed to update packaging quantities');
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.recipeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="loading">Loading recipes...</div>;
  }

  return (
    <div className="record-sale-container">
      <div className="form-header">
        <h1>Make Sale</h1>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <span className="material-icons">search</span>
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="Coffee">Coffee</option>
            <option value="Non-Coffee">Non-Coffee</option>
            <option value="Food">Food</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="recipes-table">
          <thead>
            <tr>
              <th>PRODUCT NAME</th>
              <th>CATEGORY</th>
              <th>SIZE</th>
              <th>INGREDIENTS</th>
              <th>PACKAGING</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecipes.map((recipe) => (
              <tr key={recipe.id}>
                <td>{recipe.recipeName}</td>
                <td>{recipe.category}</td>
                <td>{recipe.size || 'N/A'}</td>
                <td>
                  <ul className="ingredients-list">
                    {recipe.ingredients.map((ing, index) => (
                      <li key={index}>
                        {ing.name}: {ing.quantity} {ing.unit}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>
                  <ul className="packaging-list">
                    {recipe.packaging?.map((pkg, index) => (
                      <li key={index}>
                        {pkg.name}: {pkg.quantity} {pkg.unit}
                      </li>
                    )) || 'No packaging'}
                  </ul>
                </td>
                <td>
                  <button
                    className="record-btn"
                    onClick={() => handleItemSelect(recipe)}
                    disabled={loading}
                  >
                    <span className="material-icons">point_of_sale</span>
                    Sale
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <SaleQuantityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
        onConfirm={handleSaleConfirm}
      />
    </div>
  );
};

export default RecordSale; 