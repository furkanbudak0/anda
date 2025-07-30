import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AppProvider } from "./contexts/AppProvider";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { CartProvider } from "./contexts/CartContext";

// AddressProvider kaldırıldı
import { ToastContainer } from "./utils/notifications"; // Bildirim sistemi
import NavBar from "./components/NavBar";
import Homepage from "./pages/Homepage";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import SimpleCart from "./pages/SimpleCart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import AuthTabs from "./pages/AuthTabs";
import UserDashboard from "./pages/UserDashboard";
import MyProducts from "./pages/MyProducts";
import FavList from "./pages/FavList";
import SimpleFavorites from "./pages/SimpleFavorites";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import FAQ from "./pages/FAQ";
import Orders from "./pages/Orders";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import PageNotFound from "./pages/PageNotFound";
import BestSellers from "./pages/BestSellers";
import NewAddeds from "./pages/NewAddeds";
import ForgotPassword from "./pages/ForgotPassword";
import OrderDetail from "./pages/OrderDetail";
import OrderTracking from "./pages/OrderTracking";
import LatestProducts from "./pages/LatestProducts";
import NotificationsPage from "./pages/notifications";
import DistanceSalesAgreement from "./pages/DistanceSalesAgreement";

// Seller pages
import SellerDashboard from "./pages/SellerDashboard";
import SellerProfile from "./pages/SellerProfile";
import SellerOrders from "./pages/SellerOrders";
import SellerInventory from "./pages/SellerInventory";
import SellerAnalytics from "./pages/SellerAnalytics";
import SellerOrderManagement from "./pages/SellerOrderManagement";

// Admin pages
import AdminSetup from "./pages/AdminSetup";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProfile from "./pages/AdminProfile";

// Admin Management pages
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminSellerManagement from "./pages/admin/AdminSellerManagement";
import AdminCategoryManagement from "./pages/admin/AdminCategoryManagement";
import AdminCampaignManagement from "./pages/admin/AdminCampaignManagement";
import AdminCampaignPriorityManagement from "./pages/admin/AdminCampaignPriorityManagement";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminCouponManagement from "./pages/admin/AdminCouponManagement";
import AdminMessagesSystem from "./pages/admin/AdminMessagesSystem";
import AdminSettingsPanel from "./pages/admin/AdminSettingsPanel";
import AdminSiteContent from "./pages/admin/AdminSiteContent";

import AdminSellerAgreements from "./pages/admin/AdminSellerAgreements";
import AdminFeaturePlaceholder from "./pages/admin/AdminFeaturePlaceholder";

// Yeni admin component'leri
import AdminRoleManagement from "./pages/admin/AdminRoleManagement";
import AdminSuspensions from "./pages/admin/AdminSuspensions";
import AdminAlgorithmManagement from "./pages/admin/AdminAlgorithmManagement";
import AdminEmailTemplates from "./pages/admin/AdminEmailTemplates";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminPaymentManagement from "./pages/admin/AdminPaymentManagement";
import AdminShippingManagement from "./pages/admin/AdminShippingManagement";
import AdminBackupManagement from "./pages/admin/AdminBackupManagement";
import AdminApiManagement from "./pages/admin/AdminApiManagement";
import AdminPerformanceMonitoring from "./pages/admin/AdminPerformanceMonitoring";
import AdminSeoManagement from "./pages/admin/AdminSeoManagement";
import AdminMobileApp from "./pages/admin/AdminMobileApp";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";

// Route guards
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleGuard from "./components/auth/RoleGuard";

// Error boundary
import ErrorBoundary from "./components/ErrorBoundary";

// Layout component to conditionally show NavBar
// eslint-disable-next-line react/prop-types
function Layout({ children }) {
  const location = useLocation();

  // Auth ve admin sayfalarında NavBar'ı gizle
  const hideNavBarPaths = [
    "/auth",
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
        <FavoritesProvider>
          <CartProvider>
            {/* AddressProvider kaldırıldı */}
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
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
                  <Route path="/simple-cart" element={<SimpleCart />} />
                  <Route path="/auth" element={<AuthTabs />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/best-sellers" element={<BestSellers />} />
                  <Route path="/new-arrivals" element={<NewAddeds />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/track-order" element={<OrderTracking />} />
                  <Route
                    path="/track/:trackingCode"
                    element={<OrderTracking />}
                  />

                  <Route path="/latest-products" element={<LatestProducts />} />

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
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <Orders />
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
                    path="/simple-favorites"
                    element={
                      <ProtectedRoute>
                        <SimpleFavorites />
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
                  <Route
                    path="/order/:orderId"
                    element={
                      <ProtectedRoute>
                        <OrderDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/order/:orderId/tracking"
                    element={
                      <ProtectedRoute>
                        <OrderTracking />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <NotificationsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/distance-sales-agreement"
                    element={<DistanceSalesAgreement />}
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
                    path="/seller/:sellerSlug"
                    element={<SellerProfile />}
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
                  <Route
                    path="/seller/order-management"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["seller"]}>
                          <SellerOrderManagement />
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

                  {/* Admin Management Routes */}
                  <Route
                    path="/admin/users"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminUserManagement />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/sellers"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminSellerManagement />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/categories"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminCategoryManagement />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/campaigns"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminCampaignManagement />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/campaign-priority"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminCampaignPriorityManagement />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/analytics"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminAnalytics />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/reviews"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminReviews />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/coupons"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminCouponManagement />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/messages"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminMessagesSystem />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/settings"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminSettingsPanel />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/content"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminSiteContent />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/agreements"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminSellerAgreements />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/features"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminFeaturePlaceholder />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* Yeni Admin Route'ları */}
                  <Route
                    path="/admin/roles"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminRoleManagement />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/suspensions"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminSuspensions />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/algorithm"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminAlgorithmManagement />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/emails"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminEmailTemplates />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/notifications"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminNotifications />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/payments"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminPaymentManagement />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/shipping"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminShippingManagement />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/backups"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminBackupManagement />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/api"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminApiManagement />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/performance"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminPerformanceMonitoring />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/seo"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminSeoManagement />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/mobile"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminMobileApp />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/audit"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={["admin"]}>
                          <AdminAuditLogs />
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
          </CartProvider>
        </FavoritesProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
