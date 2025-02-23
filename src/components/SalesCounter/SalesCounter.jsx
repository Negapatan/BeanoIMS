import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import './SalesCounter.css';

const SalesCounter = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Query to get sales ordered by date
    const q = query(
      collection(db, 'sales'),
      orderBy('lastUpdated', 'desc')
    );

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
            lastUpdated: data.lastUpdated?.toDate()
          };
        });

        setSalesData(salesData);
        setError(null);
      } catch (err) {
        console.error('Error processing sales data:', err);
        setError('Error loading sales data');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="sales-counter">
      <div className="sales-counter__header">
        <div className="sales-counter__title">
          <span className="material-icons">receipt_long</span>
          <h1>Sales Counter</h1>
        </div>
      </div>
      {loading ? (
        <div className="sales-counter__loading">Loading sales data...</div>
      ) : error ? (
        <div className="sales-counter__error">{error}</div>
      ) : salesData.length === 0 ? (
        <div className="sales-counter__empty">No sales records found</div>
      ) : (
        <div className="sales-counter__list">
          {salesData.map((sale) => (
            <div key={sale.id} className="sales-counter__item">
              <div className="sales-counter__item-details">
                <span className="sales-counter__product-name">{sale.productName}</span>
                <span className="sales-counter__quantity">
                  {sale.quantity} {sale.quantity > 1 ? 'items' : 'item'}
                </span>
                <span className="sales-counter__category">{sale.category}</span>
              </div>
              <div className="sales-counter__date">
                {sale.lastUpdated?.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SalesCounter; 