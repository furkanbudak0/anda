import { useState } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XMarkIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import notifications from "../utils/notifications.jsx";
import {
  usePaymentMethods,
  useAddPaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  useSetDefaultPaymentMethod,
} from "../hooks/usePaymentMethods";
import { useAddresses } from "../hooks/useAddresses";
import Spinner from "./Spinner";
import EmptyState from "./EmptyState";

export default function PaymentMethodsManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  const { data: paymentMethods, isLoading } = usePaymentMethods();
  const { data: addresses } = useAddresses();
  const addPaymentMethod = useAddPaymentMethod();
  const updatePaymentMethod = useUpdatePaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();
  const setDefaultPaymentMethod = useSetDefaultPaymentMethod();

  const handleAddCard = (cardData) => {
    addPaymentMethod.mutate(cardData, {
      onSuccess: () => {
        setShowAddForm(false);
      },
    });
  };

  const handleUpdateCard = (cardData) => {
    updatePaymentMethod.mutate(cardData, {
      onSuccess: () => {
        setEditingCard(null);
      },
    });
  };

  const handleDeleteCard = (cardId) => {
    if (window.confirm("Bu kartı silmek istediğinizden emin misiniz?")) {
      deletePaymentMethod.mutate(cardId);
    }
  };

  const handleSetDefault = (cardId) => {
    setDefaultPaymentMethod.mutate(cardId);
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Ödeme Yöntemlerim
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Kartlarınızı güvenli şekilde saklayın ve isimlendirin
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Kart Ekle
        </button>
      </div>

      {/* Add Card Form */}
      {showAddForm && (
        <CardForm
          addresses={addresses || []}
          onSubmit={handleAddCard}
          onCancel={() => setShowAddForm(false)}
          isLoading={addPaymentMethod.isPending}
        />
      )}

      {/* Edit Card Form */}
      {editingCard && (
        <CardForm
          card={editingCard}
          addresses={addresses || []}
          onSubmit={handleUpdateCard}
          onCancel={() => setEditingCard(null)}
          isLoading={updatePaymentMethod.isPending}
        />
      )}

      {/* Cards List */}
      {paymentMethods && paymentMethods.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethods.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              onEdit={() => setEditingCard(card)}
              onDelete={() => handleDeleteCard(card.id)}
              onSetDefault={() => handleSetDefault(card.id)}
              isSettingDefault={setDefaultPaymentMethod.isPending}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Henüz kartınız yok"
          description="İlk ödeme yönteminizi ekleyerek başlayın"
          actionLabel="Kart Ekle"
          onAction={() => setShowAddForm(true)}
          icon={CreditCardIcon}
        />
      )}

      {/* Security Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Güvenlik Bilgisi
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Kart bilgileriniz şifrelenmiş olarak saklanır. Gerçek kart
              numaranız hiçbir zaman tam olarak gösterilmez.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardItem({ card, onEdit, onDelete, onSetDefault, isSettingDefault }) {
  const getCardBrand = (maskedNumber) => {
    if (maskedNumber.startsWith("4")) return "Visa";
    if (maskedNumber.startsWith("5")) return "Mastercard";
    if (maskedNumber.startsWith("3")) return "American Express";
    return "Kart";
  };

  const getCardColor = (maskedNumber) => {
    if (maskedNumber.startsWith("4"))
      return "bg-gradient-to-r from-blue-600 to-blue-700";
    if (maskedNumber.startsWith("5"))
      return "bg-gradient-to-r from-red-600 to-red-700";
    if (maskedNumber.startsWith("3"))
      return "bg-gradient-to-r from-green-600 to-green-700";
    return "bg-gradient-to-r from-gray-600 to-gray-700";
  };

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-xl border-2 transition-all ${
        card.is_default
          ? "border-brand-500 ring-2 ring-brand-200 dark:ring-brand-800"
          : "border-gray-200 dark:border-gray-700 hover:border-brand-300"
      }`}
    >
      {/* Default Badge */}
      {card.is_default && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-brand-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircleIcon className="w-3 h-3" />
            Varsayılan
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Card Visual */}
        <div
          className={`${getCardColor(
            card.card_number_masked
          )} rounded-lg p-4 text-white mb-4 relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-bold">{card.card_name}</span>
              <div className="text-xs font-medium bg-white/20 px-2 py-1 rounded">
                {getCardBrand(card.card_number_masked)}
              </div>
            </div>

            <div className="text-lg font-mono tracking-wider mb-2">
              {card.card_number_masked}
            </div>

            <div className="flex items-center justify-between text-xs">
              <div>
                <div className="text-white/70 mb-1">Kart Sahibi</div>
                <div className="font-medium">{card.card_holder_name}</div>
              </div>
              <div className="text-right">
                <div className="text-white/70 mb-1">Son Kullanma</div>
                <div className="font-medium">
                  {card.expiry_month}/{card.expiry_year}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Type */}
        <div className="mb-4">
          <span
            className={`inline-block px-2 py-1 text-xs rounded-full ${
              card.card_type === "credit"
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            }`}
          >
            {card.card_type === "credit" ? "Kredi Kartı" : "Banka Kartı"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!card.is_default && (
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

function CardForm({ card, addresses, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    card_name: card?.card_name || "",
    card_type: card?.card_type || "credit",
    card_number: "", // We never show the actual card number
    card_holder_name: card?.card_holder_name || "",
    expiry_month: card?.expiry_month || "",
    expiry_year: card?.expiry_year || "",
    cvv: "",
    billing_address_id: card?.billing_address_id || "",
    is_default: card?.is_default || false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate card number (basic check)
    if (!card && (!formData.card_number || formData.card_number.length < 16)) {
      notifications.formValidationError("kart numarası");
      return;
    }

    const submitData = card ? { id: card.id, ...formData } : formData;

    onSubmit(submitData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = value;

    // Format card number
    if (name === "card_number") {
      processedValue = value.replace(/\D/g, "").slice(0, 16);
    }

    // Format month/year
    if (name === "expiry_month") {
      processedValue = value.replace(/\D/g, "").slice(0, 2);
    }
    if (name === "expiry_year") {
      processedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    // Format CVV
    if (name === "cvv") {
      processedValue = value.replace(/\D/g, "").slice(0, 3);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : processedValue,
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {card ? "Kartı Düzenle" : "Yeni Kart Ekle"}
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
              Kart Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="card_name"
              value={formData.card_name}
              onChange={handleChange}
              placeholder="Ziraat Kartım, İş Bankası Kartım..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kart Türü <span className="text-red-500">*</span>
            </label>
            <select
              name="card_type"
              value={formData.card_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="credit">Kredi Kartı</option>
              <option value="debit">Banka Kartı</option>
            </select>
          </div>
        </div>

        {!card && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kart Numarası <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="card_number"
              value={formData.card_number}
              onChange={handleChange}
              placeholder="1234 5678 9012 3456"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kart Sahibinin Adı <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="card_holder_name"
            value={formData.card_holder_name}
            onChange={handleChange}
            placeholder="JOHN DOE"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ay <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="expiry_month"
              value={formData.expiry_month}
              onChange={handleChange}
              placeholder="MM"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Yıl <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="expiry_year"
              value={formData.expiry_year}
              onChange={handleChange}
              placeholder="YYYY"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {!card && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CVV <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="cvv"
                value={formData.cvv}
                onChange={handleChange}
                placeholder="123"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fatura Adresi
          </label>
          <select
            name="billing_address_id"
            value={formData.billing_address_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Adres seçin...</option>
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.address_name} - {address.address_line}, {address.city}
              </option>
            ))}
          </select>
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
            Bu kartı varsayılan ödeme yöntemi olarak ayarla
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-brand-600 text-white py-2 px-4 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Kaydediliyor..." : card ? "Güncelle" : "Kaydet"}
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
