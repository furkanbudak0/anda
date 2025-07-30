import { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";

const AdminAlgorithmManagement = () => {
  const [algorithmScores, setAlgorithmScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchAlgorithmScores();
  }, []);

  const fetchAlgorithmScores = async () => {
    try {
      const { data, error } = await supabase
        .from("algorithm_scores")
        .select(
          `
          *,
          product:products (
            name,
            uuid
          )
        `
        )
        .order("overall_score", { ascending: false });

      if (error) {
        console.error("Algoritma skorları yüklenirken hata:", error);
        return;
      }

      setAlgorithmScores(data || []);
    } catch (error) {
      console.error("Algoritma skorları yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const recalculateScores = async () => {
    try {
      // Bu fonksiyon algoritma skorlarını yeniden hesaplar
      console.log("Algoritma skorları yeniden hesaplanıyor...");
      // Gerçek implementasyon burada olacak
    } catch (error) {
      console.error("Skorlar hesaplanırken hata:", error);
    }
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Algoritma Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Ürün algoritma skorlarını yönetin
          </p>
        </div>
        <button
          onClick={recalculateScores}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Skorları Yeniden Hesapla
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Algoritma Skorları
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ürün
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Genel Skor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Seviye
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Değerlendirme Skoru
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tazelik Skoru
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Son Hesaplama
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {algorithmScores.map((score) => (
                <tr
                  key={score.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {score.product?.name || "Bilinmeyen Ürün"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {score.overall_score?.toFixed(2) || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {score.tier || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {score.rating_score?.toFixed(2) || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {score.freshness_score?.toFixed(2) || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {score.last_calculated_at
                      ? new Date(score.last_calculated_at).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAlgorithmManagement;
