import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PageNotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-4 text-center">
      <h1 className="text-8xl font-bold text-blue-900">404</h1>
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mt-4">
        Sitenin bu kısmını daha yapmadın dayı çık burdan :D
      </h2>
      <p className="text-gray-600 mt-2 max-w-md">
        Üzgünüz, aradığınız sayfa silinmiş olabilir ya da hiç var olmamış
        olabilir.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-full hover:bg-blue-950 transition"
      >
        <ArrowLeft size={18} />
        Ana sayfaya dön
      </Link>
    </div>
  );
};

export default PageNotFound;
