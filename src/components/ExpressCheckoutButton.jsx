import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BoltIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { notifications } from "../utils/notifications";
import PropTypes from "prop-types";

export default function ExpressCheckoutButton({ product, quantity, variant }) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleExpressCheckout = async () => {
    if (!user) {
      toast.error("Hızlı ödeme için giriş yapmanız gerekiyor");
      navigate("/login", { state: { from: `/product/${product?.uuid}` } });
      return;
    }

    if (!product) {
      toast.error("Ürün bilgisi bulunamadı");
      return;
    }

    if ((product.stock ?? 0) < quantity) {
      toast.error("Yeterli stok bulunmuyor");
      return;
    }

    setIsLoading(true);

    try {
      // Direkt checkout sayfasına yönlendir (sepete eklemeden)
      navigate("/checkout", {
        state: {
          expressCheckout: true,
          productId: product.uuid,
          quantity: quantity,
          variant: variant,
        },
      });

      notifications.success("Hızlı ödeme sayfasına yönlendiriliyorsunuz");
    } catch (error) {
      console.error("Express checkout error:", error);
      toast.error("Hızlı ödeme işlemi başarısız oldu");
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled =
    !product || isLoading || !product.stock || product.stock < quantity;

  return (
    <motion.button
      onClick={handleExpressCheckout}
      disabled={isDisabled}
      className={`
        w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-white
        transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
        ${
          isDisabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl"
        }
      `}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <BoltIcon className="w-5 h-5" />
      )}
      <span>
        {isLoading ? "İşleniyor..." : isDisabled ? "Stokta Yok" : "Hızlı Ödeme"}
      </span>
    </motion.button>
  );
}

ExpressCheckoutButton.propTypes = {
  product: PropTypes.shape({
    uuid: PropTypes.string,
    stock: PropTypes.number,
  }),
  quantity: PropTypes.number,
  variant: PropTypes.object,
};
