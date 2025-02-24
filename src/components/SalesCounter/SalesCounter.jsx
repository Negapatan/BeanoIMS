import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, limit, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import './SalesCounter.css';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import Notification from '../Notification/Notification';

const SalesCounter = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [groupedSales, setGroupedSales] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [notification, setNotification] = useState(null);
  const { userRole } = useAuth();

  console.log('Current user role in SalesCounter:', userRole);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    let q;
    if (dateFilter) {
      const startDate = new Date(dateFilter);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateFilter);
      endDate.setHours(23, 59, 59, 999);
      
      q = query(
        collection(db, 'sales'),
        where('saleDate', '>=', startDate),
        where('saleDate', '<=', endDate),
        orderBy('lastUpdated', 'desc')
      );
    } else {
      // Limit the initial fetch to last 7 days
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      lastWeek.setHours(0, 0, 0, 0);
      
      q = query(
        collection(db, 'sales'),
        where('saleDate', '>=', lastWeek),
        orderBy('saleDate', 'desc'),
        limit(100)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const salesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            productName: data.productName,
            category: data.category,
            quantity: data.quantity,
            ingredients: data.ingredients,
            saleDate: data.saleDate?.toDate(),
            lastUpdated: data.lastUpdated?.toDate()
          };
        });

        // Group sales by date
        const grouped = salesData.reduce((acc, sale) => {
          const dateKey = sale.saleDate.toDateString();
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(sale);
          return acc;
        }, {});

        setGroupedSales(grouped);
        setError(null);
      } catch (err) {
        console.error('Error processing sales data:', err);
        setError('Error loading sales data');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [dateFilter]);

  const handleDeleteClick = (sale) => {
    console.log('Delete clicked. User role:', userRole);
    console.log('Can delete?', userRole === 'admin' || userRole === 'superadmin');
    if (!(userRole === 'admin' || userRole === 'superadmin')) {
      showNotification('error', 'Only admin can delete sales');
      return;
    }
    setSelectedSale(sale);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDoc(doc(db, 'sales', selectedSale.id));
      setShowDeleteConfirm(false);
      setSelectedSale(null);
      showNotification('success', 'Sale deleted successfully');
    } catch (error) {
      console.error('Error deleting sale:', error);
      showNotification('error', 'Failed to delete sale');
    }
  };

  return (
    <div className="sales-counter">
      <div className="sales-counter__header">
        <div className="sales-counter__title">
          <span className="material-icons">receipt_long</span>
          <h1>Record</h1>
        </div>
        <div className="sales-counter__filter">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>
      {loading ? (
        <div className="sales-counter__loading">Loading sales data...</div>
      ) : error ? (
        <div className="sales-counter__error">{error}</div>
      ) : Object.keys(groupedSales).length === 0 ? (
        <div className="sales-counter__empty">No sales records found</div>
      ) : (
        <div className="sales-counter__list">
          {Object.entries(groupedSales).map(([date, sales]) => (
            <div key={date} className="sales-counter__date-group">
              <div className="sales-counter__date-header">
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="sales-counter__items">
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th className="sales-table__product-col">Product Name</th>
                      <th className="sales-table__quantity-col">Quantity</th>
                      <th className="sales-table__category-col">Category</th>
                      <th className="sales-table__time-col">Time</th>
                      <th className="sales-table__action-col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr key={sale.id} className="sales-table__row">
                        <td className="sales-table__product-col">
                          {sale.productName}
                        </td>
                        <td className="sales-table__quantity-col">
                          <span className="quantity-badge">
                            {sale.quantity} {sale.quantity > 1 ? 'items' : 'item'}
                          </span>
                        </td>
                        <td className="sales-table__category-col">
                          <span className="category-badge">
                            {sale.category}
                          </span>
                        </td>
                        <td className="sales-table__time-col">
                          {sale.lastUpdated?.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="sales-table__action-col">
                          <div className="sales-table__delete-wrapper">
                            <button
                              className="sales-table__delete-btn"
                              onClick={() => handleDeleteClick(sale)}
                              style={{
                                opacity: userRole === 'admin' || userRole === 'superadmin' ? 1 : 0.3,
                                cursor: userRole === 'admin' || userRole === 'superadmin' ? 'pointer' : 'not-allowed'
                              }}
                              title={userRole === 'admin' || userRole === 'superadmin' ? 
                                "Delete sale" : "Only admin can delete sales"}
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
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        message="Are you sure you want to delete this sale?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSelectedSale(null);
        }}
      />

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

export default SalesCounter; 