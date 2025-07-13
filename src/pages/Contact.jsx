import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  HeartIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import NavBar from "../components/NavBar";
import { useFormValidation, validationSchemas } from "../utils/validation";
import toast from "react-hot-toast";

/**
 * Modern contact page with form validation
 */
export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form validation
  const {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
  } = useFormValidation(
    {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
    validationSchemas.contact
  );

  const handleInputChange = (fieldName) => (e) => {
    handleChange(fieldName, e.target.value);
  };

  const handleInputBlur = (fieldName) => () => {
    handleBlur(fieldName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      toast.error("Lütfen tüm alanları doğru şekilde doldurun");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Here you would make actual API call to send the contact form
      console.log("Contact form data:", formData);

      toast.success(
        "Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız."
      );
      reset();
    } catch (error) {
      console.error("Contact form error:", error);
      toast.error(
        "Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClassName = (fieldName) => {
    const baseClasses =
      "w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-800 dark:text-white";

    if (touched[fieldName] && errors[fieldName]) {
      return `${baseClasses} border-red-500 focus:ring-red-500 focus:border-red-500`;
    }

    if (touched[fieldName] && !errors[fieldName] && formData[fieldName]) {
      return `${baseClasses} border-green-500 focus:ring-green-500 focus:border-green-500`;
    }

    return `${baseClasses} border-gray-300 hover:border-gray-400 dark:border-gray-600`;
  };

  const contactMethods = [
    {
      icon: PhoneIcon,
      title: "Telefon",
      details: "+90 (500) 123 45 67",
      description: "Pazartesi - Cuma, 09:00 - 18:00",
      color: "bg-emerald-500",
      action: "tel:+905001234567",
    },
    {
      icon: EnvelopeIcon,
      title: "E-posta",
      details: "destek@anda.com",
      description: "24 saat içinde yanıtlıyoruz",
      color: "bg-blue-500",
      action: "mailto:destek@anda.com",
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Canlı Destek",
      details: "Anlık Mesajlaşma",
      description: "7/24 uzmanlarımızla sohbet edin",
      color: "bg-purple-500",
      action: "/help",
    },
    {
      icon: MapPinIcon,
      title: "Adres",
      details: "Maslak, Sarıyer/İstanbul",
      description: "Ziyaret saatleri: 09:00 - 17:00",
      color: "bg-orange-500",
      action: "https://maps.google.com",
    },
  ];

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="pt-32 pb-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="bg-white rounded-2xl shadow-xl p-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <HeartIcon className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Mesajınız Alındı!
              </h1>
              <p className="text-gray-600 mb-8 text-lg">
                Teşekkür ederiz! Mesajınızı aldık ve en kısa sürede size geri
                dönüş yapacağız.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => setIsSubmitting(false)}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Yeni Mesaj Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Bizimle İletişime Geçin
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sorularınız, önerileriniz veya destek talepleriniz için buradayız.
            </p>
          </div>

          {/* Contact Methods */}
          <div className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactMethods.map((method, index) => (
                <a
                  key={index}
                  href={method.action}
                  className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <div
                    className={`${method.color} p-4 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <method.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {method.title}
                  </h3>
                  <p className="text-blue-600 font-medium mb-1">
                    {method.details}
                  </p>
                  <p className="text-gray-600 text-sm">{method.description}</p>
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Bize Mesaj Gönderin
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ad Soyad *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        className={getInputClassName("name")}
                        placeholder="Adınız ve soyadınız"
                        value={formData.name}
                        onChange={handleInputChange("name")}
                        onBlur={handleInputBlur("name")}
                      />
                      {touched.name && errors.name && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-posta *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        className={getInputClassName("email")}
                        placeholder="ornek@email.com"
                        value={formData.email}
                        onChange={handleInputChange("email")}
                        onBlur={handleInputBlur("email")}
                      />
                      {touched.email && errors.email && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Konu *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      required
                      className={getInputClassName("subject")}
                      placeholder="Mesajınızın konusu"
                      value={formData.subject}
                      onChange={handleInputChange("subject")}
                      onBlur={handleInputBlur("subject")}
                    />
                    {touched.subject && errors.subject && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mesajınız *
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={6}
                      className={getInputClassName("message")}
                      placeholder="Lütfen mesajınızı detaylıca yazın..."
                      value={formData.message}
                      onChange={handleInputChange("message")}
                      onBlur={handleInputBlur("message")}
                    ></textarea>
                    {touched.message && errors.message && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                        Mesaj Gönder
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Company Info */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-xl mr-4">
                  <ClockIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Çalışma Saatleri
                </h2>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-900">
                    Pazartesi - Cuma
                  </span>
                  <span className="text-gray-600">09:00 - 18:00</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-900">Cumartesi</span>
                  <span className="text-gray-600">10:00 - 16:00</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium text-gray-900">Pazar</span>
                  <span className="text-gray-600">Kapalı</span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-blue-800 text-sm">
                  <strong>Canlı Destek:</strong> 7/24 online destek hizmeti
                  verilmektedir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
