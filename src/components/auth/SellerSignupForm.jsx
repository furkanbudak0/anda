/* eslint-disable react/prop-types */
import { useState } from "react";
import { useSellerSignup } from "../../hooks/useAuth";
import {
  BuildingOfficeIcon,
  UserIcon,
  CreditCardIcon,
  DocumentIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Spinner from "../Spinner";

/**
 * Multi-step seller signup form with comprehensive business verification
 */
export default function SellerSignupForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Business Info
    businessType: "",
    companyName: "",
    businessEmail: "",
    businessPhone: "",
    taxId: "",
    website: "",
    businessDescription: "",
    categories: [],

    // Owner Info
    firstName: "",
    lastName: "",
    ownerEmail: "",
    ownerPhone: "",
    idNumber: "",
    dob: "",

    // Banking
    bankName: "",
    accountName: "",
    accountNumber: "",
    iban: "",
    swiftCode: "",

    // Documents
    businessLicense: null,
    idDocument: null,
    taxCertificate: null,
    bankLetter: null,
  });

  const sellerSignupMutation = useSellerSignup();

  const steps = [
    { id: 1, name: "İşletme Bilgileri", icon: BuildingOfficeIcon },
    { id: 2, name: "Sahip Bilgileri", icon: UserIcon },
    { id: 3, name: "Bankacılık", icon: CreditCardIcon },
    { id: 4, name: "Belgeler", icon: DocumentIcon },
    { id: 5, name: "Onay", icon: CheckCircleIcon },
  ];

  const businessTypes = [
    { value: "individual", label: "Şahıs Şirketi" },
    { value: "llc", label: "Limited Şirket" },
    { value: "corporation", label: "Anonim Şirket" },
    { value: "cooperative", label: "Kooperatif" },
  ];

  const categories = [
    "Giyim",
    "Ayakkabı",
    "Aksesuar",
    "Elektronik",
    "Ev & Yaşam",
    "Spor & Outdoor",
    "Kozmetik",
    "Kitap",
    "Oyuncak",
    "Otomotiv",
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        categories: checked
          ? [...prev.categories, value]
          : prev.categories.filter((cat) => cat !== value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sellerSignupMutation.mutate(formData);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-purple-900">
              İşletme Bilgileri
            </h3>

            <div>
              <label className="block text-sm font-medium text-purple-700">
                İşletme Türü
              </label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Seçiniz</option>
                {businessTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700">
                Şirket Adı
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                placeholder="ABC Ticaret Ltd. Şti."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-700">
                  İş E-postası
                </label>
                <input
                  type="email"
                  name="businessEmail"
                  value={formData.businessEmail}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder="info@sirket.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700">
                  İş Telefonu
                </label>
                <input
                  type="tel"
                  name="businessPhone"
                  value={formData.businessPhone}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder="+90 555 123 4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-700">
                  Vergi Numarası
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder="1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700">
                  Website (İsteğe bağlı)
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder="https://sirket.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700">
                İşletme Açıklaması
              </label>
              <textarea
                name="businessDescription"
                value={formData.businessDescription}
                onChange={handleInputChange}
                required
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                placeholder="İşletmenizin faaliyet alanı ve açıklaması..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-3">
                Faaliyet Kategorileri (Birden fazla seçebilirsiniz)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      value={category}
                      checked={formData.categories.includes(category)}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-purple-300 rounded"
                    />
                    <span className="ml-2 text-sm text-purple-700">
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-purple-900">
              Sahip/Yetkili Bilgileri
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-700">
                  Ad
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700">
                  Soyad
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-700">
                  Kişisel E-posta
                </label>
                <input
                  type="email"
                  name="ownerEmail"
                  value={formData.ownerEmail}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700">
                  Kişisel Telefon
                </label>
                <input
                  type="tel"
                  name="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-700">
                  TC Kimlik No
                </label>
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  pattern="[0-9]{11}"
                  maxLength="11"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700">
                  Doğum Tarihi
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-purple-900">
              Bankacılık Bilgileri
            </h3>

            <div>
              <label className="block text-sm font-medium text-purple-700">
                Banka Adı
              </label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                placeholder="Türkiye İş Bankası"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700">
                Hesap Sahibi
              </label>
              <input
                type="text"
                name="accountName"
                value={formData.accountName}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                placeholder="Şirket adı veya sahip adı"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-700">
                  Hesap Numarası
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700">
                  IBAN
                </label>
                <input
                  type="text"
                  name="iban"
                  value={formData.iban}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  pattern="[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700">
                SWIFT Kodu (İsteğe bağlı)
              </label>
              <input
                type="text"
                name="swiftCode"
                value={formData.swiftCode}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                placeholder="ISBKTRIS"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-purple-900">Belgeler</h3>
            <p className="text-sm text-purple-600">
              Satıcı başvurunuzun onaylanması için aşağıdaki belgeleri
              yüklemeniz gerekiyor.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  İş Yeri Ruhsatı *
                </label>
                <input
                  type="file"
                  name="businessLicense"
                  onChange={handleInputChange}
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="block w-full text-sm text-purple-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Kimlik Belgesi *
                </label>
                <input
                  type="file"
                  name="idDocument"
                  onChange={handleInputChange}
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="block w-full text-sm text-purple-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Vergi Levhası *
                </label>
                <input
                  type="file"
                  name="taxCertificate"
                  onChange={handleInputChange}
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="block w-full text-sm text-purple-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Banka Mektubu
                </label>
                <input
                  type="file"
                  name="bankLetter"
                  onChange={handleInputChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="block w-full text-sm text-purple-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-700">
                <strong>Not:</strong> Belgeleriniz yüklendikten sonra admin
                ekibimiz tarafından 2-5 iş günü içinde incelenecektir.
                Başvurunuzun durumu e-posta ile bildirilecektir.
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
              <h3 className="text-lg font-medium text-purple-900 mt-4">
                Başvuru Özeti
              </h3>
              <p className="text-purple-600 mt-2">
                Bilgilerinizi kontrol edin ve başvurunuzu tamamlayın.
              </p>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg space-y-4">
              <div>
                <h4 className="font-medium text-purple-900">
                  İşletme Bilgileri
                </h4>
                <p className="text-purple-700">{formData.companyName}</p>
                <p className="text-purple-600 text-sm">
                  {formData.businessEmail}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-purple-900">Sahip</h4>
                <p className="text-purple-700">
                  {formData.firstName} {formData.lastName}
                </p>
                <p className="text-purple-600 text-sm">{formData.ownerEmail}</p>
              </div>

              <div>
                <h4 className="font-medium text-purple-900">Kategoriler</h4>
                <p className="text-purple-600 text-sm">
                  {formData.categories.join(", ")}
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Önemli:</strong> Başvurunuzu tamamladıktan sonra,
                hesabınız admin onayı bekleyecektir. Bu süreçte satış
                yapamayacaksınız ancak başvuru durumunuzu takip edebileceksiniz.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex justify-between">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  step.id === currentStep
                    ? "text-purple-600"
                    : step.id < currentStep
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step.id === currentStep
                      ? "border-purple-600 bg-purple-50"
                      : step.id < currentStep
                      ? "border-green-600 bg-green-50"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                <span className="ml-2 text-sm font-medium hidden md:block">
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Önceki
              </button>

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  Sonraki
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={sellerSignupMutation.isPending}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                >
                  {sellerSignupMutation.isPending ? (
                    <>
                      <Spinner />
                      <span className="ml-2">Başvuru Gönderiliyor...</span>
                    </>
                  ) : (
                    "Başvuruyu Tamamla"
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
