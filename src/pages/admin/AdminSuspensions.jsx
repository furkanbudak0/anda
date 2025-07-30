import { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";
import { formatDate } from "../../utils/formatters";

const AdminSuspensions = () => {
  const [suspensions, setSuspensions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    reason: "",
    suspension_type: "temporary",
    end_date: "",
  });

  useEffect(() => {
    fetchSuspensions();
    fetchUsers();
  }, []);

  const fetchSuspensions = async () => {
    try {
      const { data, error } = await supabase
        .from("user_suspensions")
        .select(
          `
          *,
          user:profiles (
            full_name,
            email
          ),
          suspended_by_admin:admins (
            full_name
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Askıya almalar yüklenirken hata:", error);
        return;
      }

      setSuspensions(data || []);
    } catch (error) {
      console.error("Askıya almalar yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");

      if (error) {
        console.error("Kullanıcılar yüklenirken hata:", error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error("Kullanıcılar yüklenirken hata:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from("user_suspensions").insert({
        user_id: formData.user_id,
        reason: formData.reason,
        suspension_type: formData.suspension_type,
        end_date:
          formData.suspension_type === "temporary" ? formData.end_date : null,
        is_active: true,
      });

      if (error) {
        console.error("Askıya alma oluşturulurken hata:", error);
        return;
      }

      setShowModal(false);
      setFormData({
        user_id: "",
        reason: "",
        suspension_type: "temporary",
        end_date: "",
      });
      fetchSuspensions();
    } catch (error) {
      console.error("Askıya alma oluşturulurken hata:", error);
    }
  };

  const handleLiftSuspension = async (suspensionId) => {
    try {
      const { error } = await supabase
        .from("user_suspensions")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", suspensionId);

      if (error) {
        console.error("Askıya alma kaldırılırken hata:", error);
        return;
      }

      fetchSuspensions();
    } catch (error) {
      console.error("Askıya alma kaldırılırken hata:", error);
    }
  };

  const getSuspensionTypeText = (type) => {
    return type === "temporary" ? "Geçici" : "Kalıcı";
  };

  const getStatusText = (isActive) => {
    return isActive ? "Aktif" : "Kaldırıldı";
  };

  const getStatusColor = (isActive) => {
    return isActive
      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Kullanıcı Askıya Alma Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Kullanıcıları askıya alın ve yönetin
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
        >
          Kullanıcı Askıya Al
        </button>
      </div>

      {/* Suspensions List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Askıya Alınan Kullanıcılar
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {suspensions.map((suspension) => (
            <div key={suspension.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    {suspension.user?.full_name || "Bilinmeyen Kullanıcı"}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {suspension.user?.email}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    <strong>Sebep:</strong> {suspension.reason}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        suspension.is_active
                      )}`}
                    >
                      {getStatusText(suspension.is_active)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Tür: {getSuspensionTypeText(suspension.suspension_type)}
                    </span>
                    {suspension.end_date && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Bitiş: {formatDate(suspension.end_date)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Askıya alan:{" "}
                    {suspension.suspended_by_admin?.full_name || "Sistem"}
                  </p>
                </div>
                {suspension.is_active && (
                  <button
                    onClick={() => handleLiftSuspension(suspension.id)}
                    className="text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300"
                  >
                    Askıyı Kaldır
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Kullanıcı Askıya Al
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kullanıcı
                  </label>
                  <select
                    value={formData.user_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        user_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Kullanıcı seçin</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Askıya Alma Türü
                  </label>
                  <select
                    value={formData.suspension_type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        suspension_type: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="temporary">Geçici</option>
                    <option value="permanent">Kalıcı</option>
                  </select>
                </div>

                {formData.suspension_type === "temporary" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bitiş Tarihi
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          end_date: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={formData.suspension_type === "temporary"}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sebep
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setFormData({
                        user_id: "",
                        reason: "",
                        suspension_type: "temporary",
                        end_date: "",
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Askıya Al
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSuspensions;
