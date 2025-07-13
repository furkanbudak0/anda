/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  CreditCardIcon,
  TruckIcon,
  MapPinIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useCart } from "../../contexts/CartContext";

import { useAddresses } from "../../hooks/useAddresses";
import { usePaymentMethods } from "../../hooks/usePaymentMethods";
import { formatPrice } from "../../utils/formatters";
import toast from "react-hot-toast";

/**
 * Enhanced multi-step checkout form with real address and payment selection
 */
export default function CheckoutForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [sellerNotes, setSellerNotes] = useState({});

  const navigate = useNavigate();
  const { cartState, clearCart } = useCart();
  const { user } = useAuth();

  // Fetch user addresses and payment methods
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const { data: paymentMethods = [], isLoading: paymentsLoading } =
    usePaymentMethods();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      shipping_method: "standard",
      payment_method: "credit_card",
    },
  });

  // Steps configuration
  const steps = [
    {
      id: 1,
      title: "Teslimat Adresi",
      icon: MapPinIcon,
      description: "Adres seçimi veya yeni adres",
    },
    {
      id: 2,
      title: "Kargo Seçimi",
      icon: TruckIcon,
      description: "Teslimat yöntemi seçin",
    },
    {
      id: 3,
      title: "Ödeme",
      icon: CreditCardIcon,
      description: "Ödeme yöntemi seçin",
    },
    {
      id: 4,
      title: "Onay",
      icon: CheckCircleIcon,
      description: "Sipariş özeti ve notlar",
    },
  ];

  // Redirect if cart is empty
  useEffect(() => {
    if (cartState.items.length === 0) {
      navigate("/cart");
    }
  }, [cartState.items.length, navigate]);

  // Auto-select default address and payment method
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddress =
        addresses.find((addr) => addr.is_default) || addresses[0];
      setSelectedAddress(defaultAddress);
    }
  }, [addresses, selectedAddress]);

  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPaymentMethod) {
      const defaultPayment =
        paymentMethods.find((pm) => pm.is_default) || paymentMethods[0];
      setSelectedPaymentMethod(defaultPayment);
    }
  }, [paymentMethods, selectedPaymentMethod]);

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 1 && !selectedAddress) {
      toast.error("Lütfen bir teslimat adresi seçin");
      return;
    }
    if (currentStep === 3 && !selectedPaymentMethod) {
      toast.error("Lütfen bir ödeme yöntemi seçin");
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      if (!selectedAddress || !selectedPaymentMethod) {
        throw new Error("Adres ve ödeme yöntemi seçilmeli");
      }

      // Group items by seller
      const sellerGroups = cartState.items.reduce((groups, item) => {
        const sellerId = item.seller_id || "default";
        if (!groups[sellerId]) {
          groups[sellerId] = [];
        }
        groups[sellerId].push(item);
        return groups;
      }, {});

      // Create separate orders for each seller
      const orderPromises = Object.entries(sellerGroups).map(
        async ([sellerId, items]) => {
          const sellerTotal = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );
          const sellerNote = sellerNotes[sellerId] || "";

          const orderPayload = {
            seller_id: sellerId === "default" ? null : sellerId,
            items: items,
            shipping_address_id: selectedAddress.id,
            payment_method_id: selectedPaymentMethod.id,
            shipping_method: data.shipping_method,
            subtotal: sellerTotal,
            tax_amount: sellerTotal * 0.18, // 18% KDV
            total_amount: sellerTotal * 1.18,
            seller_note: sellerNote,
            order_status: "pending",
            payment_status: "pending",
          };

          // Submit order to API
          const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(orderPayload),
          });

          if (!response.ok) {
            throw new Error("Sipariş oluşturulamadı");
          }

          return response.json();
        }
      );

      const orders = await Promise.all(orderPromises);

      // Clear cart
      clearCart();

      // Redirect to success page with first order
      navigate(`/order-success/${orders[0].id}`, {
        state: { orders },
      });

      toast.success(`${orders.length} sipariş başarıyla oluşturuldu!`);
    } catch (error) {
      console.error("Order error:", error);
      toast.error(error.message || "Sipariş oluşturulurken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (addressesLoading || paymentsLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Steps Header */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-center space-x-8">
            {steps.map((step) => (
              <li key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.id
                      ? "bg-brand-600 border-brand-600 text-white"
                      : "border-gray-300 text-gray-500"
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      currentStep >= step.id
                        ? "text-brand-600"
                        : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
                {step.id < steps.length && (
                  <div
                    className={`w-16 h-0.5 ml-4 ${
                      currentStep > step.id ? "bg-brand-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <AddressStep
                addresses={addresses}
                selectedAddress={selectedAddress}
                onSelectAddress={setSelectedAddress}
              />
            )}
            {currentStep === 2 && (
              <ShippingStep register={register} errors={errors} />
            )}
            {currentStep === 3 && (
              <PaymentStep
                paymentMethods={paymentMethods}
                selectedPaymentMethod={selectedPaymentMethod}
                onSelectPaymentMethod={setSelectedPaymentMethod}
              />
            )}
            {currentStep === 4 && (
              <ConfirmationStep
                selectedAddress={selectedAddress}
                selectedPaymentMethod={selectedPaymentMethod}
                cartState={cartState}
                sellerNotes={sellerNotes}
                onSellerNotesChange={setSellerNotes}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Geri
              </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                >
                  İleri
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Sipariş Veriliyor..." : "Siparişi Tamamla"}
                  <CheckCircleIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary cartState={cartState} />
          </div>
        </div>
      </form>
    </div>
  );
}

// Address Selection Step
function AddressStep({ addresses, selectedAddress, onSelectAddress }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Teslimat Adresi Seçin
      </h2>

      {addresses.length === 0 ? (
        <div className="text-center py-8">
          <MapPinIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Henüz kayıtlı adresiniz yok</p>
          <button className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
            Yeni Adres Ekle
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              onClick={() => onSelectAddress(address)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedAddress?.id === address.id
                  ? "border-brand-600 bg-brand-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {address.address_name || "Adres"}
                    </h3>
                    {address.is_default && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Varsayılan
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{address.full_name}</p>
                  <p className="text-gray-600 text-sm">
                    {address.address_line_1}
                    {address.address_line_2 && `, ${address.address_line_2}`}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {address.city}, {address.state_province}{" "}
                    {address.postal_code}
                  </p>
                  {address.phone && (
                    <p className="text-gray-600 text-sm">
                      Tel: {address.phone}
                    </p>
                  )}
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    selectedAddress?.id === address.id
                      ? "border-brand-600 bg-brand-600"
                      : "border-gray-300"
                  }`}
                >
                  {selectedAddress?.id === address.id && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-brand-600 hover:text-brand-600 transition-colors">
            <PlusIcon className="w-5 h-5 mx-auto mb-2" />
            Yeni Adres Ekle
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Shipping step component
 */
function ShippingStep({ register, errors }) {
  const shippingOptions = [
    {
      id: "standard",
      name: "Standart Kargo",
      description: "3-5 iş günü",
      price: 19.99,
      estimated_delivery: "3-5 iş günü",
    },
    {
      id: "express",
      name: "Hızlı Kargo",
      description: "1-2 iş günü",
      price: 39.99,
      estimated_delivery: "1-2 iş günü",
    },
    {
      id: "premium",
      name: "Premium Kargo",
      description: "Aynı gün teslimat",
      price: 59.99,
      estimated_delivery: "Aynı gün",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Kargo Seçimi</h2>

      <div className="space-y-4">
        {shippingOptions.map((option) => (
          <label
            key={option.id}
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-brand-300 transition-colors"
          >
            <input
              type="radio"
              value={option.id}
              {...register("shipping_method", {
                required: "Kargo yöntemi seçin",
              })}
              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300"
            />
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{option.name}</h3>
                  <p className="text-sm text-gray-600">{option.description}</p>
                  <p className="text-sm text-gray-500">
                    Tahmini teslimat: {option.estimated_delivery}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatPrice(option.price)}
                  </p>
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>

      {errors.shipping_method && (
        <p className="text-red-600 text-sm mt-2">
          {errors.shipping_method.message}
        </p>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2">
          <TruckIcon className="w-5 h-5 text-blue-600" />
          <h4 className="font-medium text-blue-900">Kargo Bilgileri</h4>
        </div>
        <ul className="mt-2 text-sm text-blue-800 space-y-1">
          <li>• Siparişiniz onaylandıktan sonra kargoya verilir</li>
          <li>• Kargo takip numarası SMS ile gönderilir</li>
          <li>• Adresinizde kimse yoksa komşunuza teslim edilir</li>
          <li>• 150₺ ve üzeri siparişlerde kargo ücretsiz</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Payment step component
 */
function PaymentStep({
  paymentMethods,
  selectedPaymentMethod,
  onSelectPaymentMethod,
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Ödeme Yöntemi Seçin
      </h2>

      {paymentMethods.length === 0 ? (
        <div className="text-center py-8">
          <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            Henüz kayıtlı ödeme yönteminiz yok
          </p>
          <button className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
            Yeni Kart Ekle
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((payment) => (
            <div
              key={payment.id}
              onClick={() => onSelectPaymentMethod(payment)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedPaymentMethod?.id === payment.id
                  ? "border-brand-600 bg-brand-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded">
                    {payment.card_type === "credit" ? "KREDİ" : "BANKAMAT"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {payment.card_name}
                      </h3>
                      {payment.is_default && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Varsayılan
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">
                      {payment.card_number_masked}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {payment.card_holder_name} • {payment.expiry_month}/
                      {payment.expiry_year}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    selectedPaymentMethod?.id === payment.id
                      ? "border-brand-600 bg-brand-600"
                      : "border-gray-300"
                  }`}
                >
                  {selectedPaymentMethod?.id === payment.id && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-brand-600 hover:text-brand-600 transition-colors">
            <PlusIcon className="w-5 h-5 mx-auto mb-2" />
            Yeni Kart Ekle
          </button>
        </div>
      )}

      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 text-green-600" />
          <h4 className="font-medium text-green-900">Güvenli Ödeme</h4>
        </div>
        <ul className="mt-2 text-sm text-green-800 space-y-1">
          <li>• Tüm ödemeler SSL ile şifrelenir</li>
          <li>• Kart bilgileriniz güvenle saklanır</li>
          <li>• 3D Secure ile onaylanır</li>
          <li>• Tek tıkla ödeme imkanı</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Confirmation step component
 */
function ConfirmationStep({
  selectedAddress,
  selectedPaymentMethod,
  cartState,
  sellerNotes,
  onSellerNotesChange,
}) {
  // Group items by seller for notes
  const sellerGroups = cartState.items.reduce((groups, item) => {
    const sellerId = item.seller_id || "default";
    const sellerName = item.seller_name || "ANDA Mağaza";
    if (!groups[sellerId]) {
      groups[sellerId] = {
        sellerId,
        sellerName,
        items: [],
        total: 0,
      };
    }
    groups[sellerId].items.push(item);
    groups[sellerId].total += item.price * item.quantity;
    return groups;
  }, {});

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Sipariş Onayı
      </h2>

      {/* Order Details */}
      <div className="space-y-6">
        {/* Address Information */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="font-medium text-gray-900 mb-2">Teslimat Adresi</h3>
          <div className="text-sm text-gray-600">
            <p className="font-medium">{selectedAddress?.address_name}</p>
            <p>{selectedAddress?.full_name}</p>
            <p>
              {selectedAddress?.address_line_1}
              {selectedAddress?.address_line_2 &&
                `, ${selectedAddress.address_line_2}`}
            </p>
            <p>
              {selectedAddress?.city}, {selectedAddress?.state_province}{" "}
              {selectedAddress?.postal_code}
            </p>
            {selectedAddress?.phone && <p>Tel: {selectedAddress.phone}</p>}
          </div>
        </div>

        {/* Payment Information */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="font-medium text-gray-900 mb-2">Ödeme Yöntemi</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded">
              {selectedPaymentMethod?.card_type === "credit"
                ? "KREDİ"
                : "BANKAMAT"}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {selectedPaymentMethod?.card_name}
              </p>
              <p className="text-sm text-gray-600">
                {selectedPaymentMethod?.card_number_masked}
              </p>
            </div>
          </div>
        </div>

        {/* Seller Notes */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Satıcı Notları</h3>
          {Object.values(sellerGroups).map((group) => (
            <div
              key={group.sellerId}
              className="border border-gray-200 rounded-lg p-4"
            >
              <h4 className="font-medium text-gray-900 mb-2">
                {group.sellerName} ({group.items.length} ürün -{" "}
                {formatPrice(group.total)})
              </h4>
              <textarea
                value={sellerNotes[group.sellerId] || ""}
                onChange={(e) =>
                  onSellerNotesChange({
                    ...sellerNotes,
                    [group.sellerId]: e.target.value,
                  })
                }
                placeholder="Bu satıcıya özel not ekleyebilirsiniz..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
                rows="2"
              />
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="border-t border-gray-200 pt-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Ara Toplam:</span>
              <span>{formatPrice(cartState.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>KDV (%18):</span>
              <span>{formatPrice(cartState.taxAmount)}</span>
            </div>
            {cartState.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>İndirim:</span>
                <span>-{formatPrice(cartState.discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-lg">
              <span>Toplam:</span>
              <span className="text-brand-600">
                {formatPrice(cartState.total)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Önemli:</strong> Siparişinizi onayladıktan sonra ödeme
            işlemi gerçekleştirilecek. Siparişinizi iptal etmek için 24 saat
            içinde müşteri hizmetleri ile iletişime geçin.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Order summary sidebar
 */
function OrderSummary({ cartState }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Sipariş Özeti
      </h2>

      {/* Cart Items */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {cartState.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <img
              src={item.image || "/placeholder-product.jpg"}
              alt={item.name}
              className="w-12 h-12 object-cover rounded-lg"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.name}
              </p>
              <p className="text-sm text-gray-500">
                {item.quantity} x {formatPrice(item.price)}
              </p>
              {item.seller && (
                <p className="text-xs text-gray-400">{item.seller}</p>
              )}
            </div>
            <div className="text-sm font-medium text-gray-900">
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Ara Toplam ({cartState.itemCount} ürün):</span>
          <span>{formatPrice(cartState.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>KDV (%18):</span>
          <span>{formatPrice(cartState.taxAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Kargo:</span>
          <span>Ücretsiz</span>
        </div>
        {cartState.discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>İndirim:</span>
            <span>-{formatPrice(cartState.discountAmount)}</span>
          </div>
        )}
        <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-lg">
          <span>Toplam:</span>
          <span className="text-brand-600">{formatPrice(cartState.total)}</span>
        </div>
      </div>

      {/* Security Badge */}
      <div className="mt-4 p-3 bg-green-50 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-900">
            Güvenli Ödeme
          </span>
        </div>
        <p className="text-xs text-green-700 mt-1">
          SSL sertifikası ile korunmaktadır
        </p>
      </div>
    </div>
  );
}
