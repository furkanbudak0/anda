import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import Spinner from "../components/Spinner";
import EditSellerModal from "../components/EditSellerModal";
import {
  getSellerById,
  updateSellerStatus,
  getProductsBySeller,
} from "../services/apiSellers";

const AdminProfile = () => {
  const { sellerId } = useParams();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    data: seller,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["seller", sellerId],
    queryFn: () => getSellerById(sellerId),
    enabled: !!sellerId,
  });

  const { data: products } = useQuery({
    queryKey: ["seller-products", sellerId],
    queryFn: () => getProductsBySeller(sellerId),
    enabled: !!sellerId,
  });

  const statusMutation = useMutation(updateSellerStatus, {
    onSuccess: () => {
      toast.success("Satıcı durumu güncellendi");
      refetch();
    },
    onError: (error) => {
      toast.error(`Durum güncelleme hatası: ${error.message}`);
    },
  });

  const handleStatusChange = (newStatus) => {
    if (!seller) return;
    if (
      newStatus === "suspended" &&
      !confirm("Askıya almak istediğinize emin misiniz?")
    ) {
      return;
    }

    statusMutation.mutate({
      sellerId: seller.id,
      status: newStatus,
    });
  };

  if (isLoading) return <Spinner fullPage />;
  if (error)
    return (
      <div className="text-center text-red-600 py-8">Hata: {error.message}</div>
    );
  if (!seller) return <div className="text-center py-8">Satıcı bulunamadı</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{seller.business_name}</h2>
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Bilgileri Düzenle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <p>
            <strong>Durum:</strong> {seller.status}
          </p>
          <p>
            <strong>Doğrulama:</strong> {seller.verification_status}
          </p>
          <p>
            <strong>Email:</strong> {seller.email}
          </p>
          <p>
            <strong>Telefon:</strong> {seller.phone}
          </p>
          <p>
            <strong>Website:</strong>{" "}
            <a href={seller.website} className="text-blue-500 underline">
              {seller.website}
            </a>
          </p>
          <p>
            <strong>Vergi No:</strong> {seller.tax_id}
          </p>
          <p>
            <strong>Kategori:</strong> {seller.categories}
          </p>
        </div>
        <div>
          <p>
            <strong>Yetkili:</strong> {seller.owner_first_name}{" "}
            {seller.owner_last_name}
          </p>
          <p>
            <strong>Yetkili Email:</strong> {seller.owner_email}
          </p>
          <p>
            <strong>Yetkili Telefon:</strong> {seller.owner_phone}
          </p>
          <p>
            <strong>TCKN:</strong> {seller.owner_id_number}
          </p>
          <p>
            <strong>Doğum Tarihi:</strong> {seller.owner_dob}
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => handleStatusChange("approved")}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Onayla
        </button>
        <button
          onClick={() => handleStatusChange("suspended")}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Askıya Al
        </button>
        <button
          onClick={() => handleStatusChange("rejected")}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reddet
        </button>
      </div>

      <h3 className="text-xl font-semibold mb-2">Ürünler</h3>
      {products && products.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product) => (
            <li key={product.uuid} className="border p-4 rounded shadow-sm">
              <p className="font-bold">{product.name}</p>
              <p>{product.description}</p>
              <p>Stok: {product.availableStock}</p>
              <p>Fiyat: {product.regularPrice} ₺</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Bu satıcıya ait ürün bulunamadı.</p>
      )}

      <EditSellerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        seller={seller}
        onSuccess={refetch}
      />
    </div>
  );
};

export default AdminProfile;
