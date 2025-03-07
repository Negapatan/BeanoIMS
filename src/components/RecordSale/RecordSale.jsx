import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import './RecordSale.css';
import { recipeService } from '../../services/recipeService';
import Notification from '../Notification/Notification';
import SaleQuantityModal from './SaleQuantityModal';
import { inventoryService } from '../../services/inventoryService';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';

const RecordSale = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [notification, setNotification] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedLists, setExpandedLists] = useState({});
  const dropdownRef = useRef({});
  const { userRole } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);

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

  const toggleList = (type, index) => {
    setExpandedLists(prev => ({
      ...prev,
      [`${type}-${index}`]: !prev[`${type}-${index}`]
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setExpandedLists({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderList = (items, type, index) => {
    if (!items || items.length === 0) return 'None';
    
    const isExpanded = expandedLists[`${type}-${index}`];
    
    return (
      <div ref={dropdownRef}>
        <ul className={`${type}-list ${!isExpanded ? 'collapsed-list' : ''}`}>
          <li>{items[0].name}: {items[0].quantity} {items[0].unit}</li>
          {items.length > 1 && !isExpanded && (
            <button
              className="show-more-btn"
              onClick={() => toggleList(type, index)}
            >
              <span className="material-icons">add_circle_outline</span>
              {items.length - 1} more
            </button>
          )}
        </ul>
        {isExpanded && (
          <div className="dropdown-content">
            {items.map((item, i) => (
              <li key={i}>
                {item.name}: {item.quantity} {item.unit}
              </li>
            ))}
          </div>
        )}
      </div>
    );
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.recipeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteClick = (recipe) => {
    if (!(userRole === 'admin' || userRole === 'superadmin')) {
      showNotification('error', 'Only admin can delete recipes');
      return;
    }
    setRecipeToDelete(recipe);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDoc(doc(db, 'recipes', recipeToDelete.id));
      showNotification('success', 'Recipe deleted successfully');
      setShowDeleteConfirm(false);
      setRecipeToDelete(null);
    } catch (error) {
      console.error('Error deleting recipe:', error);
      showNotification('error', 'Failed to delete recipe');
    }
  };

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
            {filteredRecipes.map((recipe, index) => (
              <tr key={recipe.id}>
                <td>{recipe.recipeName}</td>
                <td>{recipe.category}</td>
                <td>{recipe.size || 'N/A'}</td>
                <td>
                  {renderList(recipe.ingredients, 'ingredients', index)}
                </td>
                <td>
                  {renderList(recipe.packaging, 'packaging', index)}
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="record-btn"
                      onClick={() => handleItemSelect(recipe)}
                      disabled={loading}
                    >
                      <span className="material-icons">point_of_sale</span>
                      Sale
                    </button>
                    <button
                      className="delete-recipe-btn"
                      onClick={() => handleDeleteClick(recipe)}
                      disabled={loading || !(userRole === 'admin' || userRole === 'superadmin')}
                      title={userRole === 'admin' || userRole === 'superadmin' ? 
                        "Delete recipe" : "Only admin can delete recipes"}
                    >
                      <span className="material-icons">delete</span>
                    </button>
                  </div>
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

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Recipe"
        message={`Are you sure you want to delete ${recipeToDelete?.recipeName}?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setRecipeToDelete(null);
        }}
      />
    </div>
  );
};

export default RecordSale; 