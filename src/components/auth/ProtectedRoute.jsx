/* eslint-disable react/prop-types */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Spinner from "../Spinner";
import EmptyState from "../EmptyState";

/**
 * Enhanced protected route component with role-based access control
 * Supports multiple roles, permissions, and redirect logic
 */
// eslint-disable-next-line react/prop-types
export default function ProtectedRoute({
  children,
  requiredRole = null,
  requiredPermission = null,
  allowedRoles = [],
  fallbackRoute = "/auth",
  loadingComponent = null,
  unauthorizedComponent = null,
}) {
  const {
    isLoading,
    isAuthenticated,
    role,
    isAuthorized,
    hasPermission,
    isError,
    error,
  } = useAuth();
  const location = useLocation();

  // Show loading state - wait for auth to be fully initialized
  if (isLoading || role === null) {
    return (
      loadingComponent || (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="text-center">
            <Spinner />
            <p className="mt-4 text-purple-600 font-medium">
              Kimlik doğrulama kontrol ediliyor...
            </p>
          </div>
        </div>
      )
    );
  }

  // Handle authentication errors
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
        <EmptyState
          title="Kimlik Doğrulama Hatası"
          description={
            error || "Bir hata oluştu. Lütfen tekrar giriş yapmayı deneyin."
          }
          actionLabel="Giriş Sayfasına Git"
          actionUrl="/auth"
        />
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to={fallbackRoute}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Check role-based access with multiple allowed roles
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      unauthorizedComponent || (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
          <EmptyState
            title="Yetkisiz Erişim"
            description={`Bu sayfaya erişim için ${allowedRoles.join(
              " veya "
            )} rolü gereklidir. Mevcut rolünüz: ${role}`}
            actionLabel="Ana Sayfaya Dön"
            actionUrl="/"
          />
        </div>
      )
    );
  }

  // Check specific role requirement
  if (requiredRole && !isAuthorized(requiredRole)) {
    return (
      unauthorizedComponent || (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
          <EmptyState
            title="Yetkisiz Erişim"
            description={`Bu sayfaya erişim için ${requiredRole} rolü gereklidir.`}
            actionLabel="Ana Sayfaya Dön"
            actionUrl="/"
          />
        </div>
      )
    );
  }

  // Check specific permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      unauthorizedComponent || (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
          <EmptyState
            title="Yetkisiz Erişim"
            description="Bu işlem için gerekli yetkiye sahip değilsiniz."
            actionLabel="Ana Sayfaya Dön"
            actionUrl="/"
          />
        </div>
      )
    );
  }

  // All checks passed, render the protected content
  return children;
}

/**
 * Higher-order component for protecting routes
 */
export function withAuth(Component, options = {}) {
  return function AuthenticatedComponent(props) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Role-specific route protection components
 */
// eslint-disable-next-line react/prop-types
export function AdminRoute({ children, ...props }) {
  return (
    <ProtectedRoute requiredRole="admin" fallbackRoute="/auth" {...props}>
      {children}
    </ProtectedRoute>
  );
}

// eslint-disable-next-line react/prop-types
export function SellerRoute({ children, ...props }) {
  return (
    <ProtectedRoute
      allowedRoles={["seller", "admin"]}
      fallbackRoute="/auth"
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

// eslint-disable-next-line react/prop-types
export function UserRoute({ children, ...props }) {
  return (
    <ProtectedRoute requiredRole="user" fallbackRoute="/auth" {...props}>
      {children}
    </ProtectedRoute>
  );
}
