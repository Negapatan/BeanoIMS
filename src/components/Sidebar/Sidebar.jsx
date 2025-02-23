import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    {
      section: 'Management',
      items: [
        {
          path: '/dashboard/inventory',
          name: 'Inventory List',
          icon: 'inventory_2'
        }
      ]
    },
    {
      section: 'Sales',
      items: [
        {
          path: '/dashboard/add-sale',
          name: 'Record Sale',
          icon: 'add_shopping_cart'
        },
        {
          path: '/dashboard/sales-counter',
          name: 'Sales Counter',
          icon: 'analytics'
        }
      ]
    },
    {
      section: 'Add New',
      items: [
        {
          path: '/dashboard/add-inventory',
          name: 'Add Item',
          icon: 'add_box'
        },
        {
          path: '/dashboard/add-recipe',
          name: 'Add Recipe',
          icon: 'menu_book'
        }
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">BEANO</h2>
        <div className="toggle-btn" onClick={toggleSidebar}>
          <span className="material-icons">
            {isOpen ? 'chevron_left' : 'menu'}
          </span>
        </div>
      </div>
      <div className="sidebar-content">
        <nav className="sidebar-menu">
          {menuItems.map((section, index) => (
            <div key={index} className="menu-section">
              <div className="section-title">
                <span className="section-text">{section.section}</span>
              </div>
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
                  title={item.name}
                >
                  <span className="material-icons menu-icon">{item.icon}</span>
                  <span className="menu-text">{item.name}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button 
            className="logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <span className="material-icons menu-icon">logout</span>
            <span className="menu-text">Logout</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        message="Are you sure you want to logout?"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

export default Sidebar; 