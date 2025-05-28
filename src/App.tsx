import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProductsPage from './pages/products/ProductsPage';
import ProductFormPage from './pages/products/ProductFormPage';
import SalesPage from './pages/sales/SalesPage';
import NewSalePage from './pages/sales/NewSalePage';
import SaleDetailsPage from './pages/sales/SaleDetailsPage';
import PurchasesPage from './pages/purchases/PurchasesPage';
import NewPurchasePage from './pages/purchases/NewPurchasePage';
import PurchaseDetailsPage from './pages/purchases/PurchaseDetailsPage';
import CustomersPage from './pages/customers/CustomersPage';
import CustomerFormPage from './pages/customers/CustomerFormPage';
import SuppliersPage from './pages/Suppliers/SuppliersPage';
import SupplierFormPage from './pages/Suppliers/SupplierFormPage';
import UsersPage from './pages/users/UsersPage';
import UserFormPage from './pages/users/UsersFormPage';
import SettingsPage from './pages/settings/SettingsPage';
import Layout from './components/layout/Layout';
import './index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/new" element={<ProductFormPage />} />
              <Route path="products/edit/:id" element={<ProductFormPage />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="sales/new" element={<NewSalePage />} />
              <Route path="sales/:id" element={<SaleDetailsPage />} />
              <Route path="purchases" element={<PurchasesPage />} />
              <Route path="purchases/new" element={<NewPurchasePage />} />
              <Route path="purchases/:id" element={<PurchaseDetailsPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/new" element={<CustomerFormPage />} />
              <Route path="customers/edit/:id" element={<CustomerFormPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="suppliers/new" element={<SupplierFormPage />} />
              <Route path="suppliers/edit/:id" element={<SupplierFormPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="users/new" element={<UserFormPage />} />
              <Route path="users/edit/:id" element={<UserFormPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;