import CheckoutForm from "../components/checkout/CheckoutForm";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { apiOrders } from "../services/apiOrders";
import { useNotifications } from "../utils/notifications";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function Checkout() {
  const { items } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotifications();

  // Express checkout state'i
  const [expressCheckout, setExpressCheckout] = useState(false);
  const [expressProduct, setExpressProduct] = useState(null);
  const [expressQuantity, setExpressQuantity] = useState(1);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Express checkout kontrolü
    if (location.state?.expressCheckout) {
      setExpressCheckout(true);
      setExpressProduct(location.state.productId);
      setExpressQuantity(location.state.quantity || 1);
    } else {
      // Normal checkout - sepet boşsa geri dön
      if (!items || items.length === 0) {
        navigate("/cart");
        return;
      }
    }
  }, [user, items, navigate, location.state]);

  // Sipariş sonrası notification tetikleme
  const handleOrderSuccess = async (order) => {
    // Kullanıcıya notification
    await apiOrders.sendOrderNotification({
      userId: user.id,
      orderId: order.id,
      type: "order",
      title: "Siparişiniz alındı!",
      message: `Siparişiniz başarıyla oluşturuldu. Sipariş No: ${order.order_number}`,
      actionUrl: `/order-success/${order.id}`,
    });

    addNotification({
      title: "Siparişiniz başarıyla oluşturuldu!",
      message: `Siparişiniz alındı. Sipariş No: ${order.order_number}`,
      showToast: true,
    });

    navigate(`/order-success/${order.id}`);
  };

  const handleBackToCart = () => {
    navigate("/cart");
  };

  const handleBackToProduct = () => {
    if (expressProduct) {
      navigate(`/product/${expressProduct}`);
    } else {
      navigate("/");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={expressCheckout ? handleBackToProduct : handleBackToCart}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            {expressCheckout ? "Ürüne Geri Dön" : "Sepete Geri Dön"}
          </button>

          <h1 className="text-2xl font-bold text-gray-900">
            {expressCheckout ? "Hızlı Ödeme" : "Ödeme ve Sipariş"}
          </h1>

          {expressCheckout && (
            <p className="text-gray-600 mt-2">
              Tek ürün hızlı satın alma işlemi
            </p>
          )}
        </div>

        <CheckoutForm
          onOrderSuccess={handleOrderSuccess}
          expressCheckout={expressCheckout}
          expressProduct={expressProduct}
          expressQuantity={expressQuantity}
        />
      </div>
    </div>
  );
}
