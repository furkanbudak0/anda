import React from "react";
import { Link } from "react-router-dom";

export default function DistanceSalesAgreement() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link
          to="/checkout"
          className="inline-flex items-center text-brand-600 hover:text-brand-700"
        >
          ← Geri Dön
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Mesafeli Satış Sözleşmesi
        </h1>

        <div className="prose prose-gray max-w-none">
          <h2 className="text-lg font-semibold mb-4">1. TARAFLAR</h2>
          <p className="mb-4">
            <strong>SATICI:</strong> ANDA E-ticaret Platformu
            <br />
            <strong>ALICI:</strong> Platform üzerinden alışveriş yapan müşteri
          </p>

          <h2 className="text-lg font-semibold mb-4">2. KONU</h2>
          <p className="mb-4">
            Bu sözleşme, alıcının satıcıdan uzaktan sipariş ettiği ürünlerin
            satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin
            Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği
            hükümleri gereğince tarafların hak ve yükümlülüklerini düzenler.
          </p>

          <h2 className="text-lg font-semibold mb-4">3. GENEL HÜKÜMLER</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              Alıcı, sipariş ettiği ürünlerin özelliklerini, satış bedelini,
              ödeme şeklini ve teslimat koşullarını önceden öğrenme hakkına
              sahiptir.
            </li>
            <li>
              Satıcı, sipariş edilen ürünleri belirtilen süre içinde teslim
              etmekle yükümlüdür.
            </li>
            <li>
              Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde hiçbir
              gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma
              hakkına sahiptir.
            </li>
            <li>
              Cayma hakkının kullanılması halinde, satıcı alıcının ödediği tüm
              bedeli 14 gün içinde iade etmekle yükümlüdür.
            </li>
          </ul>

          <h2 className="text-lg font-semibold mb-4">4. ÖDEME VE TESLİMAT</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              Ödeme, sipariş sırasında belirtilen yöntemle gerçekleştirilir.
            </li>
            <li>Teslimat, alıcının belirttiği adrese yapılır.</li>
            <li>
              Teslimat süresi, ürünün stok durumuna göre değişiklik
              gösterebilir.
            </li>
            <li>
              Kargo ücreti, sipariş sırasında belirtilir ve alıcı tarafından
              ödenir.
            </li>
          </ul>

          <h2 className="text-lg font-semibold mb-4">
            5. GARANTİ VE SORUMLULUK
          </h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Satıcı, ürünlerin ayıplı olmamasından sorumludur.</li>
            <li>
              Ürünlerin garanti süreleri, üretici firma tarafından belirlenir.
            </li>
            <li>
              Ayıplı ürünler için değişim, onarım veya iade işlemleri yapılır.
            </li>
          </ul>

          <h2 className="text-lg font-semibold mb-4">
            6. KİŞİSEL VERİLERİN KORUNMASI
          </h2>
          <p className="mb-4">
            Alıcının kişisel verileri, 6698 sayılı Kişisel Verilerin Korunması
            Kanunu kapsamında korunur ve sadece sözleşmenin amacı doğrultusunda
            kullanılır.
          </p>

          <h2 className="text-lg font-semibold mb-4">7. UYUŞMAZLIK ÇÖZÜMÜ</h2>
          <p className="mb-4">
            Bu sözleşmeden doğacak uyuşmazlıklar, öncelikle görüşme yoluyla
            çözülmeye çalışılır. Çözülemeyen uyuşmazlıklar için Tüketici Hakem
            Heyetleri ve Tüketici Mahkemeleri yetkilidir.
          </p>

          <h2 className="text-lg font-semibold mb-4">8. YÜRÜRLÜK</h2>
          <p className="mb-4">
            Bu sözleşme, alıcının siparişi onayladığı tarihten itibaren
            yürürlüğe girer.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg mt-6">
            <p className="text-sm text-gray-700">
              <strong>Önemli Not:</strong> Bu sözleşmeyi okuduktan sonra
              siparişinizi onaylayarak tüm koşulları kabul etmiş sayılırsınız.
              Siparişinizi iptal etmek için 24 saat içinde müşteri hizmetleri
              ile iletişime geçebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
