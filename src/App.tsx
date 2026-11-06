import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AdminRoute } from './components/auth/ProtectedRoutes';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { Toaster } from 'sonner';

// Public Customer Pages
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderSuccess } from './pages/OrderSuccess';
import { StaticPage } from './pages/StaticPage';
import AdminLogin from './pages/auth/AdminLogin';
import { AccessDenied } from './pages/auth/AccessDenied';

// Admin CMS Pages
import { AdminLayout } from './pages/admin/Layout';
import { AdminDashboard } from './pages/admin/Dashboard';
import { Products } from './pages/admin/catalog/Products';
import { ProductForm } from './pages/admin/catalog/ProductForm';
import { Inventory } from './pages/admin/catalog/Inventory';
import { Categories } from './pages/admin/catalog/Categories';
import { Orders } from './pages/admin/sales/Orders';
import { OrderDetail } from './pages/admin/sales/OrderDetail';
import { Customers } from './pages/admin/customers/Customers';
import { Expenses } from './pages/admin/finance/Expenses';
import { Reports } from './pages/admin/finance/Reports';
import { HomepageBuilder } from './pages/admin/cms/HomepageBuilder';
import { MediaLibrary } from './pages/admin/media/MediaLibrary';
import { StoreSettingsPage } from './pages/admin/settings/StoreSettings';

import { FlyToCartAnimation } from './components/ui/FlyToCartAnimation';
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes React Query caching
      refetchOnWindowFocus: false,
    }
  }
});

import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname, search } = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Dynamic canonical & Open Graph URL management with production domain https://snapgem.in
    const canonicalUrl = `https://snapgem.in${pathname}`;
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    let ogUrl = document.querySelector("meta[property='og:url']") as HTMLMetaElement;
    if (ogUrl) {
      ogUrl.content = canonicalUrl;
    }
  }, [pathname, search]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <ScrollToTop />
            <ErrorBoundary>
              <Routes>
                {/* 1. Customer Storefront Routes */}
                <Route element={<CustomerLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route path="/page/:slug" element={<StaticPage />} />
                </Route>

                {/* 2. Standalone Admin Auth Pages */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/access-denied" element={<AccessDenied />} />

                {/* 3. Protected Admin Panel Routes */}
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  
                  {/* Products & Inventory */}
                  <Route path="products" element={<Products />} />
                  <Route path="products/new" element={<ProductForm />} />
                  <Route path="products/:id" element={<ProductForm />} />
                  <Route path="inventory" element={<Inventory />} />
                  
                  {/* Categories */}
                  <Route path="categories" element={<Categories />} />
                  
                  {/* Orders & Customers */}
                  <Route path="orders" element={<Orders />} />
                  <Route path="orders/:id" element={<OrderDetail />} />
                  <Route path="customers" element={<Customers />} />
                  
                  {/* Finance & Reports */}
                  <Route path="expenses" element={<Expenses />} />
                  <Route path="reports" element={<Reports />} />

                  {/* Homepage Builder */}
                  <Route path="homepage-builder" element={<HomepageBuilder />} />
                  
                  {/* Media Library */}
                  <Route path="media" element={<MediaLibrary />} />

                  {/* Settings */}
                  <Route path="settings" element={<StoreSettingsPage />} />
                </Route>
                
                {/* 4. Global Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Toaster position="bottom-right" />
              <FlyToCartAnimation />
            </ErrorBoundary>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
