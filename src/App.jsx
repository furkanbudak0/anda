import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AppProvider } from "./contexts/AppProvider";
import { ToastContainer } from "./utils/notifications"; // Bildirim sistemi
import NavBar from "./components/NavBar";
import Homepage from "./pages/Homepage";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import AuthTabs from "./pages/AuthTabs";
import UserDashboard from "./pages/UserDashboard";
import MyProducts from "./pages/MyProducts";
import FavList from "./pages/FavList";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import PageNotFound from "./pages/PageNotFound";
import BestSellers from "./pages/BestSellers";
import NewAddeds from "./pages/NewAddeds";
import ForgotPassword from "./pages/ForgotPassword";
import OrderTracking from "./pages/OrderTracking";

// Seller pages
import SellerSignup from "./pages/SellerSignup";
import SellerDashboard from "./pages/SellerDashboard";
import SellerProfile from "./pages/SellerProfile";
import SellerOrders from "./pages/SellerOrders";
import SellerInventory from "./pages/SellerInventory";
import SellerAnalytics from "./pages/SellerAnalytics";

// Admin pages
import AdminSetup from "./pages/AdminSetup";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProfile from "./pages/AdminProfile";

// Route guards
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleGuard from "./components/auth/RoleGuard";

// Error boundary
import ErrorBoundary from "./components/ErrorBoundary";

// Layout component to conditionally show NavBar
function Layout({ children }) {
  const location = useLocation();

  // Auth ve admin sayfalarında NavBar'ı gizle
  const hideNavBarPaths = [
    "/auth",
    "/seller-signup",
    "/panel",
    "/admin-login",
    "/forgot-password",
  ];

  const shouldHideNavBar = hideNavBarPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {!shouldHideNavBar && <NavBar />}
      <main className={shouldHideNavBar ? "pt-8 pb-8" : "pt-24 pb-8"}>
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Homepage />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/category/:category" element={<ProductList />} />
              <Route
                path="/category/:category/:subcategory"
                element={<ProductList />}
              />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/auth" element={<AuthTabs />} />
              <Route path="/seller-signup" element={<SellerSignup />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/help" element={<Help />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/best-sellers" element={<BestSellers />} />
              <Route path="/new-arrivals" element={<NewAddeds />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/track-order" element={<OrderTracking />} />
              <Route path="/track/:trackingCode" element={<OrderTracking />} />
              <Route path="/seller/:sellerId" element={<SellerProfile />} />

              {/* Protected user routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-products"
                element={
                  <ProtectedRoute>
                    <MyProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <FavList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order-success"
                element={
                  <ProtectedRoute>
                    <OrderSuccess />
                  </ProtectedRoute>
                }
              />

              {/* Seller routes */}
              <Route
                path="/seller/dashboard"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={["seller"]}>
                      <SellerDashboard />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/profile"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={["seller"]}>
                      <SellerProfile />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/orders"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={["seller"]}>
                      <SellerOrders />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/inventory"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={["seller"]}>
                      <SellerInventory />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/analytics"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={["seller"]}>
                      <SellerAnalytics />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
              <Route path="/panel" element={<AdminSetup />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={["admin"]}>
                      <AdminPanel />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={["admin"]}>
                      <AdminDashboard />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/profile"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={["admin"]}>
                      <AdminProfile />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              {/* Catch all */}
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Layout>
          <ToastContainer />
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
