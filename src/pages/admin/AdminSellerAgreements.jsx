import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";
import NavBar from "../../components/NavBar";
import toast from "react-hot-toast";

const agreementTypes = [
  { value: "contract", label: "Satış Sözleşmesi" },
  { value: "protocol", label: "İşbirliği Protokolü" },
  { value: "terms", label: "Satıcı Şartları" },
  { value: "guidelines", label: "Satış Rehberi" },
  { value: "commission", label: "Komisyon Anlaşması" },
  { value: "return_policy", label: "İade Politikası" },
];

export default function AdminSellerAgreements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    agreement_type: "contract",
    content: "",
    version: "1.0",
    is_active: true,
    effective_date: new Date().toISOString().split("T")[0],
  });

  // Fetch seller agreements
  const { data: agreements, isLoading } = useQuery({
    queryKey: ["admin-seller-agreements", selectedType],
    queryFn: async () => {
      let query = supabase
        .from("seller_agreements")
        .select("*")
        .order("created_at", { ascending: false });

      if (selectedType !== "all") {
        query = query.eq("agreement_type", selectedType);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },
  });

  // Create agreement mutation
  const createAgreementMutation = useMutation({
    mutationFn: async (newAgreement) => {
      const { data, error } = await supabase
        .from("seller_agreements")
        .insert({
          ...newAgreement,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-seller-agreements"]);
      toast.success("Protokol başarıyla oluşturuldu!");
      resetForm();
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  // Update agreement mutation
  const updateAgreementMutation = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from("seller_agreements")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-seller-agreements"]);
      toast.success("Protokol başarıyla güncellendi!");
      resetForm();
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  // Delete agreement mutation
  const deleteAgreementMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from("seller_agreements")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-seller-agreements"]);
      toast.success("Protokol başarıyla silindi!");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      agreement_type: "contract",
      content: "",
      version: "1.0",
      is_active: true,
      effective_date: new Date().toISOString().split("T")[0],
    });
    setEditingAgreement(null);
    setIsModalOpen(false);
  };

  const handleEdit = (agreement) => {
    setEditingAgreement(agreement);
    setFormData({
      title: agreement.title,
      description: agreement.description || "",
      agreement_type: agreement.agreement_type,
      content: agreement.content,
      version: agreement.version,
      is_active: agreement.is_active,
      effective_date:
        agreement.effective_date?.split("T")[0] ||
        new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const handlePreview = (content) => {
    setPreviewContent(content);
    setIsPreviewOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Başlık ve içerik alanları zorunludur!");
      return;
    }

    if (editingAgreement) {
      updateAgreementMutation.mutate({ id: editingAgreement.id, ...formData });
    } else {
      createAgreementMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Bu protokolü silmek istediğinizden emin misiniz?")) {
      deleteAgreementMutation.mutate(id);
    }
  };

  const handleDownloadPdf = async (agreement) => {
    try {
      // Create PDF content
      const pdfContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${agreement.title}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 40px;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 14px;
            color: #666;
        }
        .content {
            white-space: pre-wrap;
            text-align: justify;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">ANDA E-TİCARET PLATFORMU</div>
        <div class="title">${agreement.title}</div>
        <div class="subtitle">Versiyon: ${
          agreement.version
        } | Yürürlük Tarihi: ${new Date(
        agreement.effective_date
      ).toLocaleDateString("tr-TR")}</div>
    </div>
    
    <div class="content">
${agreement.content}
    </div>
    
    <div class="footer">
        <p>Bu belge ANDA E-ticaret Platformu tarafından oluşturulmuştur.</p>
        <p>Oluşturulma Tarihi: ${new Date().toLocaleDateString("tr-TR")}</p>
    </div>
</body>
</html>
      `;

      // Create blob and download
      const blob = new Blob([pdfContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${agreement.title.replace(/[^a-zA-Z0-9]/g, "_")}_v${
        agreement.version
      }.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Dosya indiriliyor...");
    } catch (error) {
      toast.error("Dosya indirme hatası!");
    }
  };

  const getAgreementTypeLabel = (type) => {
    const agreementType = agreementTypes.find((at) => at.value === type);
    return agreementType ? agreementType.label : type;
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
                Satıcı Protokolleri
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Satıcı sözleşmeleri ve protokollerini buradan yönetebilirsiniz.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Yeni Protokol Ekle
            </button>
          </div>

          {/* Filter */}
          <div className="mb-6">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Protokoller</option>
              {agreementTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Agreements List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Yükleniyor...
                </p>
              </div>
            ) : agreements?.length === 0 ? (
              <div className="p-8 text-center">
                <DocumentArrowDownIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">
                  Henüz protokol eklenmemiş.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Protokol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tür
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Versiyon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Yürürlük
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {agreements?.map((agreement) => (
                      <tr
                        key={agreement.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {agreement.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {agreement.description}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            {getAgreementTypeLabel(agreement.agreement_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          v{agreement.version}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              agreement.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                            }`}
                          >
                            {agreement.is_active ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(
                            agreement.effective_date
                          ).toLocaleDateString("tr-TR")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handlePreview(agreement.content)}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(agreement)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              <DocumentArrowDownIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(agreement)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(agreement.id)}
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
                {editingAgreement ? "Protokol Düzenle" : "Yeni Protokol Ekle"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Protokol Türü
                    </label>
                    <select
                      value={formData.agreement_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          agreement_type: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {agreementTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Versiyon
                    </label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={(e) =>
                        setFormData({ ...formData, version: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
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
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Protokol içeriğini buraya yazın..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Yürürlük Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.effective_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        effective_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label
                    htmlFor="is_active"
                    className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Aktif
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
                      createAgreementMutation.isLoading ||
                      updateAgreementMutation.isLoading
                    }
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {createAgreementMutation.isLoading ||
                    updateAgreementMutation.isLoading
                      ? "Kaydediliyor..."
                      : editingAgreement
                      ? "Güncelle"
                      : "Oluştur"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Protokol Önizleme
                </h2>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{previewContent}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
