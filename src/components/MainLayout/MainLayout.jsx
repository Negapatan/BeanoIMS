import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import './MainLayout.css';
import Sidebar from '../Sidebar/Sidebar';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className={`main-layout ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="top-bar">
        <h2>Beano Management System</h2>
      </div>
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout; 