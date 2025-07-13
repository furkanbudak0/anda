import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  EyeIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  PlusIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";
import NavBar from "../../components/NavBar";
import Spinner from "../../components/Spinner";
import { Modal, ModalButton, FormModal } from "../../components/ui";
import { formatDate } from "../../utils/formatters";
import toast from "react-hot-toast";
import {
  useCreateAdmin,
  useAdmins,
  useDeactivateAdmin,
  useReactivateAdmin,
  ADMIN_LEVELS,
  DEFAULT_ADMIN_PERMISSIONS,
} from "../../hooks/useAdminAuth";
import { logActivity } from "../../services/apiAuth";

export default function AdminUserManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionType, setSuspensionType] = useState("temporary");
  const [suspensionEndDate, setSuspensionEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users", searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("users")
        .select(
          `
          *,
          suspension:user_suspensions(
            id,
            reason,
            suspension_type,
            end_date,
            is_active
          )
        `
        )
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(
          `full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const filteredUsers = users.filter((user) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "suspended" && user.suspension?.is_active) ||
      (statusFilter === "active" && !user.suspension?.is_active);

    return matchesStatus;
  });

  // Suspend user mutation
  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, reason, type, endDate }) => {
      const { error } = await supabase.from("user_suspensions").insert({
        user_id: userId,
        suspended_by: user.id,
        reason,
        suspension_type: type,
        end_date: endDate || null,
        is_active: true,
      });

      if (error) throw error;

      // Log admin activity
      if (import.meta.env.DEV) {
        console.log("Admin activity logged: suspend_user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      toast.success("Kullanıcı başarıyla askıya alındı!");
      setIsSuspendModalOpen(false);
      setSuspensionReason("");
      setSuspensionType("temporary");
      setSuspensionEndDate("");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  // Unsuspend user mutation
  const unsuspendUserMutation = useMutation({
    mutationFn: async (userId) => {
      const { error } = await supabase
        .from("user_suspensions")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;

      if (import.meta.env.DEV) {
        console.log("Admin activity logged: unsuspend_user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      toast.success("Kullanıcı başarıyla askıdan çıkarıldı!");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleSuspendUser = (selectedUser) => {
    setSelectedUser(selectedUser);
    setIsSuspendModalOpen(true);
  };

  const handleConfirmSuspension = () => {
    if (!suspensionReason.trim()) {
      toast.error("Askıya alma sebebi zorunludur!");
      return;
    }

    if (suspensionType === "temporary" && !suspensionEndDate) {
      toast.error("Geçici askıya alma için bitiş tarihi zorunludur!");
      return;
    }

    suspendUserMutation.mutate({
      userId: selectedUser.id,
      reason: suspensionReason,
      type: suspensionType,
      endDate: suspensionType === "temporary" ? suspensionEndDate : null,
    });
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />

      <div className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Kullanıcı ve Admin Yönetimi
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateAdminModal(true)}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <ShieldCheckIcon className="w-5 h-5" />
                Yeni Admin Oluştur
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("users")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "users"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Kullanıcılar
                </div>
              </button>
              <button
                onClick={() => setActiveTab("admins")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "admins"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-5 h-5" />
                  Adminler
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {activeTab === "users" && <UsersTab />}
            {activeTab === "admins" && <AdminsTab />}
          </div>

          {/* User Detail Modal */}
          <Modal
            isOpen={isDetailModalOpen && selectedUser}
            onClose={() => setIsDetailModalOpen(false)}
            title="Kullanıcı Detayları"
            size="lg"
          >
            {selectedUser && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ad Soyad
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedUser.full_name || "Belirtilmemiş"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Email
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Kayıt Tarihi
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedUser.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Son Giriş
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedUser.last_sign_in_at
                      ? formatDate(selectedUser.last_sign_in_at)
                      : "Hiç giriş yapmamış"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Durum
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedUser.suspension?.is_active
                      ? "Askıya Alınmış"
                      : "Aktif"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Rol
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedUser.role || "user"}
                  </p>
                </div>

                {selectedUser.suspension?.is_active && (
                  <div className="md:col-span-2 mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                      Askıya Alma Bilgileri
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <strong>Sebep:</strong> {selectedUser.suspension.reason}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <strong>Tür:</strong>{" "}
                      {selectedUser.suspension.suspension_type}
                    </p>
                    {selectedUser.suspension.end_date && (
                      <p className="text-sm text-red-700 dark:text-red-300">
                        <strong>Bitiş Tarihi:</strong>{" "}
                        {formatDate(selectedUser.suspension.end_date)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </Modal>

          {/* Suspension Modal */}
          <FormModal
            isOpen={isSuspendModalOpen && selectedUser}
            onClose={() => {
              setIsSuspendModalOpen(false);
              setSuspensionReason("");
              setSuspensionType("temporary");
              setSuspensionEndDate("");
            }}
            onSubmit={handleConfirmSuspension}
            title="Kullanıcıyı Askıya Al"
            size="md"
            submitText="Askıya Al"
            loading={suspendUserMutation.isLoading}
            submitDisabled={!suspensionReason.trim()}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Askıya Alma Sebebi
                </label>
                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Neden bu kullanıcıyı askıya alıyorsunuz?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Askıya Alma Türü
                </label>
                <select
                  value={suspensionType}
                  onChange={(e) => setSuspensionType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="temporary">Geçici</option>
                  <option value="permanent">Kalıcı</option>
                  <option value="warning">Uyarı</option>
                </select>
              </div>

              {suspensionType === "temporary" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={suspensionEndDate}
                    onChange={(e) => setSuspensionEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              )}
            </div>
          </FormModal>

          {/* Create Admin Modal */}
          {showCreateAdminModal && (
            <CreateAdminModal
              onClose={() => setShowCreateAdminModal(false)}
              currentAdminId={user?.id}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Kullanıcılar Tab Component'i
function UsersTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionType, setSuspensionType] = useState("temporary");
  const [suspensionEndDate, setSuspensionEndDate] = useState("");

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users", searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("users")
        .select(
          `
          *,
          suspension:user_suspensions(
            id,
            reason,
            suspension_type,
            end_date,
            is_active
          )
        `
        )
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(
          `full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const filteredUsers = users.filter((user) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "suspended" && user.suspension?.is_active) ||
      (statusFilter === "active" && !user.suspension?.is_active);

    return matchesStatus;
  });

  // Suspend user mutation
  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, reason, type, endDate }) => {
      const { error } = await supabase.from("user_suspensions").insert({
        user_id: userId,
        suspended_by: user.id,
        reason,
        suspension_type: type,
        end_date: endDate || null,
        is_active: true,
      });

      if (error) throw error;

      // Log admin activity
      if (import.meta.env.DEV) {
        console.log("Admin activity logged: suspend_user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      toast.success("Kullanıcı başarıyla askıya alındı!");
      setIsSuspendModalOpen(false);
      setSuspensionReason("");
      setSuspensionType("temporary");
      setSuspensionEndDate("");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  // Unsuspend user mutation
  const unsuspendUserMutation = useMutation({
    mutationFn: async (userId) => {
      const { error } = await supabase
        .from("user_suspensions")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;

      if (import.meta.env.DEV) {
        console.log("Admin activity logged: unsuspend_user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      toast.success("Kullanıcı başarıyla askıdan çıkarıldı!");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleSuspendUser = (selectedUser) => {
    setSelectedUser(selectedUser);
    setIsSuspendModalOpen(true);
  };

  const handleConfirmSuspension = () => {
    if (!suspensionReason.trim()) {
      toast.error("Askıya alma sebebi zorunludur!");
      return;
    }

    if (suspensionType === "temporary" && !suspensionEndDate) {
      toast.error("Geçici askıya alma için bitiş tarihi zorunludur!");
      return;
    }

    suspendUserMutation.mutate({
      userId: selectedUser.id,
      reason: suspensionReason,
      type: suspensionType,
      endDate: suspensionType === "temporary" ? suspensionEndDate : null,
    });
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Kullanıcı Listesi
      </h2>
      <div className="text-gray-500 dark:text-gray-400 text-center py-8">
        Kullanıcı yönetim özellikleri burada görünecek
      </div>
    </div>
  );
}

// Admin'ler Tab Component'i
function AdminsTab() {
  const { data: admins, isLoading, error } = useAdmins();
  const { mutate: deactivateAdmin } = useDeactivateAdmin();
  const { mutate: reactivateAdmin } = useReactivateAdmin();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Admin listesi yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center py-8 text-red-500">
          Admin listesi yüklenirken hata oluştu: {error.message}
        </div>
      </div>
    );
  }

  const handleDeactivate = (adminId, adminEmail) => {
    if (
      confirm(
        `${adminEmail} adresli admin'i deaktive etmek istediğinizden emin misiniz?`
      )
    ) {
      deactivateAdmin({
        adminId,
        deactivatedBy: user?.id,
        reason: "Manuel deaktivasyon",
      });
    }
  };

  const handleReactivate = (adminId, adminEmail) => {
    if (
      confirm(
        `${adminEmail} adresli admin'i tekrar aktive etmek istediğinizden emin misiniz?`
      )
    ) {
      reactivateAdmin({
        adminId,
        reactivatedBy: user?.id,
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Admin Listesi ({admins?.length || 0})
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Admin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Seviye
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Departman
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Son Aktivite
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {admins?.map((admin) => (
              <AdminRow
                key={admin.id}
                admin={admin}
                onDeactivate={handleDeactivate}
                onReactivate={handleReactivate}
                currentUserId={user?.id}
              />
            ))}
          </tbody>
        </table>

        {(!admins || admins.length === 0) && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Henüz admin hesabı bulunmuyor
          </div>
        )}
      </div>
    </div>
  );
}

// Admin Row Component'i
function AdminRow({ admin, onDeactivate, onReactivate, currentUserId }) {
  const adminLevel = ADMIN_LEVELS[admin.admin_level] || ADMIN_LEVELS.admin;
  const isCurrentUser = admin.id === currentUserId;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <ShieldCheckIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {admin.full_name}
              {isCurrentUser && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Siz
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {admin.email}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${
            adminLevel.color === "red"
              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
              : adminLevel.color === "purple"
              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
          }`}
        >
          {adminLevel.label}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {admin.department || "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${
            admin.is_active
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
          }`}
        >
          {admin.is_active ? "Aktif" : "Deaktif"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {admin.last_activity
          ? new Date(admin.last_activity).toLocaleDateString("tr-TR")
          : "Hiç giriş yapmamış"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-2">
          <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400">
            <EyeIcon className="w-4 h-4" />
          </button>
          <button className="text-green-600 hover:text-green-900 dark:text-green-400">
            <PencilIcon className="w-4 h-4" />
          </button>
          {!isCurrentUser &&
            (admin.is_active ? (
              <button
                onClick={() => onDeactivate(admin.id, admin.email)}
                className="text-red-600 hover:text-red-900 dark:text-red-400"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onReactivate(admin.id, admin.email)}
                className="text-green-600 hover:text-green-900 dark:text-green-400"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
            ))}
        </div>
      </td>
    </tr>
  );
}

// Create Admin Modal Component'i
function CreateAdminModal({ onClose, currentAdminId }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    adminLevel: "admin",
    department: "",
    employeeId: "",
    notes: "",
  });

  const { mutate: createAdmin, isLoading } = useCreateAdmin();

  const handleSubmit = (e) => {
    e.preventDefault();

    createAdmin(
      {
        ...formData,
        createdBy: currentAdminId,
        permissions: getDefaultPermissionsByLevel(formData.adminLevel),
        accessLevel: getAccessLevelByType(formData.adminLevel),
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Yeni Admin Oluştur
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ad Soyad *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Şifre *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Admin Seviyesi *
              </label>
              <select
                name="adminLevel"
                value={formData.adminLevel}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              >
                {Object.entries(ADMIN_LEVELS).map(([value, level]) => (
                  <option key={value} value={value}>
                    {level.label} - {level.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Departman
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="ör: IT, Pazarlama, İnsan Kaynakları"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Personel ID
            </label>
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              placeholder="ör: EMP001"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notlar
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Admin hakkında notlar..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Oluşturuluyor..." : "Admin Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Utility functions
function getDefaultPermissionsByLevel(adminLevel) {
  const permissions = { ...DEFAULT_ADMIN_PERMISSIONS };

  switch (adminLevel) {
    case "super_admin":
      // Süper admin'e tüm yetkiler ver
      Object.keys(permissions).forEach((key) => {
        permissions[key] = true;
      });
      break;

    case "admin":
      // Admin'e çoğu yetkiyi ver, super admin yetkilerini hariç tut
      permissions.view_users = true;
      permissions.edit_users = true;
      permissions.view_sellers = true;
      permissions.approve_sellers = true;
      permissions.edit_sellers = true;
      permissions.view_all_products = true;
      permissions.moderate_products = true;
      permissions.view_all_orders = true;
      permissions.manage_categories = true;
      permissions.manage_content = true;
      permissions.view_analytics = true;
      permissions.view_system_health = true;
      break;

    case "moderator":
      // Moderatöre temel yetkileri ver
      permissions.view_users = true;
      permissions.view_sellers = true;
      permissions.view_all_products = true;
      permissions.moderate_products = true;
      permissions.view_all_orders = true;
      permissions.manage_content = true;
      break;
  }

  return permissions;
}

function getAccessLevelByType(adminLevel) {
  switch (adminLevel) {
    case "super_admin":
      return 10;
    case "admin":
      return 7;
    case "moderator":
      return 3;
    default:
      return 1;
  }
}
