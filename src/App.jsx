import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.js';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import LoginBeano from './components/LoginBeano/LoginBeano';
import Signup from './components/Signup/Signup';
import ForgotPassword from './components/ForgotPassword/ForgotPassword';
import MainLayout from './components/MainLayout/MainLayout';
import Inventory from './components/Inventory/Inventory';
import AddInventory from './components/AddInventory/AddInventory';
import AddRecipe from './components/AddRecipe/AddRecipe';
import RecordSale from './components/RecordSale/RecordSale';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginBeano />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<MainLayout />}>
                <Route path="inventory" element={<Inventory />} />
                <Route path="add-inventory" element={<AddInventory />} />
                <Route path="add-recipe" element={<AddRecipe />} />
                <Route path="add-sale" element={<RecordSale />} />
                <Route index element={<Navigate to="/dashboard/inventory" replace />} />
              </Route>
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 