/* eslint-disable react/prop-types */
import { useAuth } from "../../contexts/AuthContext";

/**
 * Role-based conditional rendering component
 * Allows fine-grained control over UI elements based on user roles and permissions
 */
export default function RoleGuard({
  children,
  role = null,
  roles = [],
  permission = null,
  permissions = [],
  fallback = null,
  requireAll = false,
  inverse = false,
}) {
  const {
    role: userRole,
    hasPermission,
    hasRoleLevel,
    isAuthenticated,
  } = useAuth();

  // If not authenticated, don't render anything (unless inverse is true)
  if (!isAuthenticated) {
    return inverse ? children : fallback || null;
  }

  let hasAccess = true;

  // Check single role requirement
  if (role && !hasRoleLevel(role)) {
    hasAccess = false;
  }

  // Check multiple roles (user must have at least one)
  if (roles.length > 0) {
    const hasAnyRole = roles.some((r) => hasRoleLevel(r));
    if (!hasAnyRole) {
      hasAccess = false;
    }
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    hasAccess = false;
  }

  // Check multiple permissions
  if (permissions.length > 0) {
    if (requireAll) {
      // User must have ALL permissions
      const hasAllPermissions = permissions.every((p) => hasPermission(p));
      if (!hasAllPermissions) {
        hasAccess = false;
      }
    } else {
      // User must have at least ONE permission
      const hasAnyPermission = permissions.some((p) => hasPermission(p));
      if (!hasAnyPermission) {
        hasAccess = false;
      }
    }
  }

  // Apply inverse logic if specified
  const shouldRender = inverse ? !hasAccess : hasAccess;

  return shouldRender ? children : fallback || null;
}

/**
 * Specific role guard components for common use cases
 */

// eslint-disable-next-line react/prop-types
export function AdminOnly({ children, fallback = null }) {
  return (
    <RoleGuard role="admin" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function SellerOnly({ children, fallback = null }) {
  return (
    <RoleGuard roles={["seller", "admin"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function UserOnly({ children, fallback = null }) {
  return (
    <RoleGuard role="user" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function AuthenticatedOnly({ children, fallback = null }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : fallback || null;
}

export function GuestOnly({ children, fallback = null }) {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : fallback || null;
}

/**
 * Permission-based guards
 */
export function PermissionGuard({ permission, children, fallback = null }) {
  return (
    <RoleGuard permission={permission} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function MultiPermissionGuard({
  permissions = [],
  requireAll = false,
  children,
  fallback = null,
}) {
  return (
    <RoleGuard
      permissions={permissions}
      requireAll={requireAll}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}
