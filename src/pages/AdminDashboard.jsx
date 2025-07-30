import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

function AdminDashboard() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Üstteki NavBar */}
      {/* <NavBar /> KALDIRILDI */}

      {/* Alt kısım: sidebar + içerik */}
      <div className="flex flex-1">
        {/* Sol Sidebar */}
        <AdminSidebar />

        {/* Sayfa içeriği */}
        <main className="flex-1 p-4 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
