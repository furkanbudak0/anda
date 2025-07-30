import React from "react";

const AdminMobileApp = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Mobil Uygulama Yönetimi
      </h1>
      <p className="text-gray-600 dark:text-gray-300">
        Mobil uygulama ayarlarını ve içeriklerini buradan yönetin.
      </p>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
        <p className="text-lg font-medium text-gray-900 dark:text-white">
          Bu bölüm geliştirme aşamasındadır.
        </p>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Yakında mobil uygulama ile ilgili ayarlar buraya eklenecektir.
        </p>
      </div>
    </div>
  );
};

export default AdminMobileApp;
