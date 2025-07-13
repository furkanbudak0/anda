import { useState } from "react";
import { Link } from "react-router-dom";
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import NavBar from "../components/NavBar";
import Spinner from "../components/Spinner";
import { ForgotPasswordSEO } from "../components/SEO";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Lütfen e-posta adresinizi girin");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Lütfen geçerli bir e-posta adresi girin");
      return;
    }

    setIsLoading(true);

    try {
      // Here you would call your password reset API
      // await apiPasswordReset(email);
      setTimeout(() => {
        setIsSubmitted(true);
        setIsLoading(false);
        toast.success("Şifre sıfırlama bağlantısı gönderildi!");
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      toast.error(error.message || "Bir hata oluştu, lütfen tekrar deneyin");
    }
  };

  if (isSubmitted) {
    return (
      <>
        <ForgotPasswordSEO />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <NavBar />

          <div className="pt-20 pb-16">
            <div className="max-w-md mx-auto px-4">
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  E-posta Gönderildi!
                </h2>

                <p className="text-gray-600 mb-6">
                  <strong>{email}</strong> adresine şifre sıfırlama bağlantısı
                  gönderdik. E-postanızı kontrol edin ve talimatları takip edin.
                </p>

                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                    <p className="font-medium mb-2">
                      📧 E-postayı bulamıyor musunuz?
                    </p>
                    <ul className="text-left space-y-1">
                      <li>• Spam/Junk klasörünü kontrol edin</li>
                      <li>• 5-10 dakika bekleyin</li>
                      <li>
                        • E-posta adresinizi doğru yazdığınızdan emin olun
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Tekrar Gönder
                    </button>

                    <Link
                      to="/auth"
                      className="inline-flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                      Giriş sayfasına dön
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ForgotPasswordSEO />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <NavBar />

        <div className="pt-20 pb-16">
          <div className="max-w-md mx-auto px-4">
            {/* Geri Dön Butonu */}
            <div className="mb-8">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors group"
              >
                <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Giriş sayfasına dön
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-center text-white">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <EnvelopeIcon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Şifremi Unuttum</h2>
                <p className="text-blue-100">
                  E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz
                </p>
              </div>

              {/* Form */}
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      E-posta Adresi
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="ornek@email.com"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <Spinner />
                        Gönderiliyor...
                      </div>
                    ) : (
                      "Şifre Sıfırlama Bağlantısı Gönder"
                    )}
                  </button>
                </form>

                {/* Bilgilendirme */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">💡 Bilgi:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Şifre sıfırlama bağlantısı 1 saat geçerlidir</li>
                    <li>• E-posta gelmezse spam klasörünü kontrol edin</li>
                    <li>• Sorun yaşıyorsanız destek ile iletişime geçin</li>
                  </ul>
                </div>

                {/* Yardım Linkleri */}
                <div className="mt-6 text-center text-sm text-gray-500">
                  <p>
                    Hala sorun mu yaşıyorsunuz?{" "}
                    <Link
                      to="/contact"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Destek ekibi ile iletişime geçin
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
