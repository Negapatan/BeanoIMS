import React, { useState, useEffect } from 'react';
import './Inventory.css';
import { inventoryService } from '../../services/inventoryService';
import Notification from '../Notification/Notification';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    itemId: null,
    itemName: ''
  });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const unsubscribe = inventoryService.subscribeToInventory((updatedInventory) => {
      setInventory(updatedInventory);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredInventory = inventory.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    return 'N/A';
  };

  const handleDelete = async () => {
    try {
      await inventoryService.deleteItem(confirmDialog.itemId);
      showNotification('success', `${confirmDialog.itemName} has been deleted`);
    } catch (error) {
      console.error('Error deleting item:', error);
      showNotification('error', 'Failed to delete item. Please try again.');
    } finally {
      setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
    }
  };

  const showDeleteConfirm = (id, name) => {
    setConfirmDialog({
      isOpen: true,
      itemId: id,
      itemName: name
    });
  };

  if (loading) {
    return <div className="loading">Loading inventory...</div>;
  }

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>Inventory List</h1>
        <div className="inventory-search-box">
          <span className="material-icons">search</span>
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="inventory-table-wrapper">
        {filteredInventory.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons">inventory_2</span>
            <p>No inventory items found</p>
          </div>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>ITEM NAME</th>
                <th>QUANTITY</th>
                <th>UNIT</th>
                <th>LAST UPDATED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => (
                <tr key={item.id}>
                  <td>{item.itemName}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td>{formatTimestamp(item.lastUpdated)}</td>
                  <td>
                    <button
                      className="inventory-delete-btn"
                      onClick={() => showDeleteConfirm(item.id, item.itemName)}
                    >
                      <span className="material-icons">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete Inventory Item"
        message={`Are you sure you want to delete ${confirmDialog.itemName}?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, itemId: null, itemName: '' })}
      />
    </div>
  );
};

export default Inventory; 