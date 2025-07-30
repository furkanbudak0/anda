import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  EnvelopeIcon,
  EyeIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";
import AdminSidebar from "../AdminSidebar";
import Spinner from "../../components/Spinner";
import { formatDate } from "../../utils/formatters";
import toast from "react-hot-toast";

const messageTypes = [
  { value: "support", label: "Destek Talebi", color: "blue" },
  { value: "complaint", label: "Şikayet", color: "red" },
  { value: "suggestion", label: "Öneri", color: "green" },
  { value: "general", label: "Genel", color: "gray" },
];

const priorities = [
  { value: "low", label: "Düşük", color: "green" },
  { value: "medium", label: "Orta", color: "yellow" },
  { value: "high", label: "Yüksek", color: "orange" },
  { value: "urgent", label: "Acil", color: "red" },
];

export default function AdminMessagesSystem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin-messages", filterType, filterStatus, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("admin_messages")
        .select(
          `
          *,
          user:profiles(full_name, email),
          replies:admin_message_replies(
            id,
            content,
            created_at,
            replied_by,
            admin:users!replied_by(full_name)
          )
        `
        )
        .order("created_at", { ascending: false });

      if (filterType !== "all") {
        query = query.eq("message_type", filterType);
      }

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      if (searchTerm) {
        query = query.or(
          `subject.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Reply to message mutation
  const replyMutation = useMutation({
    mutationFn: async ({ messageId, content }) => {
      // Insert reply
      const { error: replyError } = await supabase
        .from("admin_message_replies")
        .insert({
          message_id: messageId,
          content,
          replied_by: user.id,
        });

      if (replyError) throw replyError;

      // Update message status
      const { error: updateError } = await supabase
        .from("admin_messages")
        .update({
          status: "replied",
          last_reply_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-messages"]);
      toast.success("Yanıt başarıyla gönderildi!");
      setIsReplyModalOpen(false);
      setReplyContent("");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  // Update message status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ messageId, status }) => {
      const { error } = await supabase
        .from("admin_messages")
        .update({ status })
        .eq("id", messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-messages"]);
      toast.success("Mesaj durumu güncellendi!");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId) => {
      const { error } = await supabase
        .from("admin_messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-messages"]);
      toast.success("Mesaj silindi!");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleReply = (message) => {
    setSelectedMessage(message);
    setIsReplyModalOpen(true);
  };

  const handleSendReply = () => {
    if (!replyContent.trim()) {
      toast.error("Yanıt içeriği boş olamaz!");
      return;
    }

    replyMutation.mutate({
      messageId: selectedMessage.id,
      content: replyContent,
    });
  };

  const handleStatusUpdate = (messageId, status) => {
    updateStatusMutation.mutate({ messageId, status });
  };

  const handleDelete = (messageId) => {
    if (window.confirm("Bu mesajı silmek istediğinizden emin misiniz?")) {
      deleteMessageMutation.mutate(messageId);
    }
  };

  const getTypeConfig = (type) => {
    return messageTypes.find((t) => t.value === type) || messageTypes[3];
  };

  const getPriorityConfig = (priority) => {
    return priorities.find((p) => p.value === priority) || priorities[1];
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { bg: "bg-blue-100", text: "text-blue-800", label: "Yeni" },
      in_progress: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "İşlemde",
      },
      replied: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Yanıtlandı",
      },
      closed: { bg: "bg-gray-100", text: "text-gray-800", label: "Kapatıldı" },
    };

    const config = statusConfig[status] || statusConfig.new;

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <AdminSidebar />
      <div className="flex-1 pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Mesaj Yönetimi
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Kullanıcı mesajlarını görüntüleyin ve yanıtlayın.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">
                Filtreler
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Arama
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Konu veya içerik ile ara..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mesaj Türü
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tüm Türler</option>
                  {messageTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Durum
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="new">Yeni</option>
                  <option value="in_progress">İşlemde</option>
                  <option value="replied">Yanıtlandı</option>
                  <option value="closed">Kapatıldı</option>
                </select>
              </div>

              <div className="flex items-end">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <UserGroupIcon className="w-4 h-4 inline mr-1" />
                  {messages.length} mesaj
                </div>
              </div>
            </div>
          </div>

          {/* Messages List */}
          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
              <div className="flex justify-center">
                <Spinner size="lg" />
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Mesaj bulunamadı
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Filtrelere uygun mesaj bulunamadı.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Mesaj
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Gönderen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tür & Öncelik
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {messages.map((message) => {
                      const typeConfig = getTypeConfig(message.message_type);
                      const priorityConfig = getPriorityConfig(
                        message.priority
                      );

                      return (
                        <tr
                          key={message.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {message.subject}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                {message.content}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {message.user?.full_name || "Bilinmiyor"}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {message.user?.email || message.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${typeConfig.color}-100 text-${typeConfig.color}-800`}
                              >
                                {typeConfig.label}
                              </span>
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${priorityConfig.color}-100 text-${priorityConfig.color}-800`}
                              >
                                {priorityConfig.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(message.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDate(message.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedMessage(message);
                                  setIsDetailModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReply(message)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              >
                                <ArrowUturnLeftIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(message.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Message Detail Modal */}
          {isDetailModalOpen && selectedMessage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Mesaj Detayları
                  </h3>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {selectedMessage.subject}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      {selectedMessage.content}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Gönderen
                      </p>
                      <p className="font-medium">
                        {selectedMessage.user?.full_name || "Bilinmiyor"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedMessage.user?.email || selectedMessage.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Durum
                      </p>
                      <div className="mt-1">
                        {getStatusBadge(selectedMessage.status)}
                      </div>
                    </div>
                  </div>

                  {selectedMessage.replies &&
                    selectedMessage.replies.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                          Yanıtlar
                        </h5>
                        <div className="space-y-3">
                          {selectedMessage.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {reply.admin?.full_name || "Admin"}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {reply.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleStatusUpdate(selectedMessage.id, "in_progress")
                        }
                        className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm hover:bg-yellow-200"
                      >
                        İşleme Al
                      </button>
                      <button
                        onClick={() =>
                          handleStatusUpdate(selectedMessage.id, "closed")
                        }
                        className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-sm hover:bg-gray-200"
                      >
                        Kapat
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleReply(selectedMessage);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Yanıtla
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reply Modal */}
          {isReplyModalOpen && selectedMessage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Mesajı Yanıtla
                  </h3>
                  <button
                    onClick={() => setIsReplyModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Orijinal Mesaj: {selectedMessage.subject}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {selectedMessage.content}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Yanıtınız
                    </label>
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="5"
                      placeholder="Yanıtınızı yazın..."
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setIsReplyModalOpen(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleSendReply}
                      disabled={replyMutation.isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {replyMutation.isLoading ? "Gönderiliyor..." : "Yanıtla"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
