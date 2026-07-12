import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './routes/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/layout/AppLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';
import RequestResetPage from './pages/public/RequestResetPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductsPage from './pages/admin/ProductsPage';
import InventoryPage from './pages/admin/InventoryPage';
import UsersPage from './pages/admin/UsersPage';
import ActivityLogsPage from './pages/admin/ActivityLogsPage';
import ReportsPage from './pages/admin/ReportsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminBillsPage from './pages/admin/AdminBillsPage';
import AdminPurchasesPage from './pages/admin/AdminPurchasesPage';
import SuppliersPage from './pages/admin/SuppliersPage';
import PasswordResetAdminPage from './pages/admin/PasswordResetAdminPage';

// Purchaser Pages
import PurchaserDashboard from './pages/purchaser/PurchaserDashboard';
import CreatePurchasePage from './pages/purchaser/CreatePurchasePage';
import PurchaseHistoryPage from './pages/purchaser/PurchaseHistoryPage';

// Salesman Pages
import SalesmanDashboard from './pages/salesman/SalesmanDashboard';
import SalesmanInventory from './pages/salesman/SalesmanInventory';
import CreateBillPage from './pages/salesman/CreateBillPage';
import SalesmanBillsPage from './pages/salesman/SalesmanBillsPage';
import OrderTrackingPage from './pages/salesman/OrderTrackingPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/request-password-reset" element={<ProtectedRoute allowedRoles={['admin','purchaser','salesman']}><RequestResetPage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><Routes>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="purchases" element={<AdminPurchasesPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="bills" element={<AdminBillsPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="activity-logs" element={<ActivityLogsPage />} />
            <Route path="password-reset" element={<PasswordResetAdminPage />} />
            <Route path="" element={<Navigate to="dashboard" replace />} />
          </Routes></AppLayout></ProtectedRoute>} />

          {/* Purchaser */}
          <Route path="/purchaser/*" element={<ProtectedRoute allowedRoles={['purchaser']}><AppLayout><Routes>
            <Route path="dashboard" element={<PurchaserDashboard />} />
            <Route path="create-purchase" element={<CreatePurchasePage />} />
            <Route path="purchases" element={<PurchaseHistoryPage />} />
            <Route path="suppliers" element={<SuppliersPage readOnly />} />
            <Route path="" element={<Navigate to="dashboard" replace />} />
          </Routes></AppLayout></ProtectedRoute>} />

          {/* Salesman */}
          <Route path="/salesman/*" element={<ProtectedRoute allowedRoles={['salesman']}><AppLayout><Routes>
            <Route path="dashboard" element={<SalesmanDashboard />} />
            <Route path="inventory" element={<SalesmanInventory />} />
            <Route path="create-bill" element={<CreateBillPage />} />
            <Route path="bills" element={<SalesmanBillsPage />} />
            <Route path="orders" element={<OrderTrackingPage />} />
            <Route path="" element={<Navigate to="dashboard" replace />} />
          </Routes></AppLayout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
