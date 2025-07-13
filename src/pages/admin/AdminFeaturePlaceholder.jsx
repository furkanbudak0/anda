import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function AdminFeaturePlaceholder() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <WrenchScrewdriverIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Özellik Geliştiriliyor
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Bu özellik şu anda geliştirme aşamasındadır. Yakında kullanıma
          sunulacak.
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
          <ClockIcon className="w-4 h-4" />
          <span>Geliştirme süreci devam ediyor</span>
        </div>

        <button
          onClick={() => navigate("/admin")}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Admin Paneline Dön
        </button>
      </div>
    </div>
  );
}
