import React, { useState } from 'react';
import './AddInventory.css';
import { inventoryService } from '../../services/inventoryService.js';
import Notification from '../Notification/Notification';
import SearchableSelect from '../SearchableSelect/SearchableSelect';

const INVENTORY_ITEMS = [
  'TORANI SYRUP CARAMEL',
  'TORANI SYRUP HAZELNUT',
  'TORANI SYRUP VANILLA',
  'MONIN SYRUP VANILLA',
  'COFFEE BEANS (ARABICA)',
  'COFFEE BEANS (ROBUSTA)',
  'NUTELLA SPREAD',
  'HEAVY WHIPPING CREAM (ARLA)',
  'HEAVY WHIPPING CREAM (BUNGEE)',
  'HEAVY WHIPPING CREAM (ANCHOR)',
  'HEAVY WHIPPING CREAM (EMBORG)',
  'WHITE CHOCOLATE CHIPS',
  'UNSWEETENED COCOA POWDER',
  'MATCHA POWDER (LITTLE RETAIL)',
  'SWEETENED PEANUT BUTTER',
  'BISCOFF PEANUT BUTTER',
  'BISCOFF PLAIN BISCUITS',
  'SUGAR SYRUP',
  'ICE CUBES',
  'WHITE SUGAR',
  'BROWN SUGAR',
  'IODIZED SALT',
  'TABLEA',
  'CONDENSED MILK',
  'STARBUCKS ESPRESSO ROAST',
  'ARLA BARISTA FULL CREAM MILK',
  'ARLA FULL CREAM MILK',
  'EMBORG FULL CREAM MILK',
  'OATMILK',
  'MORINGA POWDER',
  'SPRITE (MISMO)',
  'STRAWBERRY SYRUP',
  'KIWI SYRUP',
  'PASSIONFRUIT SYRUP',
  'RICE',
  'EGG',
  'LETTUCE',
  'TOMATO',
  'CAESAR SALAD DRESSING',
  'SPAM',
  'BEEF TAPA',
  'PORK TOCINO',
  'BACON',
  'CHORIZO',
  'LONGANISA',
  'CHICKEN QUARTER',
  'SOY SAUCE',
  'OYSTER SAUCE',
  'GARLIC POWDER',
  'GROUND PEPPER',
  'ONION POWDER',
  'GINGER POWDER',
  'PARMESAN CHEESE POWDER',
  'EDEN CHEESE',
  'CORNSTARCH',
  'FLOUR',
  'EVAPORATED MILK',
  'CRISPY FRY',
  'SESAME SEEDS',
  'CUCUMBER',
  'COOKING OIL',
  'JIN RAMEN',
  'SHIN RAMEN',
  'JAJANGMYEON',
  'TORANI WHITE CHOCOLATE SAUCE',
  'MONIN CARAMEL SAUCE',
  'DRINKING WATER',
  'DW PAPER CUP 12oz w/lid',
  'DW PAPER CUP 8oz w/lid',
  'SC PET 95-12oz CUP w/lid',
  'PET 95-16oz Y CUP w/lid',
  'PLASTIC STRAW',
  'WOODEN STIRRER',
  'PLASTIC BAG (DOUBLE)',
  'TABLE NAPKIN',
  'TAKE OUT PAPER CONTAINER',
  'PLASTIC CONTAINER',
];

const AddInventory = () => {
  const [items, setItems] = useState([
    { itemName: '', quantity: '', unit: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddItem = () => {
    setItems([...items, { itemName: '', quantity: '', unit: '' }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Add each item to inventory
      for (const item of items) {
        await inventoryService.addItem({
          itemName: item.itemName,
          quantity: Number(item.quantity),
          unit: item.unit
        });
      }

      showNotification('success', 'Items added successfully!');
      
      // Reset form
      setItems([{ itemName: '', quantity: '', unit: '' }]);
    } catch (error) {
      console.error('Error adding items:', error);
      showNotification('error', 'Failed to add items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-inventory-container">
      <div className="form-header">
        <h1>Add Inventory Items</h1>
      </div>

      <form onSubmit={handleSubmit} className="inventory-form">
        {items.map((item, index) => (
          <div key={index} className="inventory-item-row">
            <div className="form-group">
              <label>Item Name</label>
              <SearchableSelect
                options={INVENTORY_ITEMS}
                value={item.itemName}
                onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                placeholder="Search item name..."
                required
              />
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                placeholder="Enter quantity"
                required
              />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <select
                value={item.unit}
                onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                required
              >
                <option value="">Select unit</option>
                <option value="g">Grams (g)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="L">Liters (L)</option>
                <option value="pcs">Pieces (pcs)</option>
                <option value="pack">Pack</option>
              </select>
            </div>
            {items.length > 1 && (
              <button
                type="button"
                className="remove-item-btn"
                onClick={() => handleRemoveItem(index)}
              >
                <span className="material-icons">remove_circle</span>
              </button>
            )}
          </div>
        ))}
        
        <button
          type="button"
          className="add-item-btn"
          onClick={handleAddItem}
        >
          <span className="material-icons">add_circle</span>
          Add Another Item
        </button>

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            <span className="material-icons">add</span>
            {loading ? 'Adding...' : 'Add Items'}
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
  );
};

export default AddInventory; 