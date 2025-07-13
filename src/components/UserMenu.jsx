/* eslint-disable react/prop-types */
import { useState, useRef, useEffect, useId } from "react";
import { Link } from "react-router-dom";
import {
  UserIcon,
  Cog6ToothIcon,
  ShoppingBagIcon,
  HeartIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { useBringToFrontAndCenter } from "../utils/bringToFrontAndCenter";

export default function UserMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const menuId = useId();

  // Bring to front and center hook for dropdown
  const { elementRef } = useBringToFrontAndCenter(`${menuId}-dropdown`, {
    isOpen,
    type: "DROPDOWN",
    onClose: () => setIsOpen(false),
    center: false,
    trapFocus: false,
    preventBodyScroll: false,
    restoreFocus: false,
  });

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getUserDisplayName = () => {
    if (user?.full_name) {
      return user.full_name.split(" ")[0]; // First name only
    }
    return user?.email?.split("@")[0] || "Kullanıcı";
  };

  const menuItems = [
    {
      label: "Profilim",
      icon: UserIcon,
      href: "/account",
      roles: ["user", "seller", "admin"],
    },
    {
      label: "Siparişlerim",
      icon: ShoppingBagIcon,
      href: "/dashboard",
      roles: ["user", "seller", "admin"],
    },
    {
      label: "Favorilerim",
      icon: HeartIcon,
      href: "/favorites",
      roles: ["user", "seller", "admin"],
    },
    {
      label: "Satıcı Paneli",
      icon: BuildingStorefrontIcon,
      href: "/seller/dashboard",
      roles: ["seller", "admin"],
    },
    {
      label: "Admin Paneli",
      icon: Cog6ToothIcon,
      href: "/admin/dashboard",
      roles: ["admin"],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Kullanıcı menüsü - ${getUserDisplayName()}`}
      >
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        <span className="hidden md:block font-medium">
          {getUserDisplayName()}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={elementRef}
          className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-[1010] transform transition-all duration-200 scale-100 opacity-100"
          role="menu"
          aria-labelledby={`${menuId}-button`}
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white truncate">
                  {user?.full_name || "Kullanıcı"}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </div>
              </div>
            </div>
            {user?.role && (
              <div className="mt-3">
                <span
                  className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    user.role === "admin"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                      : user.role === "seller"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                  }`}
                >
                  {user.role === "admin"
                    ? "Admin"
                    : user.role === "seller"
                    ? "Satıcı"
                    : "Müşteri"}
                </span>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {filteredMenuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={handleClose}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                role="menuitem"
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
            <button
              onClick={() => {
                onLogout();
                handleClose();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              role="menuitem"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
