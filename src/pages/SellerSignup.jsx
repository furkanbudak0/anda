import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSellerSignup } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import {
  BuildingStorefrontIcon,
  UserIcon,
  BanknotesIcon,
  DocumentIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import Logo from "../components/Logo";
import Spinner from "../components/Spinner";

/**
 * Modern Multi-Step Seller Signup Form
 */
export default function SellerSignup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm({
    mode: "onChange",
  });

  const { mutate: signup, isPending } = useSellerSignup();

  const steps = [
    { id: 1, title: "İşletme", icon: BuildingStorefrontIcon },
    { id: 2, title: "Kişisel", icon: UserIcon },
    { id: 3, title: "Banka", icon: BanknotesIcon },
    { id: 4, title: "Belgeler", icon: DocumentIcon },
    { id: 5, title: "Onay", icon: CheckCircleIcon },
  ];

  const businessTypes = [
    { value: "individual", label: "Şahıs Şirketi" },
    { value: "llc", label: "Limited Şirket" },
    { value: "corporation", label: "Anonim Şirket" },
  ];

  const nextStep = async () => {
    const isValid = await trigger();
    if (isValid && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data) => {
    console.log("Form data:", data);

    // API'nin beklediği format'a uygun olarak data'yı düzenle
    const formattedData = {
      // Business Info
      businessType: data.businessType,
      companyName: data.companyName,
      businessEmail: data.businessEmail,
      businessPhone: data.businessPhone || null, // null olarak gönder
      taxId: data.taxId || null, // null olarak gönder
      website: data.website || null, // null olarak gönder
      businessDescription: data.businessDescription || null, // null olarak gönder
      categories: data.categories || ["Diğer"], // form'da yoksa default kategori

      // Owner Info (kişisel bilgiler)
      firstName: data.firstName,
      lastName: data.lastName,
      ownerEmail: data.email, // personal email -> owner email
      ownerPhone: data.ownerPhone || null, // form'dan gelir
      idNumber: data.idNumber || null, // null olarak gönder
      dob: data.dob || null, // KRİTİK: boş string yerine null gönder

      // Banking
      bankName: data.bankName,
      accountName: data.accountName || `${data.firstName} ${data.lastName}`, // default olarak ad soyad
      accountNumber: data.accountNumber || null, // form'dan gelir
      iban: data.iban,
      swiftCode: data.swiftCode || null, // null olarak gönder

      // Documents
      businessLicense: data.businessLicense,
      idDocument: data.idDocument || null, // form'da yoksa null
      taxCertificate: data.taxCertificate || null, // form'da yoksa null
      bankLetter: data.bankLetter || null, // form'da yoksa null
    };

    console.log("Formatted data for API:", formattedData);
    signup(formattedData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <Logo />
          </Link>
          <h1 className="text-3xl font-bold text-purple-900 mb-2">
            Satıcı Başvurusu
          </h1>
          <p className="text-purple-600">
            ANDA Marketplace&apos;te satış yapmak için başvurunuzu tamamlayın
          </p>
        </div>

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 
                    ${
                      isCompleted
                        ? "bg-purple-600 border-purple-600 text-white"
                        : isCurrent
                        ? "border-purple-600 text-purple-600 bg-white"
                        : "border-gray-300 text-gray-300 bg-white"
                    }
                  `}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={`
                      hidden sm:block w-20 h-0.5 mx-4
                      ${isCompleted ? "bg-purple-600" : "bg-gray-300"}
                    `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Business Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  İşletme Bilgileri
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İşletme Türü *
                  </label>
                  <select
                    {...register("businessType", {
                      required: "İşletme türü gerekli",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Seçiniz</option>
                    {businessTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.businessType && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.businessType.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şirket/Mağaza Adı *
                  </label>
                  <input
                    type="text"
                    {...register("companyName", {
                      required: "Şirket adı gerekli",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="ABC Tekstil Ltd."
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.companyName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta *
                  </label>
                  <input
                    type="email"
                    {...register("businessEmail", {
                      required: "E-posta gerekli",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="info@sirket.com"
                  />
                  {errors.businessEmail && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.businessEmail.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İş Telefonu
                  </label>
                  <input
                    type="tel"
                    {...register("businessPhone")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="0212 555 12 34"
                  />
                  {errors.businessPhone && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.businessPhone.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Personal Info */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Kişisel Bilgiler
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ad *
                    </label>
                    <input
                      type="text"
                      {...register("firstName", { required: "Ad gerekli" })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Adınız"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Soyad *
                    </label>
                    <input
                      type="text"
                      {...register("lastName", { required: "Soyad gerekli" })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Soyadınız"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta *
                  </label>
                  <input
                    type="email"
                    {...register("email", { required: "E-posta gerekli" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şifre *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password", { required: "Şifre gerekli" })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="En az 6 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon Numarası
                    </label>
                    <input
                      type="tel"
                      {...register("ownerPhone")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="0555 123 45 67"
                    />
                    {errors.ownerPhone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.ownerPhone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Doğum Tarihi
                    </label>
                    <input
                      type="date"
                      {...register("dob")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    {errors.dob && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.dob.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Bank Info */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Banka Bilgileri
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banka Adı *
                  </label>
                  <input
                    type="text"
                    {...register("bankName", { required: "Banka adı gerekli" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Ziraat Bankası"
                  />
                  {errors.bankName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.bankName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IBAN *
                  </label>
                  <input
                    type="text"
                    {...register("iban", { required: "IBAN gerekli" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                  />
                  {errors.iban && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.iban.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hesap Numarası
                  </label>
                  <input
                    type="text"
                    {...register("accountNumber")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="123456789"
                  />
                  {errors.accountNumber && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.accountNumber.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Documents */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Belgeler
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İşletme Belgesi *
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    {...register("businessLicense", {
                      required: "İşletme belgesi gerekli",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  {errors.businessLicense && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.businessLicense.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Onay
                </h3>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <CheckCircleIcon className="h-6 w-6 text-green-600 inline mr-2" />
                  <span className="text-green-800 font-medium">
                    Başvurunuz hazır!
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Sonraki Adımlar
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>1. Başvurunuz incelenecek</li>
                    <li>2. 2-5 iş günü içinde bilgilendirileceksiniz</li>
                    <li>3. Onay sonrası satıcı paneline erişebileceksiniz</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Önceki
                </button>
              )}

              <div className="ml-auto">
                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Sonraki
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isPending ? (
                      <>
                        <Spinner
                          size="small"
                          color="white"
                          showText={false}
                          className="mr-2"
                        />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Başvuru Gönder
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Zaten satıcı hesabınız var mı?{" "}
            <Link
              to="/auth"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Giriş yapın
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
