import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import './SalesCounter.css';

const SalesCounter = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [groupedSales, setGroupedSales] = useState({});

  useEffect(() => {
    let q;
    if (dateFilter) {
      const startDate = new Date(dateFilter);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateFilter);
      endDate.setHours(23, 59, 59, 999);
      
      q = query(
        collection(db, 'sales'),
        where('saleDate', '>=', Timestamp.fromDate(startDate)),
        where('saleDate', '<=', Timestamp.fromDate(endDate)),
        orderBy('saleDate', 'desc'),
        orderBy('lastUpdated', 'desc')
      );
    } else {
      q = query(
        collection(db, 'sales'),
        orderBy('saleDate', 'desc'),
        orderBy('lastUpdated', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      {
        next: (snapshot) => {
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
            setLoading(false);
          } catch (err) {
            console.error('Error processing sales data:', err);
            setError('Error loading sales data');
            setLoading(false);
          }
        },
        error: (err) => {
          console.error('Error fetching sales:', err);
          setError('Error loading sales data');
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [dateFilter]);

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
                {sales.map((sale) => (
                  <div key={sale.id} className="sales-counter__item">
                    <div className="sales-counter__item-details">
                      <span className="sales-counter__product-name">
                        {sale.productName}
                      </span>
                      <span className="sales-counter__quantity">
                        {sale.quantity} {sale.quantity > 1 ? 'items' : 'item'}
                      </span>
                      <span className="sales-counter__category">
                        {sale.category}
                      </span>
                    </div>
                    <div className="sales-counter__date">
                      {sale.lastUpdated?.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SalesCounter; 