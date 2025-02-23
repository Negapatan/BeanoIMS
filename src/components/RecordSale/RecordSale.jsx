import React, { useState, useEffect } from 'react';
import './RecordSale.css';
import { recipeService } from '../../services/recipeService';
import { salesService } from '../../services/salesService';
import Notification from '../Notification/Notification';
import SaleQuantityModal from './SaleQuantityModal';

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
      await salesService.recordSale(saleData);
      showNotification('success', 'Sale recorded successfully!');
    } catch (error) {
      console.error('Error recording sale:', error);
      showNotification('error', 'Failed to record sale');
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
        <h1>Record Sale</h1>
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
                  <button
                    className="record-btn"
                    onClick={() => handleItemSelect(recipe)}
                    disabled={loading}
                  >
                    <span className="material-icons">point_of_sale</span>
                    Record Sale
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