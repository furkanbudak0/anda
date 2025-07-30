import { useAuth } from "../contexts/AuthContext";
import OrderManagement from "../components/seller/OrderManagement";

export default function SellerOrderManagement() {
  const { user } = useAuth();

  if (!user?.seller_id) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Satıcı Hesabı Gerekli
            </h1>
            <p className="text-gray-600">
              Bu sayfayı görüntülemek için satıcı hesabınız olmalıdır.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sipariş Yönetimi
          </h1>
          <p className="text-gray-600">
            Siparişlerinizi takip edin ve kargo bilgilerini güncelleyin
          </p>
        </div>

        {/* Sipariş Yönetimi Bileşeni */}
        <OrderManagement sellerId={user.seller_id} />
      </div>
    </div>
  );
}
