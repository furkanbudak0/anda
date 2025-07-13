import { useState } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  useAddresses,
  useAddAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from "../hooks/useAddresses";
import Spinner from "./Spinner";
import EmptyState from "./EmptyState";

export default function AddressManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const { data: addresses, isLoading } = useAddresses();
  const addAddress = useAddAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefaultAddress = useSetDefaultAddress();

  const handleAddAddress = (addressData) => {
    addAddress.mutate(addressData, {
      onSuccess: () => {
        setShowAddForm(false);
      },
    });
  };

  const handleUpdateAddress = (addressData) => {
    updateAddress.mutate(addressData, {
      onSuccess: () => {
        setEditingAddress(null);
      },
    });
  };

  const handleDeleteAddress = (addressId) => {
    if (window.confirm("Bu adresi silmek istediğinizden emin misiniz?")) {
      deleteAddress.mutate(addressId);
    }
  };

  const handleSetDefault = (addressId) => {
    setDefaultAddress.mutate(addressId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Adreslerim
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Yeni Adres Ekle
        </button>
      </div>

      {/* Add Address Form */}
      {showAddForm && (
        <AddressForm
          onSubmit={handleAddAddress}
          onCancel={() => setShowAddForm(false)}
          isLoading={addAddress.isPending}
        />
      )}

      {/* Edit Address Form */}
      {editingAddress && (
        <AddressForm
          address={editingAddress}
          onSubmit={handleUpdateAddress}
          onCancel={() => setEditingAddress(null)}
          isLoading={updateAddress.isPending}
        />
      )}

      {/* Addresses List */}
      {addresses && addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => setEditingAddress(address)}
              onDelete={() => handleDeleteAddress(address.id)}
              onSetDefault={() => handleSetDefault(address.id)}
              isSettingDefault={setDefaultAddress.isPending}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Henüz adresiniz yok"
          description="İlk adresinizi ekleyerek başlayın"
          actionLabel="Adres Ekle"
          onAction={() => setShowAddForm(true)}
          icon={MapPinIcon}
        />
      )}
    </div>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isSettingDefault,
}) {
  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-xl border-2 transition-all ${
        address.is_default
          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
          : "border-gray-200 dark:border-gray-700 hover:border-brand-300"
      }`}
    >
      {/* Default Badge */}
      {address.is_default && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-brand-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircleIcon className="w-3 h-3" />
            Varsayılan
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Address Name */}
        <div className="flex items-center gap-2 mb-3">
          <MapPinIcon className="w-5 h-5 text-brand-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {address.address_name || "Adresim"}
          </h3>
        </div>

        {/* Address Details */}
        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300 mb-4">
          <p className="font-medium">{address.full_name}</p>
          <p>{address.address_line}</p>
          {address.address_line_2 && <p>{address.address_line_2}</p>}
          <p>
            {address.district}, {address.city} {address.postal_code}
          </p>
          <p>{address.country}</p>
          {address.phone && <p>Tel: {address.phone}</p>}
        </div>

        {/* Address Type */}
        <div className="mb-4">
          <span
            className={`inline-block px-2 py-1 text-xs rounded-full ${
              address.address_type === "both"
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                : address.address_type === "billing"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            }`}
          >
            {address.address_type === "both"
              ? "Fatura & Teslimat"
              : address.address_type === "billing"
              ? "Fatura Adresi"
              : "Teslimat Adresi"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!address.is_default && (
            <button
              onClick={onSetDefault}
              disabled={isSettingDefault}
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              {isSettingDefault ? "Ayarlanıyor..." : "Varsayılan Yap"}
            </button>
          )}

          <button
            onClick={onEdit}
            className="text-xs bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 px-3 py-1 rounded-lg hover:bg-brand-200 dark:hover:bg-brand-800 transition-colors flex items-center gap-1"
          >
            <PencilIcon className="w-3 h-3" />
            Düzenle
          </button>

          <button
            onClick={onDelete}
            className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-3 py-1 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors flex items-center gap-1"
          >
            <TrashIcon className="w-3 h-3" />
            Sil
          </button>
        </div>
      </div>
    </div>
  );
}

function AddressForm({ address, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    address_name: address?.address_name || "",
    full_name: address?.full_name || "",
    phone: address?.phone || "",
    address_line: address?.address_line || "",
    address_line_2: address?.address_line_2 || "",
    district: address?.district || "",
    city: address?.city || "",
    postal_code: address?.postal_code || "",
    country: address?.country || "Türkiye",
    address_type: address?.address_type || "shipping",
    is_default: address?.is_default || false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const submitData = address ? { id: address.id, ...formData } : formData;

    onSubmit(submitData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {address ? "Adresi Düzenle" : "Yeni Adres Ekle"}
        </h3>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Adres Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address_name"
              value={formData.address_name}
              onChange={handleChange}
              placeholder="Ev, İşyerim, Annem..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ad Soyad <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Telefon
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Adres Türü <span className="text-red-500">*</span>
            </label>
            <select
              name="address_type"
              value={formData.address_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="shipping">Teslimat Adresi</option>
              <option value="billing">Fatura Adresi</option>
              <option value="both">Fatura & Teslimat</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Adres Satırı 1 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="address_line"
            value={formData.address_line}
            onChange={handleChange}
            placeholder="Sokak, Mahalle, Bina No"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Adres Satırı 2
          </label>
          <input
            type="text"
            name="address_line_2"
            value={formData.address_line_2}
            onChange={handleChange}
            placeholder="Daire No, Kat, vb."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              İlçe <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="district"
              value={formData.district}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              İl <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Posta Kodu
            </label>
            <input
              type="text"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_default"
            name="is_default"
            checked={formData.is_default}
            onChange={handleChange}
            className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label
            htmlFor="is_default"
            className="text-sm text-gray-700 dark:text-gray-300"
          >
            Bu adresi varsayılan adres olarak ayarla
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-brand-600 text-white py-2 px-4 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Kaydediliyor..." : address ? "Güncelle" : "Kaydet"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
}
