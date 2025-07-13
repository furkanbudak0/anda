import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";
import NavBar from "../../components/NavBar";
import toast from "react-hot-toast";

const contentTypes = [
  { value: "faq", label: "Sık Sorulan Sorular" },
  { value: "contact_info", label: "İletişim Bilgileri" },
  { value: "about_us", label: "Hakkımızda" },
  { value: "privacy_policy", label: "Gizlilik Politikası" },
  { value: "terms", label: "Kullanım Şartları" },
  { value: "return_policy", label: "İade Politikası" },
  { value: "shipping_info", label: "Kargo Bilgileri" },
];

export default function AdminSiteContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [formData, setFormData] = useState({
    content_type: "faq",
    title: "",
    content: "",
    meta_description: "",
    is_published: true,
    sort_order: 0,
  });

  // Fetch site content
  const { data: siteContent, isLoading } = useQuery({
    queryKey: ["admin-site-content", selectedType],
    queryFn: async () => {
      let query = supabase
        .from("site_content")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (selectedType !== "all") {
        query = query.eq("content_type", selectedType);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },
  });

  // Create content mutation
  const createContentMutation = useMutation({
    mutationFn: async (newContent) => {
      const { data, error } = await supabase
        .from("site_content")
        .insert({
          ...newContent,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-site-content"]);
      toast.success("İçerik başarıyla oluşturuldu!");
      resetForm();
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  // Update content mutation
  const updateContentMutation = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from("site_content")
        .update({
          ...updates,
          updated_by: user.id,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-site-content"]);
      toast.success("İçerik başarıyla güncellendi!");
      resetForm();
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from("site_content")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-site-content"]);
      toast.success("İçerik başarıyla silindi!");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      content_type: "faq",
      title: "",
      content: "",
      meta_description: "",
      is_published: true,
      sort_order: 0,
    });
    setEditingContent(null);
    setIsModalOpen(false);
  };

  const handleEdit = (content) => {
    setEditingContent(content);
    setFormData({
      content_type: content.content_type,
      title: content.title,
      content: content.content,
      meta_description: content.meta_description || "",
      is_published: content.is_published,
      sort_order: content.sort_order || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Başlık ve içerik alanları zorunludur!");
      return;
    }

    if (editingContent) {
      updateContentMutation.mutate({ id: editingContent.id, ...formData });
    } else {
      createContentMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Bu içeriği silmek istediğinizden emin misiniz?")) {
      deleteContentMutation.mutate(id);
    }
  };

  const getContentTypeLabel = (type) => {
    const contentType = contentTypes.find((ct) => ct.value === type);
    return contentType ? contentType.label : type;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />

      <div className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Site İçeriği Yönetimi
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Site sayfalarının içeriklerini buradan yönetebilirsiniz.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Yeni İçerik Ekle
            </button>
          </div>

          {/* Filter */}
          <div className="mb-6">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm İçerikler</option>
              {contentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Content List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Yükleniyor...
                </p>
              </div>
            ) : siteContent?.length === 0 ? (
              <div className="p-8 text-center">
                <DocumentDuplicateIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">
                  Henüz içerik eklenmemiş.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        İçerik
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tür
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Sıralama
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Güncelleme
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {siteContent?.map((content) => (
                      <tr
                        key={content.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {content.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {content.content.substring(0, 100)}...
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {getContentTypeLabel(content.content_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              content.is_published
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                            }`}
                          >
                            {content.is_published ? "Yayında" : "Taslak"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {content.sort_order}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(content.updated_at).toLocaleDateString(
                            "tr-TR"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(content)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(content.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {editingContent ? "İçerik Düzenle" : "Yeni İçerik Ekle"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      İçerik Türü
                    </label>
                    <select
                      value={formData.content_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          content_type: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {contentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sıralama
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sort_order: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Başlık *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    İçerik *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meta Açıklama
                  </label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        meta_description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="SEO için meta açıklama"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="is_published"
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_published: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label
                    htmlFor="is_published"
                    className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Yayında
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createContentMutation.isLoading ||
                      updateContentMutation.isLoading
                    }
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {createContentMutation.isLoading ||
                    updateContentMutation.isLoading
                      ? "Kaydediliyor..."
                      : editingContent
                      ? "Güncelle"
                      : "Oluştur"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
