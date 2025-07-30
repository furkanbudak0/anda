import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CogIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  BellIcon,
  CreditCardIcon,
  DocumentTextIcon,
  TagIcon,
  CloudArrowUpIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";
import AdminSidebar from "../AdminSidebar";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";

const settingCategories = [
  {
    id: "general",
    title: "Genel Ayarlar",
    icon: CogIcon,
    description: "Site genel ayarlarını yönetin",
  },
  {
    id: "payments",
    title: "Ödeme Ayarları",
    icon: CreditCardIcon,
    description: "Ödeme sistemlerini yapılandırın",
  },
  {
    id: "notifications",
    title: "Bildirim Ayarları",
    icon: BellIcon,
    description: "Email ve SMS bildirimlerini ayarlayın",
  },
  {
    id: "security",
    title: "Güvenlik Ayarları",
    icon: ShieldCheckIcon,
    description: "Güvenlik politikalarını belirleyin",
  },
  {
    id: "content",
    title: "İçerik Ayarları",
    icon: DocumentTextIcon,
    description: "Site içeriğini yönetin",
  },
  {
    id: "shipping",
    title: "Kargo Ayarları",
    icon: CloudArrowUpIcon,
    description: "Kargo ve teslimat ayarları",
  },
];

export default function AdminSettingsPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("general");
  const [settings, setSettings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch site settings
  const { data: siteSettings = {}, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data || {};
    },
    onSuccess: (data) => {
      setSettings(data);
    },
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData) => {
      const { data, error } = await supabase
        .from("site_settings")
        .upsert({
          id: 1, // Single row for all settings
          ...settingsData,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-settings"]);
      toast.success("Ayarlar başarıyla kaydedildi!");
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Site Başlığı
        </label>
        <input
          type="text"
          value={settings.site_title || ""}
          onChange={(e) => handleSettingChange("site_title", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Site başlığını girin"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Site Açıklaması
        </label>
        <textarea
          value={settings.site_description || ""}
          onChange={(e) =>
            handleSettingChange("site_description", e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
          placeholder="Site açıklamasını girin"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ana Para Birimi
          </label>
          <select
            value={settings.default_currency || "TRY"}
            onChange={(e) =>
              handleSettingChange("default_currency", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="TRY">Türk Lirası (₺)</option>
            <option value="USD">US Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dil
          </label>
          <select
            value={settings.default_language || "tr"}
            onChange={(e) =>
              handleSettingChange("default_language", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="maintenance_mode"
          checked={settings.maintenance_mode || false}
          onChange={(e) =>
            handleSettingChange("maintenance_mode", e.target.checked)
          }
          className="mr-2"
        />
        <label
          htmlFor="maintenance_mode"
          className="text-sm text-gray-700 dark:text-gray-300"
        >
          Bakım modunu etkinleştir
        </label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="user_registration"
          checked={settings.allow_user_registration !== false}
          onChange={(e) =>
            handleSettingChange("allow_user_registration", e.target.checked)
          }
          className="mr-2"
        />
        <label
          htmlFor="user_registration"
          className="text-sm text-gray-700 dark:text-gray-300"
        >
          Kullanıcı kaydına izin ver
        </label>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          Ödeme Sağlayıcıları
        </h4>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white">
                Stripe
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Kredi kartı ödemeleri
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.stripe_enabled || false}
              onChange={(e) =>
                handleSettingChange("stripe_enabled", e.target.checked)
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white">
                PayPal
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                PayPal ödemeleri
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.paypal_enabled || false}
              onChange={(e) =>
                handleSettingChange("paypal_enabled", e.target.checked)
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white">
                Kapıda Ödeme
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nakit/Kart ile kapıda ödeme
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.cod_enabled !== false}
              onChange={(e) =>
                handleSettingChange("cod_enabled", e.target.checked)
              }
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Minimum Sipariş Tutarı (₺)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={settings.minimum_order_amount || 0}
            onChange={(e) =>
              handleSettingChange(
                "minimum_order_amount",
                parseFloat(e.target.value)
              )
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ücretsiz Kargo Eşiği (₺)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={settings.free_shipping_threshold || 0}
            onChange={(e) =>
              handleSettingChange(
                "free_shipping_threshold",
                parseFloat(e.target.value)
              )
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          Email Bildirimleri
        </h4>

        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.email_order_confirmation !== false}
              onChange={(e) =>
                handleSettingChange(
                  "email_order_confirmation",
                  e.target.checked
                )
              }
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Sipariş onay emaili gönder
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.email_shipping_notification !== false}
              onChange={(e) =>
                handleSettingChange(
                  "email_shipping_notification",
                  e.target.checked
                )
              }
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Kargo bildirimi emaili gönder
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.email_promotional !== false}
              onChange={(e) =>
                handleSettingChange("email_promotional", e.target.checked)
              }
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Promosyon emaillerini gönder
            </span>
          </label>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          SMS Bildirimleri
        </h4>

        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.sms_order_confirmation || false}
              onChange={(e) =>
                handleSettingChange("sms_order_confirmation", e.target.checked)
              }
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Sipariş onay SMS'i gönder
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.sms_shipping_notification || false}
              onChange={(e) =>
                handleSettingChange(
                  "sms_shipping_notification",
                  e.target.checked
                )
              }
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Kargo bildirimi SMS'i gönder
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Maksimum Giriş Denemesi
          </label>
          <input
            type="number"
            min="3"
            max="10"
            value={settings.max_login_attempts || 5}
            onChange={(e) =>
              handleSettingChange(
                "max_login_attempts",
                parseInt(e.target.value)
              )
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Oturum Zaman Aşımı (dakika)
          </label>
          <input
            type="number"
            min="15"
            max="1440"
            value={settings.session_timeout || 60}
            onChange={(e) =>
              handleSettingChange("session_timeout", parseInt(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.require_email_verification !== false}
            onChange={(e) =>
              handleSettingChange(
                "require_email_verification",
                e.target.checked
              )
            }
            className="mr-2"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Email doğrulaması zorunlu
          </span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.enable_two_factor || false}
            onChange={(e) =>
              handleSettingChange("enable_two_factor", e.target.checked)
            }
            className="mr-2"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            İki faktörlü kimlik doğrulamayı etkinleştir
          </span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.enable_captcha || false}
            onChange={(e) =>
              handleSettingChange("enable_captcha", e.target.checked)
            }
            className="mr-2"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            reCAPTCHA'yı etkinleştir
          </span>
        </label>
      </div>
    </div>
  );

  const renderShippingSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Standart Kargo Ücreti (₺)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={settings.standard_shipping_cost || 0}
            onChange={(e) =>
              handleSettingChange(
                "standard_shipping_cost",
                parseFloat(e.target.value)
              )
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hızlı Kargo Ücreti (₺)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={settings.express_shipping_cost || 0}
            onChange={(e) =>
              handleSettingChange(
                "express_shipping_cost",
                parseFloat(e.target.value)
              )
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Standart Teslimat Süresi (gün)
          </label>
          <input
            type="number"
            min="1"
            max="30"
            value={settings.standard_delivery_days || 3}
            onChange={(e) =>
              handleSettingChange(
                "standard_delivery_days",
                parseInt(e.target.value)
              )
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hızlı Teslimat Süresi (gün)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={settings.express_delivery_days || 1}
            onChange={(e) =>
              handleSettingChange(
                "express_delivery_days",
                parseInt(e.target.value)
              )
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeCategory) {
      case "general":
        return renderGeneralSettings();
      case "payments":
        return renderPaymentSettings();
      case "notifications":
        return renderNotificationSettings();
      case "security":
        return renderSecuritySettings();
      case "shipping":
        return renderShippingSettings();
      default:
        return <div>Bu kategori henüz uygulanmadı.</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <AdminSidebar />
        <div className="flex-1 pt-16 pb-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <AdminSidebar />
      <div className="flex-1 pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sistem Ayarları
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Platform ayarlarını yönetin ve yapılandırın.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-1/4">
              <nav className="space-y-2">
                {settingCategories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                        activeCategory === category.id
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{category.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {category.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="lg:w-3/4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {
                      settingCategories.find((c) => c.id === activeCategory)
                        ?.title
                    }
                  </h2>

                  {hasChanges && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        <span className="text-sm">
                          Kaydedilmemiş değişiklikler
                        </span>
                      </div>
                      <button
                        onClick={handleSave}
                        disabled={saveSettingsMutation.isLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {saveSettingsMutation.isLoading ? (
                          <Spinner size="sm" />
                        ) : (
                          <CheckCircleIcon className="w-4 h-4" />
                        )}
                        Kaydet
                      </button>
                    </div>
                  )}
                </div>

                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
