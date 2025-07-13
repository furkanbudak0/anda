import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEditProduct } from "../services/apiProducts";
import { toast } from "react-hot-toast";
import ImagePreview from "./ImagePreview"; // Özel bileşen

function ProductForm({ productToEdit = {}, onClose }) {
  const { id: editId, ...editValues } = productToEdit;
  const isEditSession = Boolean(editId);
  const queryClient = useQueryClient();

  // Thumbnail preview state (string URL veya File)
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  // Diğer resimler preview state (string URL veya File)
  const [otherImagesPreviews, setOtherImagesPreviews] = useState([]);

  // Düzenleme modunda önceden yüklenmiş resimleri ayarla
  useEffect(() => {
    if (isEditSession) {
      if (editValues.thumbnail) {
        setThumbnailPreview(editValues.thumbnail);
      }
      if (editValues.otherImages) {
        try {
          const parsedImages = JSON.parse(editValues.otherImages);
          setOtherImagesPreviews(
            Array.isArray(parsedImages) ? parsedImages : []
          );
        } catch {
          setOtherImagesPreviews([]);
        }
      }
    }
  }, [editValues, isEditSession]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: isEditSession
      ? {
          ...editValues,
          discountEndDate: editValues.discountEndDate
            ? editValues.discountEndDate.split("T")[0]
            : "",
          // Thumbnail ve otherImages default değerlerini kontrol ile eklemedik,
          // çünkü dosya inputları kontrol dışı.
        }
      : {},
  });

  // Form üzerindeki dosya inputlarının değişimini manuel state'e yansıtmak için watch ediyoruz
  const watchedThumbnail = watch("thumbnail");
  const watchedOtherImages = watch("otherImages");

  // Thumbnail değiştiğinde preview oluştur
  useEffect(() => {
    if (watchedThumbnail && watchedThumbnail.length > 0) {
      const file = watchedThumbnail[0];
      if (file instanceof Blob) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setThumbnailPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        // File değil, örn. string gelmiş olabilir, direkt setle
        setThumbnailPreview(file);
      }
    } else {
      setThumbnailPreview("");
    }
  }, [watchedThumbnail]);

  // OtherImages değiştiğinde previewleri async olarak oluşturuyoruz
  useEffect(() => {
    if (watchedOtherImages && watchedOtherImages.length > 0) {
      const files = Array.from(watchedOtherImages);
      Promise.all(
        files.map(
          (file) =>
            new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(file);
            })
        )
      ).then((images) => {
        // Yeni eklenenleri mevcut previewlere ekle
        setOtherImagesPreviews((prev) => [...prev, ...images]);
      });
    }
  }, [watchedOtherImages]);

  // Diğer resim önizlemesinden birini silmek
  const removeOtherImage = (index) => {
    setOtherImagesPreviews((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  };

  // React Query mutation
  const { mutate: saveProduct, isLoading } = useMutation({
    mutationFn: ({ data, id }) => createEditProduct(data, id),
    onSuccess: () => {
      toast.success(
        isEditSession ? "Ürün başarıyla güncellendi" : "Yeni ürün eklendi"
      );
      queryClient.invalidateQueries(["my-products"]);
      reset();
      onClose?.();
    },
    onError: (err) => {
      toast.error(err.message || "Bir hata oluştu");
      console.error("Ürün kaydetme hatası:", err);
    },
  });

  const onSubmit = async (data) => {
    try {
      // discount parantez hatası düzeltildi:
      const discountNum = Math.min(
        100,
        Math.max(0, parseFloat(data.discount) || 0)
      );

      // Diğer verileri JSON'a çevirirken trim ve filter yapılıyor
      const formatted = {
        ...data,
        regularPrice: parseFloat(data.regularPrice) || 0,
        availableStock: parseInt(data.availableStock) || 0,
        discount: discountNum,
        discountEndDate: data.discountEndDate
          ? new Date(data.discountEndDate).toISOString()
          : null,
        tags: data.tags
          ? JSON.stringify(
              data.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            )
          : null,
        colorOptions: data.colorOptions
          ? JSON.stringify(
              data.colorOptions
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean)
            )
          : null,
        sizeOptions: data.sizeOptions
          ? JSON.stringify(
              data.sizeOptions
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            )
          : null,
      };

      // thumbnail: Ya File ya string URL olabilir
      let thumbnailInput = data.thumbnail?.[0] || thumbnailPreview;
      if (
        typeof thumbnailInput === "string" &&
        thumbnailInput.startsWith("data:")
      ) {
        // Eğer preview data URL ise, yani yeni dosya seçilmiş ama henüz upload edilmemiş,
        // bunu file olarak backend'e gönderemeyiz. Bu durumda kullanıcı mutlaka input ile seçmeli.
        // Bu senaryoda frontend'de bu durumu engellemek veya backend'de desteklemek gerekebilir.
        toast.error("Lütfen kapak fotoğrafını yeniden seçin.");
        return;
      }

      // Diğer resimler:
      // otherImagesPreviews içindeki string URL ve dataURL'ler olabilir
      // Backend 'string' olanları olduğu gibi bırakır, 'File' olanları upload eder.
      // Ama burada sadece dosya inputundan alınan file'ları backend'e gönderiyoruz.
      // Bu yüzden yeni yüklenen dosyalar data.otherImages içinde olmalı,
      // diğerleri URL olarak tutulmalı ve backend'de ayrışmalı.

      // Ama biz burada diğer resimlerde sadece yeni seçilen dosyaları backend'e gönderiyoruz:
      const otherImagesFiles = data.otherImages
        ? Array.from(data.otherImages).filter((file) => file instanceof File)
        : [];

      saveProduct({
        data: {
          ...formatted,
          thumbnail: thumbnailInput,
          otherImages: otherImagesFiles,
        },
        id: editId,
      });
    } catch (error) {
      toast.error("Form gönderilirken bir hata oluştu");
      console.error("Form gönderme hatası:", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 p-6 max-w-2xl mx-auto bg-white shadow-lg rounded-lg"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          {isEditSession ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
        </h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {isEditSession && (
        <div className="text-green-700 font-semibold bg-green-50 border border-green-300 p-2 rounded">
          Düzenlenen ürün: <strong>{productToEdit.name}</strong>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sol Kolon */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ürün Adı <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name", { required: "Bu alan zorunludur" })}
              placeholder="Ürün Adı"
              className={`input w-full ${errors.name ? "border-red-500" : ""}`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("description", { required: "Bu alan zorunludur" })}
              placeholder="Ürün açıklaması"
              rows={4}
              className={`input w-full ${
                errors.description ? "border-red-500" : ""
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <input
              {...register("category")}
              placeholder="Kategori"
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fiyat <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                ₺
              </span>
              <input
                type="number"
                step="0.01"
                {...register("regularPrice", {
                  required: "Bu alan zorunludur",
                  min: { value: 0, message: "Fiyat negatif olamaz" },
                })}
                placeholder="0.00"
                className={`input w-full pl-8 ${
                  errors.regularPrice ? "border-red-500" : ""
                }`}
              />
            </div>
            {errors.regularPrice && (
              <p className="mt-1 text-sm text-red-600">
                {errors.regularPrice.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stok Miktarı
            </label>
            <input
              type="number"
              min="0"
              {...register("availableStock", {
                min: { value: 0, message: "Stok negatif olamaz" },
              })}
              placeholder="Stok adedi"
              className={`input w-full ${
                errors.availableStock ? "border-red-500" : ""
              }`}
            />
            {errors.availableStock && (
              <p className="mt-1 text-sm text-red-600">
                {errors.availableStock.message}
              </p>
            )}
          </div>
        </div>

        {/* Sağ Kolon */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marka
            </label>
            <input
              {...register("brand")}
              placeholder="Marka"
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kapak Fotoğrafı{" "}
              {!isEditSession && <span className="text-red-500">*</span>}
            </label>
            <input
              type="file"
              accept="image/*"
              {...register("thumbnail", {
                required: !isEditSession && "Kapak fotoğrafı zorunlu",
              })}
              className={`input w-full ${
                errors.thumbnail ? "border-red-500" : ""
              }`}
            />
            {errors.thumbnail && (
              <p className="mt-1 text-sm text-red-600">
                {errors.thumbnail.message}
              </p>
            )}
            {thumbnailPreview && (
              <div className="mt-2">
                <ImagePreview
                  src={thumbnailPreview}
                  alt="Kapak önizleme"
                  onRemove={() => {
                    setThumbnailPreview("");
                    setValue("thumbnail", null);
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diğer Fotoğraflar (maks. 10)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              {...register("otherImages")}
              className="input w-full"
            />
            {otherImagesPreviews.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {otherImagesPreviews.map((img, index) => (
                  <ImagePreview
                    key={index}
                    src={img}
                    alt={`Ürün resmi ${index + 1}`}
                    onRemove={() => removeOtherImage(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alt Bölüm */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Etiketler (virgülle ayırın)
          </label>
          <input
            {...register("tags")}
            placeholder="etiket1, etiket2, etiket3"
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Renk Seçenekleri
          </label>
          <input
            {...register("colorOptions")}
            placeholder="Kırmızı, Mavi, Yeşil"
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Beden Seçenekleri
          </label>
          <input
            {...register("sizeOptions")}
            placeholder="S, M, L, XL"
            className="input w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            İndirim Oranı (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            {...register("discount")}
            placeholder="0"
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            İndirim Bitiş Tarihi
          </label>
          <input
            type="date"
            {...register("discountEndDate")}
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Garanti Süresi
          </label>
          <input
            {...register("warranty")}
            placeholder="2 yıl"
            className="input w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Garanti Firması
        </label>
        <input
          {...register("warrantyFirm")}
          placeholder="Garanti sağlayan firma"
          className="input w-full"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            İptal
          </button>
        )}
        <button
          type="submit"
          disabled={
            isLoading || (!isEditSession && !isDirty && !watchedThumbnail)
          }
          className={`px-4 py-2 rounded-md text-white ${
            isLoading ? "bg-purple-400" : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {isEditSession ? "Güncelleniyor..." : "Ekleniyor..."}
            </span>
          ) : isEditSession ? (
            "Güncelle"
          ) : (
            "Ürün Ekle"
          )}
        </button>
      </div>
    </form>
  );
}

export default ProductForm;
