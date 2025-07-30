import { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";

const AdminSeoManagement = () => {
  const [seoSettings, setSeoSettings] = useState({
    site_title: "",
    site_description: "",
    keywords: "",
    google_analytics_id: "",
    google_search_console: "",
    robots_txt: "",
    sitemap_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSeoSettings();
  }, []);

  const fetchSeoSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("seo_settings")
        .select("*")
        .eq("page_type", "global")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("SEO ayarları yüklenirken hata:", error);
        return;
      }

      if (data) {
        setSeoSettings({
          site_title: data.title || "",
          site_description: data.description || "",
          keywords: data.keywords || "",
          google_analytics_id: "",
          google_search_console: "",
          robots_txt: "",
          sitemap_url: "",
        });
      }
    } catch (error) {
      console.error("SEO ayarları yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("seo_settings").upsert({
        page_type: "global",
        title: seoSettings.site_title,
        description: seoSettings.site_description,
        keywords: seoSettings.keywords,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("SEO ayarları kaydedilirken hata:", error);
        alert("Ayarlar kaydedilirken hata oluştu!");
        return;
      }

      alert("SEO ayarları başarıyla kaydedildi!");
    } catch (error) {
      console.error("SEO ayarları kaydedilirken hata:", error);
      alert("Ayarlar kaydedilirken hata oluştu!");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSeoSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          SEO Yönetimi
        </h1>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        SEO Yönetimi
      </h1>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Site Başlığı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Site Başlığı
            </label>
            <input
              type="text"
              value={seoSettings.site_title}
              onChange={(e) => handleInputChange("site_title", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Site başlığını girin"
            />
          </div>

          {/* Site Açıklaması */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Site Açıklaması
            </label>
            <textarea
              value={seoSettings.site_description}
              onChange={(e) =>
                handleInputChange("site_description", e.target.value)
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Site açıklamasını girin"
            />
          </div>

          {/* Anahtar Kelimeler */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Anahtar Kelimeler
            </label>
            <input
              type="text"
              value={seoSettings.keywords}
              onChange={(e) => handleInputChange("keywords", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Virgülle ayırarak anahtar kelimeleri girin"
            />
          </div>

          {/* Google Analytics ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Google Analytics ID
            </label>
            <input
              type="text"
              value={seoSettings.google_analytics_id}
              onChange={(e) =>
                handleInputChange("google_analytics_id", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="G-XXXXXXXXXX"
            />
          </div>

          {/* Google Search Console */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Google Search Console
            </label>
            <input
              type="text"
              value={seoSettings.google_search_console}
              onChange={(e) =>
                handleInputChange("google_search_console", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Search Console meta tag"
            />
          </div>

          {/* Sitemap URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sitemap URL
            </label>
            <input
              type="text"
              value={seoSettings.sitemap_url}
              onChange={(e) => handleInputChange("sitemap_url", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="https://example.com/sitemap.xml"
            />
          </div>
        </div>

        {/* Robots.txt */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Robots.txt İçeriği
          </label>
          <textarea
            value={seoSettings.robots_txt}
            onChange={(e) => handleInputChange("robots_txt", e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
            placeholder="User-agent: *&#10;Allow: /&#10;Disallow: /admin/&#10;Sitemap: https://example.com/sitemap.xml"
          />
        </div>

        {/* Kaydet Butonu */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
          </button>
        </div>
      </div>

      {/* SEO Önerileri */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          SEO Önerileri
        </h2>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Site başlığının 50-60 karakter arasında olması önerilir
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Site açıklamasının 150-160 karakter arasında olması önerilir
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Anahtar kelimeleri virgülle ayırarak girin
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Google Analytics ID'sini G- ile başlayacak şekilde girin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSeoManagement;
