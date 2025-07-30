import React, { useEffect, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  UserIcon,
  BellIcon,
  ClockIcon,
} from "@heroicons/react/20/solid";
import { Link, NavLink } from "react-router-dom";
import { HeartIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";
import supabase from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useFavorites } from "../contexts/FavoritesContext";
import { useCart } from "../contexts/CartContext";

// Modern turuncu tonlu ANDA logo SVG
const AndaLogo = () => (
  <svg
    width="130"
    height="40"
    viewBox="0 0 120 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block" }}
  >
    <defs>
      <linearGradient
        id="anda-orange"
        x1="0"
        y1="0"
        x2="120"
        y2="36"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#F97316" />
        <stop offset="1" stopColor="#EA580C" />
      </linearGradient>
    </defs>
    <text
      x="0"
      y="28"
      fontFamily="Montserrat, Arial, sans-serif"
      fontWeight="bold"
      fontSize="28"
      fill="url(#anda-orange)"
    >
      ANDA
    </text>
  </svg>
);

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const NavBar = () => {
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout } = useAuth();
  const { favoritesCount } = useFavorites();
  const { cartCount } = useCart();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true);

      if (!error && data) {
        // Ana ve alt kategorileri grupla
        const mainCats = data.filter((cat) => !cat.parent_id);
        const subCats = data.filter((cat) => cat.parent_id);
        setCategories(
          mainCats.map((cat) => ({
            ...cat,
            subcategories: subCats.filter((sub) => sub.parent_id === cat.id),
          }))
        );
      }
    };
    fetchCategories();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(
        searchQuery
      )}`;
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Çıkış yapılırken hata:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-orange-100 shadow-sm">
      {/* Ana Bar: Logo, Arama, Profil */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center flex-shrink-0 hover:scale-105 transition-transform"
        >
          <AndaLogo />
        </Link>

        {/* Satıcı/Admin Paneli Butonu */}
        {user &&
          (user.user_metadata?.role === "seller" ||
            user.user_metadata?.role === "admin") && (
            <div className="flex-1 flex justify-center">
              {user.user_metadata?.role === "seller" && (
                <NavLink
                  to="/seller/dashboard"
                  className="mx-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg shadow-md hover:from-orange-600 hover:to-amber-600 text-sm font-semibold transition"
                >
                  Satıcı Paneli
                </NavLink>
              )}
              {user.user_metadata?.role === "admin" && (
                <NavLink
                  to="/admin/dashboard"
                  className="mx-2 px-4 py-2 bg-gradient-to-r from-orange-700 to-amber-700 text-white rounded-lg shadow-md hover:from-orange-800 hover:to-amber-800 text-sm font-semibold transition"
                >
                  Admin Paneli
                </NavLink>
              )}
            </div>
          )}

        {/* Arama */}
        <form
          onSubmit={handleSearch}
          className="flex-1 mx-4 max-w-md hidden md:block"
        >
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ürün, kategori veya marka ara..."
              className="w-full pl-10 pr-4 py-2 border border-orange-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white/80 shadow-sm text-sm"
            />
          </div>
        </form>
        {/* Sağ: Bildirim ve Profil */}
        <div className="flex items-center space-x-2">
          {/* Favoriler Butonu */}
          <NavLink
            to="/favorites"
            className="relative p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
            title="Favorilerim"
          >
            <HeartIcon className="w-6 h-6" />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {favoritesCount}
              </span>
            )}
          </NavLink>
          {/* Sepet Butonu */}
          <NavLink
            to="/cart"
            className="relative p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
            title="Sepetim"
          >
            <ShoppingCartIcon className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </NavLink>
          {user && (
            <Link
              to="/notifications"
              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
            >
              <BellIcon className="w-5 h-5" />
            </Link>
          )}
          {/* Kullanıcı Profili */}
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 hidden sm:block">
                Merhaba, {user.user_metadata?.full_name || "Kullanıcı"}
              </span>
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center space-x-2 p-1 rounded-lg hover:bg-orange-50 transition">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Profil"
                      className="w-8 h-8 rounded-full object-cover border-2 border-orange-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-orange-600" />
                    </div>
                  )}
                  <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                </Menu.Button>
                <Transition
                  as={React.Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-150"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <div className="relative z-[1100]">
                    <Menu.Items className="absolute right-0 mt-2 w-44 bg-white/95 backdrop-blur rounded-xl shadow-xl ring-1 ring-orange-200 border border-orange-100 focus:outline-none z-[1100]">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/dashboard"
                              className={classNames(
                                active
                                  ? "bg-orange-50 text-orange-700"
                                  : "text-orange-600",
                                "block px-4 py-2 text-xs font-medium"
                              )}
                            >
                              Profilim
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/favorites"
                              className={classNames(
                                active
                                  ? "bg-orange-50 text-orange-700"
                                  : "text-orange-600",
                                "block px-4 py-2 text-xs font-medium"
                              )}
                            >
                              Favorilerim
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleSignOut}
                              className={classNames(
                                active
                                  ? "bg-orange-50 text-orange-700"
                                  : "text-orange-600",
                                "block w-full text-left px-4 py-2 text-xs font-medium"
                              )}
                            >
                              Çıkış Yap
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </div>
                </Transition>
              </Menu>
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 text-xs font-medium shadow-md transition"
            >
              <UserIcon className="w-4 h-4" />
              <span>Giriş Yap</span>
            </Link>
          )}
        </div>
      </div>
      {/* Mobil arama butonu */}
      <div className="flex md:hidden px-2 pb-2">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ara..."
              className="w-full pl-10 pr-4 py-2 border border-orange-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white/80 shadow-sm text-sm"
            />
          </div>
        </form>
      </div>
      {/* Kategoriler: Kompakt, yatay scroll, hover ile açılır menü */}
      <div className="border-t border-orange-100 bg-white/80 backdrop-blur-sm w-full">
        <div className="flex flex-row flex-wrap justify-center items-center gap-2 py-2 w-full">
          {/* Yeni Ürünler Butonu */}
          <Link
            to="/products?new=true"
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-orange-50 focus:outline-none transition whitespace-nowrap border border-transparent hover:border-orange-200 text-black"
            style={{ minHeight: 36 }}
          >
            <ClockIcon className="w-4 h-4 mr-1 text-green-600" />
            Yeni Ürünler
          </Link>
          {categories.map((cat) => (
            <div key={cat.id} className="relative group">
              <button
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-orange-50 focus:outline-none transition whitespace-nowrap border border-transparent hover:border-orange-200 text-black"
                style={{ minHeight: 36 }}
                onMouseEnter={() => setActiveTab(cat.id)}
                onMouseLeave={() => setActiveTab(null)}
                onFocus={() => setActiveTab(cat.id)}
                onBlur={() => setActiveTab(null)}
              >
                {/* Emoji kaldırıldı */}
                {cat.name}
                {cat.subcategories.length > 0 && (
                  <ChevronDownIcon
                    className="ml-1 h-3 w-3 text-orange-400"
                    aria-hidden="true"
                  />
                )}
              </button>
              {cat.subcategories.length > 0 && activeTab === cat.id && (
                <div
                  className="absolute left-1/2 top-full bg-white border border-orange-100 shadow-xl rounded-b-lg z-40 flex flex-row flex-wrap justify-center py-2"
                  style={{
                    minWidth: "200px",
                    width: `${Math.max(200, cat.subcategories.length * 140)}px`,
                    transform: "translateX(-50%)",
                  }}
                  onMouseEnter={() => setActiveTab(cat.id)}
                  onMouseLeave={() => setActiveTab(null)}
                >
                  {cat.subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/category/${sub.slug}`}
                      className="mx-2 px-4 py-2 text-xs flex items-center rounded-md hover:bg-orange-50 text-black transition"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
