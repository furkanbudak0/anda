import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  startBulkImport,
  getBulkImportHistory,
} from "../../services/apiBulkProductImport";
import { useAuth } from "../../contexts/AuthContext";

export default function SellerBulkImportPanel() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { data: history = [], refetch } = useQuery({
    queryKey: ["bulk-import-history", user?.seller_id],
    queryFn: () => getBulkImportHistory(user.seller_id),
    enabled: !!user?.seller_id,
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    // Burada dosya Supabase Storage'a yüklenmeli, ardından URL ile import başlatılmalı
    // Demo: sadece dosya adı ile simüle
    await startBulkImport(user.seller_id, file.name);
    setUploading(false);
    setFile(null);
    refetch();
  };

  return (
    <section className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6 mt-8">
      <h2 className="font-bold text-xl mb-4">Toplu Ürün Yükleme</h2>
      <form onSubmit={handleUpload} className="flex gap-2 mb-4">
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => setFile(e.target.files[0])}
          className="border rounded p-2 flex-1"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded p-2"
          disabled={uploading}
        >
          {uploading ? "Yükleniyor..." : "Yükle"}
        </button>
      </form>
      <h3 className="font-semibold mb-2">Yükleme Geçmişi</h3>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Dosya</th>
            <th className="p-2">Durum</th>
            <th className="p-2">Tarih</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.id} className="border-b">
              <td className="p-2">{h.file_url}</td>
              <td className="p-2">{h.status}</td>
              <td className="p-2">{new Date(h.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
