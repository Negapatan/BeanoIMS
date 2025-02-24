import React, { useState } from 'react';
import './SaleQuantityModal.css';
import { inventoryService } from '../../services/inventoryService';
import Notification from '../Notification/Notification';

const SaleQuantityModal = ({ isOpen, onClose, item, onConfirm }) => {
  const [quantity, setQuantity] = useState(1);
  const [addons, setAddons] = useState([{ name: '', quantity: '', unit: '' }]);
  const [isCustomOrder, setIsCustomOrder] = useState(false);
  const [notification, setNotification] = useState(null);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    // If empty, set to 0, otherwise use the number value
    const newQuantity = value === '' ? 0 : Math.max(0, parseInt(value) || 0);
    setQuantity(newQuantity);
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddAddon = () => {
    setAddons([...addons, { name: '', quantity: '', unit: '' }]);
  };

  const handleRemoveAddon = (index) => {
    setAddons(addons.filter((_, i) => i !== index));
  };

  const handleAddonChange = (index, field, value) => {
    const newAddons = [...addons];
    newAddons[index] = { ...newAddons[index], [field]: value };
    setAddons(newAddons);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Check if we have enough ingredients for the requested quantity
      const hasEnoughIngredients = await checkIngredientAvailability(item.ingredients, quantity);
      if (!hasEnoughIngredients) {
        showNotification('error', 'Not enough ingredients in inventory!');
        return;
      }

      // Update inventory quantities for all ingredients based on quantity ordered
      await updateInventoryQuantities(item.ingredients, quantity);

      // If it's a custom order, update quantities for addons
      if (isCustomOrder) {
        for (const addon of addons) {
          if (addon.name && addon.quantity) {
            await inventoryService.updateItemQuantity(
              addon.name, 
              -Number(addon.quantity)
            );
          }
        }
      }

      // Prepare sale data
      const saleData = {
        productName: item.recipeName,
        category: item.category,
        size: item.size || 'N/A',
        quantity: quantity,
        saleDate: new Date(saleDate),
        isCustomOrder,
        addons: isCustomOrder ? addons : []
      };

      onConfirm(saleData);
      onClose();
      
    } catch (error) {
      console.error('Error processing sale:', error);
      showNotification('error', error.message);
    }
  };

  const checkIngredientAvailability = async (ingredients, orderQuantity) => {
    try {
      const inventoryItems = await inventoryService.getInventoryItems();
      
      for (const ingredient of ingredients) {
        const inventoryItem = inventoryItems.find(item => 
          item.itemName.toLowerCase() === ingredient.name.toLowerCase()
        );
        
        // Calculate total needed quantity
        const neededQuantity = ingredient.quantity * orderQuantity;
        
        if (!inventoryItem || inventoryItem.quantity < neededQuantity) {
          showNotification('error', `Not enough ${ingredient.name} in inventory!`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking ingredients:', error);
      return false;
    }
  };

  const updateInventoryQuantities = async (ingredients, orderQuantity) => {
    try {
      for (const ingredient of ingredients) {
        // Calculate total quantity to subtract
        const quantityToSubtract = ingredient.quantity * orderQuantity;
        
        await inventoryService.updateItemQuantity(
          ingredient.name,
          -quantityToSubtract // Subtract the total used quantity
        );
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw new Error('Failed to update inventory quantities');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="sale-quantity-modal">
          <div className="modal-header">
            <h2>Record Sale: {item.recipeName}</h2>
            <button className="close-btn" onClick={onClose}>
              <span className="material-icons">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Sale Date</label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={handleQuantityChange}
                onBlur={() => {
                  if (quantity === 0) setQuantity(1);
                }}
                required
              />
            </div>

            <div className="custom-order-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={isCustomOrder}
                  onChange={(e) => setIsCustomOrder(e.target.checked)}
                />
                Custom Order
              </label>
            </div>

            {isCustomOrder && (
              <div className="addons-section">
                <h3>Addons</h3>
                {addons.map((addon, index) => (
                  <div key={index} className="addon-row">
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Addon name"
                        value={addon.name}
                        onChange={(e) => handleAddonChange(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={addon.quantity}
                        onChange={(e) => handleAddonChange(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <select
                        value={addon.unit}
                        onChange={(e) => handleAddonChange(index, 'unit', e.target.value)}
                      >
                        <option value="">Unit</option>
                        <option value="ml">ml</option>
                        <option value="g">g</option>
                        <option value="pcs">pcs</option>
                        <option value="shots">shots</option>
                        <option value="pumps">pumps</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      className="remove-addon"
                      onClick={() => handleRemoveAddon(index)}
                    >
                      <span className="material-icons">remove_circle</span>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-addon"
                  onClick={handleAddAddon}
                >
                  <span className="material-icons">add_circle</span>
                  Add Addon
                </button>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="confirm-btn">
                Confirm Sale
              </button>
            </div>
          </form>

          {notification && (
            <Notification
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SaleQuantityModal; 