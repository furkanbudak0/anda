import { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";

const AdminBackupManagement = () => {
  const [backups, setBackups] = useState([]);
  const [backupSettings, setBackupSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBackups();
    fetchBackupSettings();
  }, []);

  const fetchBackups = async () => {
    try {
      const { data, error } = await supabase
        .from("system_backups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Yedekler yüklenirken hata:", error);
        return;
      }

      setBackups(data || []);
    } catch (error) {
      console.error("Yedekler yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBackupSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("backup_settings")
        .select("*")
        .single();

      if (error) {
        console.error("Yedekleme ayarları yüklenirken hata:", error);
        return;
      }

      setBackupSettings(data);
    } catch (error) {
      console.error("Yedekleme ayarları yüklenirken hata:", error);
    }
  };

  const createBackup = async () => {
    try {
      const { error } = await supabase.from("system_backups").insert({
        name: `Manuel Yedek - ${new Date().toLocaleDateString("tr-TR")}`,
        description: "Manuel olarak oluşturulan yedek",
        status: "completed",
        include_files: true,
        include_database: true,
      });

      if (error) {
        console.error("Yedek oluşturulurken hata:", error);
        return;
      }

      fetchBackups();
    } catch (error) {
      console.error("Yedek oluşturulurken hata:", error);
    }
  };

  const deleteBackup = async (backupId) => {
    if (!confirm("Bu yedeği silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("system_backups")
        .delete()
        .eq("id", backupId);

      if (error) {
        console.error("Yedek silinirken hata:", error);
        return;
      }

      fetchBackups();
    } catch (error) {
      console.error("Yedek silinirken hata:", error);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      completed:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      in_progress:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    const statusTexts = {
      completed: "Tamamlandı",
      in_progress: "Devam Ediyor",
      failed: "Başarısız",
    };
    return statusTexts[status] || status;
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Yedekleme Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sistem yedeklerini yönetin ve otomatik yedekleme ayarlarını
            yapılandırın
          </p>
        </div>
        <button
          onClick={createBackup}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Manuel Yedek Oluştur
        </button>
      </div>

      {/* Backup Settings */}
      {backupSettings && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Otomatik Yedekleme Ayarları
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Otomatik Yedekleme
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {backupSettings.auto_backup_enabled ? "Aktif" : "Pasif"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Yedekleme Sıklığı
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {backupSettings.backup_frequency}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Saklama Süresi
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {backupSettings.retention_days} gün
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Yedekleme Saati
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {backupSettings.backup_time}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Backups List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Sistem Yedekleri
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Yedek Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Boyut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İçerik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Oluşturulma Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {backups.map((backup) => (
                <tr
                  key={backup.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {backup.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        backup.status
                      )}`}
                    >
                      {getStatusText(backup.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {backup.file_size
                      ? `${(backup.file_size / 1024 / 1024).toFixed(2)} MB`
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex space-x-2">
                      {backup.include_database && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Veritabanı
                        </span>
                      )}
                      {backup.include_files && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Dosyalar
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(backup.created_at).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        İndir
                      </button>
                      <button
                        onClick={() => deleteBackup(backup.id)}
                        className="text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {backups.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Henüz yedek bulunmuyor
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            İlk yedeğinizi oluşturmak için yukarıdaki butonu kullanın.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminBackupManagement;
