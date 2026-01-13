import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import InventoryIntelligence from './pages/InventoryIntelligence';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import PurchaseOrders from './pages/PurchaseOrders';
import GRN from './pages/GRN';
import SupplierBills from './pages/SupplierBills';
import ProductionBatches from './pages/ProductionBatches';
import SalesDispatch from './pages/SalesDispatch';
import CustomerInvoices from './pages/CustomerInvoices';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/inventory" element={<Inventory />} />
                      <Route path="/inventory-intelligence" element={<InventoryIntelligence />} />
                      <Route path="/suppliers" element={<Suppliers />} />
                      <Route path="/customers" element={<Customers />} />
                      <Route path="/purchase-orders" element={<PurchaseOrders />} />
                      <Route path="/grn" element={<GRN />} />
                      <Route path="/supplier-bills" element={<SupplierBills />} />
                      <Route path="/production-batches" element={<ProductionBatches />} />
                      <Route path="/sales-dispatch" element={<SalesDispatch />} />
                      <Route path="/customer-invoices" element={<CustomerInvoices />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
