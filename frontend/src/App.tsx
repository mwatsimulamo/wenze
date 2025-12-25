import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import { ExchangeRateProvider } from './context/ExchangeRateContext';
import { BlockchainProvider } from './context/BlockchainContext';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Products = lazy(() => import('./pages/Products'));
const CreateProduct = lazy(() => import('./pages/CreateProduct'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const SellerProfile = lazy(() => import('./pages/SellerProfile'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const AdminProducts = lazy(() => import('./pages/AdminProducts'));
const AdminRewards = lazy(() => import('./pages/AdminRewards'));
const EditProduct = lazy(() => import('./pages/EditProduct'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const RewardsClaim = lazy(() => import('./pages/RewardsClaim'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="p-10 text-center">Chargement...</div>;
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Redirect authenticated users away from auth pages
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="p-10 text-center">Chargement...</div>;
  
  if (user) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BlockchainProvider>
        <ExchangeRateProvider>
          <ToastProvider>
            <Router>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Auth pages - Full screen without Layout */}
                <Route path="/login" element={
                  <AuthRoute>
                    <Login />
                  </AuthRoute>
                } />
                <Route path="/signup" element={
                  <AuthRoute>
                    <Signup />
                  </AuthRoute>
                } />
                <Route path="/forgot-password" element={
                  <AuthRoute>
                    <ForgotPassword />
                  </AuthRoute>
                } />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* All other pages with Layout */}
                <Route path="/*" element={
                  <Layout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/products/:id" element={<ProductDetail />} />
                        <Route path="/seller/:id" element={<SellerProfile />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/rewards/claim" element={
                          <ProtectedRoute>
                            <RewardsClaim />
                          </ProtectedRoute>
                        } />
                        <Route path="/products/new" element={
                          <ProtectedRoute>
                            <CreateProduct />
                          </ProtectedRoute>
                        } />
                        <Route path="/products/:id/edit" element={
                          <ProtectedRoute>
                            <EditProduct />
                          </ProtectedRoute>
                        } />
                        
                        {/* Protected Routes */}
                        <Route path="/dashboard" element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        } />
                        <Route path="/orders" element={
                          <ProtectedRoute>
                            <Orders />
                          </ProtectedRoute>
                        } />
                        <Route path="/orders/:id" element={
                          <ProtectedRoute>
                            <OrderDetail />
                          </ProtectedRoute>
                        } />
                        <Route path="/admin/products" element={
                          <ProtectedRoute>
                            <AdminProducts />
                          </ProtectedRoute>
                        } />
                        <Route path="/admin/rewards" element={
                          <ProtectedRoute>
                            <AdminRewards />
                          </ProtectedRoute>
                        } />
                      </Routes>
                    </Suspense>
                  </Layout>
                } />
              </Routes>
            </Suspense>
          </Router>
        </ToastProvider>
      </ExchangeRateProvider>
      </BlockchainProvider>
    </AuthProvider>
  );
}

export default App;

