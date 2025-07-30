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
import { apiOrders } from "../../services/apiOrders";
import { useAuth } from "../../contexts/AuthContext";
import Modal from "../ui/Modal";
import { useAddPaymentMethod } from "../../hooks/usePaymentMethods";
import { useAddAddress } from "../../hooks/useAddresses";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../services/index";

/**
 * Enhanced multi-step checkout form with real address and payment selection
 */
export default function CheckoutForm({
  onOrderSuccess,
  expressCheckout = false,
  expressProduct = null,
  expressQuantity = 1,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [sellerNotes, setSellerNotes] = useState({});
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [addressForm, setAddressForm] = useState({});
  const [cardForm, setCardForm] = useState({});

  // Kupon sistemi
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const addAddress = useAddAddress();
  const addPaymentMethod = useAddPaymentMethod();
  const queryClient = useQueryClient();

  const navigate = useNavigate();
  const { items, clearCart, getTotal } = useCart();
  const { user } = useAuth();

  // Express checkout için ürün bilgisi
  const [expressProductData, setExpressProductData] = useState(null);

  // Express checkout için ürün bilgisini getir
  useEffect(() => {
    if (expressCheckout && expressProduct) {
      const fetchExpressProduct = async () => {
        try {
          const { data, error } = await supabase
            .from("products")
            .select(
              `
              uuid,
              name,
              price,
              discounted_price,
              image_url,
              images,
              stock,
              seller_id,
              seller:sellers(business_name, business_slug, logo_url)
            `
            )
            .eq("uuid", expressProduct)
            .single();

          if (error) {
            console.error("Express product fetch error:", error);
            toast.error("Ürün bilgisi alınamadı");
            navigate("/");
            return;
          }

          setExpressProductData(data);
        } catch (error) {
          console.error("Express product fetch error:", error);
          toast.error("Ürün bilgisi alınamadı");
          navigate("/");
        }
      };

      fetchExpressProduct();
    }
  }, [expressCheckout, expressProduct, navigate]);

  // Fetch user addresses and payment methods
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const { data: paymentMethods = [], isLoading: paymentsLoading } =
    usePaymentMethods();

  const {
    register,
    handleSubmit,
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

  // Redirect if cart is empty (sadece normal checkout için)
  useEffect(() => {
    if (!expressCheckout && items.length === 0) {
      navigate("/cart");
    }
  }, [items.length, navigate, expressCheckout]);

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

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!selectedAddress || !selectedPaymentMethod) {
        throw new Error("Adres ve ödeme yöntemi seçilmeli");
      }

      if (!agreementAccepted) {
        throw new Error("Mesafeli satış sözleşmesini kabul etmelisiniz");
      }

      // Items kontrolü
      if (!items || items.length === 0) {
        throw new Error("Sepetinizde ürün bulunmamaktadır");
      }

      // Express checkout için farklı items yapısı
      let orderItems;
      if (expressCheckout && expressProductData) {
        orderItems = [
          {
            product_id: expressProductData.uuid,
            variant_id: null,
            seller_id: expressProductData.seller_id,
            quantity: expressQuantity,
            price:
              expressProductData.discounted_price || expressProductData.price,
            total:
              (expressProductData.discounted_price ||
                expressProductData.price) * expressQuantity,
            variant: null,
          },
        ];
      } else {
        // Normal checkout için items map
        orderItems = items.map((item) => ({
          product_id: item.products?.uuid,
          variant_id: item.variant?.id,
          seller_id: item.products?.seller_id,
          quantity: item.quantity,
          price: item.products?.discounted_price || item.products?.price,
          total:
            (item.products?.discounted_price || item.products?.price) *
            item.quantity,
          variant: item.variant ? JSON.stringify(item.variant) : null,
        }));
      }

      // Debug için log
      console.log("Order data being sent:", {
        user_id: user.id,
        total_amount: getTotal(),
        address_id: selectedAddress?.id,
        shipping_address: `${selectedAddress?.full_name}, ${selectedAddress?.address_line}, ${selectedAddress?.city}, ${selectedAddress?.district}`,
        billing_address: `${selectedAddress?.full_name}, ${selectedAddress?.address_line}, ${selectedAddress?.city}, ${selectedAddress?.district}`,
        items: orderItems,
        notes: Object.values(sellerNotes).join("\n"),
      });

      // Sipariş oluştur (fonksiyon ile)
      const order = await apiOrders.createOrder({
        user_id: user.id,
        total_amount: getTotal(),
        address_id: selectedAddress?.id,
        shipping_address: `${selectedAddress?.full_name}, ${selectedAddress?.address_line}, ${selectedAddress?.city}, ${selectedAddress?.district}`,
        billing_address: `${selectedAddress?.full_name}, ${selectedAddress?.address_line}, ${selectedAddress?.city}, ${selectedAddress?.district}`,
        items: orderItems,
        notes: Object.values(sellerNotes).join("\n"),
      });
      // Sepeti temizle
      clearCart();
      // Sipariş sonrası işlemler (notification, yönlendirme)
      if (onOrderSuccess) {
        await onOrderSuccess(order);
      }
      toast.success("Sipariş başarıyla oluşturuldu!");
    } catch (error) {
      console.error("Order error:", error);
      toast.error(error.message || "Sipariş oluşturulurken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Adres ekle
  const handleAddAddress = async (e) => {
    e.preventDefault();
    const result = await addAddress.mutateAsync(addressForm);
    if (result) {
      setShowAddressModal(false);
      setAddressForm({}); // Form'u temizle
      queryClient.invalidateQueries(["addresses"]);
      setSelectedAddress(result);
      toast.success("Adres başarıyla eklendi");
    }
  };
  // Kart ekle
  const handleAddCard = async (e) => {
    e.preventDefault();
    const result = await addPaymentMethod.mutateAsync(cardForm);
    if (result) {
      setShowCardModal(false);
      queryClient.invalidateQueries(["payment-methods"]);
      setSelectedPaymentMethod(result);
      toast.success("Kart başarıyla eklendi");
    }
  };

  // Kupon uygula
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Kupon kodu giriniz");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      // Kupon kontrolü (ileride geliştirilecek)
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        setCouponError("Geçersiz kupon kodu");
        return;
      }

      // Kupon geçerlilik kontrolü
      const now = new Date();
      if (data.expires_at && new Date(data.expires_at) < now) {
        setCouponError("Kupon süresi dolmuş");
        return;
      }

      setAppliedCoupon(data);
      toast.success("Kupon başarıyla uygulandı!");
    } catch (error) {
      console.error("Coupon apply error:", error);
      setCouponError("Kupon uygulanırken hata oluştu");
    } finally {
      setCouponLoading(false);
    }
  };

  // Kupon kaldır
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast.success("Kupon kaldırıldı");
  };

  // Express checkout için fiyat hesapla
  const getExpressTotal = () => {
    if (!expressProductData) return 0;
    const price =
      expressProductData.discounted_price || expressProductData.price;
    let total = price * expressQuantity;

    // Kupon indirimi
    if (appliedCoupon) {
      if (appliedCoupon.discount_type === "percentage") {
        total = total * (1 - appliedCoupon.discount_value / 100);
      } else if (appliedCoupon.discount_type === "fixed") {
        total = Math.max(0, total - appliedCoupon.discount_value);
      }
    }

    return total;
  };

  // Stok kontrolü
  const checkStockAvailability = () => {
    if (expressCheckout) {
      if (!expressProductData) return false;
      return expressProductData.stock >= expressQuantity;
    } else {
      return items.every((item) => {
        const product = item.products;
        return product && product.stock >= item.quantity;
      });
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
                setShowAddressModal={setShowAddressModal}
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
                setShowCardModal={setShowCardModal}
              />
            )}
            {currentStep === 4 && (
              <ConfirmationStep
                selectedAddress={selectedAddress}
                selectedPaymentMethod={selectedPaymentMethod}
                cartState={items}
                sellerNotes={sellerNotes}
                onSellerNotesChange={setSellerNotes}
                agreementAccepted={agreementAccepted}
                setAgreementAccepted={setAgreementAccepted}
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
            <OrderSummary
              cartState={items}
              expressCheckout={expressCheckout}
              expressProductData={expressProductData}
              expressQuantity={expressQuantity}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              appliedCoupon={appliedCoupon}
              couponLoading={couponLoading}
              couponError={couponError}
              handleApplyCoupon={handleApplyCoupon}
              handleRemoveCoupon={handleRemoveCoupon}
              getExpressTotal={getExpressTotal}
              checkStockAvailability={checkStockAvailability}
              getTotal={getTotal}
            />
          </div>
        </div>
      </form>

      <Modal
        isOpen={showAddressModal}
        onClose={() => {
          setShowAddressModal(false);
          setAddressForm({}); // Modal kapandığında form'u temizle
        }}
        title="Yeni Adres Ekle"
      >
        <form onSubmit={handleAddAddress} className="space-y-4">
          <input
            type="text"
            placeholder="Ad Soyad"
            className="w-full border p-2 rounded"
            value={addressForm.full_name || ""}
            onChange={(e) =>
              setAddressForm((f) => ({ ...f, full_name: e.target.value }))
            }
            required
          />
          <input
            type="tel"
            placeholder="Telefon"
            className="w-full border p-2 rounded"
            value={addressForm.phone || ""}
            onChange={(e) =>
              setAddressForm((f) => ({ ...f, phone: e.target.value }))
            }
            required
          />
          <input
            type="text"
            placeholder="Şehir"
            className="w-full border p-2 rounded"
            value={addressForm.city || ""}
            onChange={(e) =>
              setAddressForm((f) => ({ ...f, city: e.target.value }))
            }
            required
          />
          <input
            type="text"
            placeholder="İlçe"
            className="w-full border p-2 rounded"
            value={addressForm.district || ""}
            onChange={(e) =>
              setAddressForm((f) => ({ ...f, district: e.target.value }))
            }
            required
          />
          <textarea
            placeholder="Adres"
            className="w-full border p-2 rounded"
            value={addressForm.address_line || ""}
            onChange={(e) =>
              setAddressForm((f) => ({ ...f, address_line: e.target.value }))
            }
            required
            rows={3}
          />
          <input
            type="text"
            placeholder="Posta Kodu"
            className="w-full border p-2 rounded"
            value={addressForm.postal_code || ""}
            onChange={(e) =>
              setAddressForm((f) => ({ ...f, postal_code: e.target.value }))
            }
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Kaydet
          </button>
        </form>
      </Modal>
      <Modal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        title="Yeni Kart Ekle"
      >
        <form onSubmit={handleAddCard} className="space-y-4">
          <input
            type="text"
            placeholder="Kart Adı"
            className="w-full border p-2 rounded"
            value={cardForm.card_name || ""}
            onChange={(e) =>
              setCardForm((f) => ({ ...f, card_name: e.target.value }))
            }
            required
          />
          <input
            type="text"
            placeholder="Kart Numarası"
            className="w-full border p-2 rounded"
            value={cardForm.card_number || ""}
            onChange={(e) =>
              setCardForm((f) => ({ ...f, card_number: e.target.value }))
            }
            required
          />
          <input
            type="text"
            placeholder="Kart Sahibi"
            className="w-full border p-2 rounded"
            value={cardForm.card_holder_name || ""}
            onChange={(e) =>
              setCardForm((f) => ({ ...f, card_holder_name: e.target.value }))
            }
            required
          />
          <input
            type="text"
            placeholder="Ay (MM)"
            className="w-full border p-2 rounded"
            value={cardForm.expiry_month || ""}
            onChange={(e) =>
              setCardForm((f) => ({ ...f, expiry_month: e.target.value }))
            }
            required
          />
          <input
            type="text"
            placeholder="Yıl (YY)"
            className="w-full border p-2 rounded"
            value={cardForm.expiry_year || ""}
            onChange={(e) =>
              setCardForm((f) => ({ ...f, expiry_year: e.target.value }))
            }
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Kaydet
          </button>
        </form>
      </Modal>
    </div>
  );
}

// Address Selection Step
function AddressStep({
  addresses,
  selectedAddress,
  onSelectAddress,
  setShowAddressModal,
}) {
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

          <button
            type="button"
            onClick={() => setShowAddressModal(true)}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-brand-600 hover:text-brand-600 transition-colors"
          >
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
  setShowCardModal,
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

          <button
            type="button"
            onClick={() => setShowCardModal(true)}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-brand-600 hover:text-brand-600 transition-colors"
          >
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
  agreementAccepted,
  setAgreementAccepted,
}) {
  // Format price helper
  const formatPrice = (price) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(price);
  };
  // Group items by seller for notes
  const sellerGroups = cartState.reduce((groups, item) => {
    const sellerId = item.products?.seller_id || "default";
    const sellerName = item.products?.seller?.business_name || "ANDA Mağaza";
    const price = item.products?.discounted_price || item.products?.price || 0;

    if (!groups[sellerId]) {
      groups[sellerId] = {
        sellerId,
        sellerName,
        items: [],
        total: 0,
      };
    }
    groups[sellerId].items.push(item);
    groups[sellerId].total += price * item.quantity;
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
            <div className="flex justify-between font-semibold text-lg">
              <span>Toplam Ödenecek Ücret:</span>
              <span className="text-brand-600">
                {formatPrice(
                  cartState.reduce((total, item) => {
                    const price =
                      item.products?.discounted_price ||
                      item.products?.price ||
                      0;
                    return total + price * item.quantity;
                  }, 0)
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Mesafeli Satış Sözleşmesi Onayı */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="agreement"
              checked={agreementAccepted}
              onChange={(e) => setAgreementAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
            />
            <label htmlFor="agreement" className="text-sm text-gray-700">
              <strong>Mesafeli Satış Sözleşmesi</strong>'ni{" "}
              <a
                href="/distance-sales-agreement"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:text-brand-700 underline"
              >
                okudum
              </a>{" "}
              ve kabul ediyorum. Siparişimi onayladıktan sonra ödeme işlemi
              gerçekleştirilecek. Siparişimi iptal etmek için 24 saat içinde
              müşteri hizmetleri ile iletişime geçebilirim.
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Order summary sidebar
 */
function OrderSummary({
  cartState,
  expressCheckout = false,
  expressProductData = null,
  expressQuantity = 1,
  couponCode = "",
  setCouponCode = () => {},
  appliedCoupon = null,
  couponLoading = false,
  couponError = "",
  handleApplyCoupon = () => {},
  handleRemoveCoupon = () => {},
  getExpressTotal = () => 0,
  checkStockAvailability = () => true,
  getTotal = () => 0,
}) {
  const isStockAvailable = checkStockAvailability();
  const total = expressCheckout ? getExpressTotal() : getTotal();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {expressCheckout ? "Hızlı Satın Alma Özeti" : "Sepet Özeti"}
      </h2>

      {/* Express Checkout Ürün */}
      {expressCheckout && expressProductData && (
        <div className="border-b border-gray-200 pb-4 mb-4">
          <div className="flex items-center space-x-4">
            <img
              src={
                (Array.isArray(expressProductData.images) &&
                  expressProductData.images.length > 0 &&
                  expressProductData.images[0]) ||
                expressProductData.image_url ||
                "/placeholder-product.jpg"
              }
              alt={expressProductData.name}
              className="w-16 h-16 object-cover rounded-md"
            />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                {expressProductData.name}
              </h3>
              <p className="text-sm text-gray-600">
                {expressProductData.seller?.business_name}
              </p>
              <p className="text-sm text-gray-500">Adet: {expressQuantity}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">
                ₺
                {(
                  (expressProductData.discounted_price ||
                    expressProductData.price) * expressQuantity
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Normal Cart Items */}
      {!expressCheckout && (
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h3 className="font-medium text-gray-900 mb-3">Ürünler</h3>
          <div className="space-y-3">
            {cartState.map((item) => {
              const product = item.products;
              const price = product?.discounted_price || product?.price || 0;

              return (
                <div key={item.id} className="flex items-center space-x-3">
                  <img
                    src={
                      (Array.isArray(product?.images) &&
                        product.images.length > 0 &&
                        product.images[0]) ||
                      product?.image_url ||
                      "/placeholder-product.jpg"
                    }
                    alt={product?.name}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {product?.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {product?.seller?.business_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Adet: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ₺{(price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kupon Sistemi */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="font-medium text-gray-900 mb-3">Kupon Kodu</h3>
        <div className="space-y-2">
          {!appliedCoupon ? (
            <div className="flex space-x-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Kupon kodunuzu girin"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {couponLoading ? "..." : "Uygula"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
              <div>
                <p className="text-sm font-medium text-green-900">
                  Kupon Uygulandı: {appliedCoupon.code}
                </p>
                <p className="text-sm text-green-700">
                  {appliedCoupon.discount_type === "percentage"
                    ? `%${appliedCoupon.discount_value} indirim`
                    : `₺${appliedCoupon.discount_value} indirim`}
                </p>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="text-green-600 hover:text-green-800 text-sm"
              >
                Kaldır
              </button>
            </div>
          )}
          {couponError && <p className="text-sm text-red-600">{couponError}</p>}
        </div>
      </div>

      {/* Stok Kontrolü */}
      {!isStockAvailable && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            ⚠️ Bazı ürünler stokta yok. Lütfen miktarları kontrol edin.
          </p>
        </div>
      )}

      {/* Toplam Ödenecek Ücret */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between text-xl font-bold text-orange-600">
          <span>Toplam Ödenecek Ücret:</span>
          <span>₺{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Güvenlik Bilgisi */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
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
