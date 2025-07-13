import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserIcon,
  ShoppingBagIcon,
  HeartIcon,
  MapPinIcon,
  CreditCardIcon,
  BellIcon,
  ChartBarIcon,
  GiftIcon,
  ClockIcon,
  TruckIcon,
  CogIcon,
  XMarkIcon,
  StarIcon,
  EyeIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import NavBar from "../components/NavBar";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { Link, useNavigate } from "react-router-dom";
import { formatPrice, formatDate } from "../utils/formatters";
import toast from "react-hot-toast";

/**
 * Modern, consolidated user dashboard with enhanced UX
 * Combines account management and dashboard functionality
 */
export default function UserDashboard() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  // Fetch user orders from Supabase
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["user-orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          total_amount,
          status,
          created_at,
          tracking_number,
          order_items(
            id,
            quantity,
            product:products(
              id,
              name,
              images
            )
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching orders:", error);
        return [];
      }

      return data.map((order) => ({
        id: order.id,
        order_number: order.order_number,
        total: order.total_amount,
        status: order.status,
        created_at: order.created_at,
        items_count: order.order_items?.length || 0,
        tracking_code: order.tracking_number,
      }));
    },
    enabled: !!user?.id,
  });

  // Fetch user statistics from Supabase
  const { data: userStats } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get orders stats
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("total_amount, status")
        .eq("user_id", user.id);

      if (ordersError) {
        console.error("Error fetching order stats:", ordersError);
      }

      // Get wishlist count
      const { count: wishlistCount, error: wishlistError } = await supabase
        .from("wishlists")
        .select("*", { count: "exact" })
        .eq("user_id", user.id);

      if (wishlistError) {
        console.error("Error fetching wishlist count:", wishlistError);
      }

      // Get reviews count
      const { count: reviewsCount, error: reviewsError } = await supabase
        .from("reviews")
        .select("*", { count: "exact" })
        .eq("user_id", user.id);

      if (reviewsError) {
        console.error("Error fetching reviews count:", reviewsError);
      }

      const orders = ordersData || [];
      const totalOrders = orders.length;
      const totalSpent = orders
        .filter((order) => order.status === "delivered")
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);

      // Calculate saved amount (estimated based on discount data)
      const savedAmount = totalSpent * 0.15; // Estimate 15% savings

      // Simple loyalty points calculation
      const loyaltyPoints = Math.floor(totalSpent / 10);

      // Determine membership tier
      let membershipTier = "bronze";
      if (totalSpent > 5000) membershipTier = "gold";
      else if (totalSpent > 2000) membershipTier = "silver";

      return {
        total_orders: totalOrders,
        total_spent: totalSpent,
        saved_amount: savedAmount,
        favorite_products: wishlistCount || 0,
        loyalty_points: loyaltyPoints,
        reviews_written: reviewsCount || 0,
        membership_tier: membershipTier,
      };
    },
    enabled: !!user?.id,
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
      toast.success("Başarıyla çıkış yaptınız");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Çıkış yapılırken hata oluştu");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="pt-32 flex justify-center">
          <Spinner size="large" text="Dashboard yükleniyor..." />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="pt-32">
          <EmptyState
            title="Giriş Yapmalısınız"
            description="Kullanıcı paneline erişmek için lütfen giriş yapın."
            actionLabel="Giriş Yap"
            actionUrl="/auth"
          />
        </div>
      </div>
    );
  }

  const sidebarItems = [
    {
      id: "overview",
      label: "Genel Bakış",
      icon: ChartBarIcon,
      badge: null,
    },
    {
      id: "orders",
      label: "Siparişlerim",
      icon: ShoppingBagIcon,
      badge: orders?.filter((o) => o.status === "processing").length || null,
    },
    {
      id: "favorites",
      label: "Favorilerim",
      icon: HeartIcon,
      badge: userStats?.favorite_products || null,
    },
    {
      id: "addresses",
      label: "Adreslerim",
      icon: MapPinIcon,
      badge: null,
    },
    {
      id: "payments",
      label: "Ödeme Yöntemlerim",
      icon: CreditCardIcon,
      badge: null,
    },
    {
      id: "profile",
      label: "Profil Ayarları",
      icon: UserIcon,
      badge: null,
    },
    {
      id: "notifications",
      label: "Bildirimler",
      icon: BellIcon,
      badge: 3, // Placeholder
    },
    {
      id: "security",
      label: "Güvenlik",
      icon: ShieldCheckIcon,
      badge: null,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "shipped":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "delivered":
        return "Teslim Edildi";
      case "shipped":
        return "Kargoda";
      case "processing":
        return "Hazırlanıyor";
      case "cancelled":
        return "İptal Edildi";
      default:
        return "Bilinmiyor";
    }
  };

  const renderOverview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Hoş geldiniz,{" "}
              {user?.user_metadata?.fullName || user?.email?.split("@")[0]}! 👋
            </h2>
            <p className="text-blue-100">
              {userStats?.membership_tier === "silver" && "Gümüş"} üyemiz
              olduğunuz için teşekkürler
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {userStats?.loyalty_points || 0}
            </div>
            <div className="text-blue-100 text-sm">Puan</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Toplam Sipariş
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {userStats?.total_orders || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <ShoppingBagIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Toplam Harcama
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPrice(userStats?.total_spent || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <CreditCardIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tasarruf
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPrice(userStats?.saved_amount || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
              <GiftIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Favoriler
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {userStats?.favorite_products || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center">
              <HeartIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Son Siparişlerim
          </h3>
          <Link
            to="/user/orders"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium text-sm flex items-center"
          >
            Tümünü Gör
            <ArrowRightIcon className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.slice(0, 3).map((order) => (
              <motion.div
                key={order.id}
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <ShoppingBagIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.order_number}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.items_count} ürün • {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPrice(order.total)}
                  </p>
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusText(order.status)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Henüz siparişiniz yok"
            description="İlk siparişinizi vermek için alışverişe başlayın"
            actionLabel="Alışverişe Başla"
            actionUrl="/products"
          />
        )}
      </div>
    </motion.div>
  );

  const renderOrders = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Siparişlerim
        </h2>
        <Link
          to="/track-order"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <TruckIcon className="w-5 h-5 mr-2" />
          Sipariş Takip
        </Link>
      </div>

      {ordersLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="large" text="Siparişler yükleniyor..." />
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="grid gap-6">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              whileHover={{ scale: 1.01 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {order.order_number}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(order.created_at)} • {order.items_count} ürün
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatPrice(order.total)}
                  </p>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-3">
                  <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium text-sm flex items-center">
                    <EyeIcon className="w-4 h-4 mr-1" />
                    Detayları Gör
                  </button>
                  {order.tracking_code && (
                    <Link
                      to={`/track/${order.tracking_code}`}
                      className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 font-medium text-sm flex items-center"
                    >
                      <TruckIcon className="w-4 h-4 mr-1" />
                      Takip Et
                    </Link>
                  )}
                </div>
                {order.status === "delivered" && (
                  <button className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 font-medium text-sm flex items-center">
                    <StarIcon className="w-4 h-4 mr-1" />
                    Değerlendir
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Henüz siparişiniz yok"
          description="İlk siparişinizi vermek için alışverişe başlayın"
          actionLabel="Alışverişe Başla"
          actionUrl="/products"
        />
      )}
    </motion.div>
  );

  const renderPlaceholderSection = (title, description) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center py-12"
    >
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <CogIcon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
      <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg">
        <ClockIcon className="w-5 h-5 mr-2" />
        Yakında Geliyor
      </div>
    </motion.div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return renderOverview();
      case "orders":
        return renderOrders();
      case "favorites":
        return renderPlaceholderSection(
          "Favorilerim",
          "Beğendiğiniz ürünleri buradan yönetebileceksiniz"
        );
      case "addresses":
        return renderPlaceholderSection(
          "Adreslerim",
          "Teslimat adreslerinizi buradan yönetebileceksiniz"
        );
      case "payments":
        return renderPlaceholderSection(
          "Ödeme Yöntemlerim",
          "Kayıtlı kartlarınızı buradan yönetebileceksiniz"
        );
      case "profile":
        return renderPlaceholderSection(
          "Profil Ayarları",
          "Profil bilgilerinizi buradan güncelleyebileceksiniz"
        );
      case "notifications":
        return renderPlaceholderSection(
          "Bildirimler",
          "Bildirim tercihlerinizi buradan ayarlayabileceksiniz"
        );
      case "security":
        return renderPlaceholderSection(
          "Güvenlik",
          "Şifre ve güvenlik ayarlarınızı buradan yönetebileceksiniz"
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />

      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                {/* User Info */}
                <div className="flex items-center mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {user?.user_metadata?.fullName?.[0] ||
                      user?.email?.[0] ||
                      "U"}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user?.user_metadata?.fullName || "Kullanıcı"}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-2">
                  {sidebarItems.map((item) => (
                    <motion.button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${
                          activeSection === item.id
                            ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.label}
                      </div>
                      {item.badge && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {item.badge}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </nav>

                {/* Logout Button */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 mr-3" />
                    Çıkış Yap
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
