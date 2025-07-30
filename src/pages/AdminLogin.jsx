import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminLogin } from "../hooks/useAdminAuth";
import { useAuth } from "../contexts/AuthContext";
import {
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import Logo from "../components/Logo";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { mutate: adminLogin, isLoading } = useAdminLogin();
  const { isAuthenticated, role, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (isAuthenticated && role === "admin" && !authLoading) {
      navigate("/admin/dashboard");
    }
  }, [isAuthenticated, role, authLoading, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    adminLogin(
      { email, password },
      {
        onSuccess: async () => {
          // AuthContext'in güncellenmesini bekle
          // Navigate işlemi useEffect'te otomatik olarak yapılacak
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-full p-3 shadow-lg">
              <Logo className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-purple-200">
            ANDA e-ticaret platformu yönetim paneli
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-3">
              <ShieldCheckIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-center text-white mb-6">
            Admin Girişi
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-purple-100 mb-2"
              >
                Email Adresi
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                placeholder="admin@anda.com"
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-purple-100 mb-2"
              >
                Şifre
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-200 hover:text-white"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded bg-white/10"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 text-sm text-purple-100"
                >
                  Beni hatırla
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-purple-200 hover:text-white transition-colors"
              >
                Şifremi unuttum
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Giriş yapılıyor...
                </div>
              ) : (
                "Admin Paneline Giriş Yap"
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <div className="text-sm text-purple-200">
              Normal kullanıcı mısınız?{" "}
              <Link
                to="/auth"
                className="text-white hover:text-purple-100 font-medium transition-colors"
              >
                Buradan giriş yapın
              </Link>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-5 w-5 text-yellow-400 mr-2" />
            <div className="text-sm text-yellow-100">
              <strong>Güvenlik Uyarısı:</strong> Admin paneli sadece yetkili
              personel içindir. Lütfen kimlik bilgilerinizi güvende tutun.
            </div>
          </div>
        </div>

        {/* Development Info */}
        {import.meta.env.DEV && (
          <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-xs text-blue-200">
              <strong>Geliştirici Modu:</strong> Test admin hesabı oluşturmak
              için kullanıcı yönetimi bölümünü kullanın.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
