import { NavLink } from "react-router-dom";
import {
  ChartBarIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  GiftIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  TruckIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  KeyIcon,
  FlagIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ServerIcon,
  ArchiveBoxIcon,
  CpuChipIcon,
  EyeIcon,
  PresentationChartBarIcon,
} from "@heroicons/react/24/outline";

const AdminSidebar = () => {
  const menuSections = [
    {
      title: "Dashboard",
      items: [
        { to: "", icon: ChartBarIcon, label: "Ana Dashboard" },
        {
          to: "analytics",
          icon: PresentationChartBarIcon,
          label: "Gelişmiş Analitik",
        },
      ],
    },
    {
      title: "Kullanıcı Yönetimi",
      items: [
        { to: "users", icon: UsersIcon, label: "Kullanıcılar" },
        { to: "sellers", icon: BuildingStorefrontIcon, label: "Satıcılar" },
        { to: "roles", icon: ShieldCheckIcon, label: "Rol Yönetimi" },
        {
          to: "suspensions",
          icon: ExclamationTriangleIcon,
          label: "Askıya Alınanlar",
        },
      ],
    },
    {
      title: "İçerik Yönetimi",
      items: [
        { to: "content", icon: DocumentTextIcon, label: "Site İçerikleri" },
        { to: "reviews", icon: EyeIcon, label: "İnceleme Onayları" },
        { to: "categories", icon: TagIcon, label: "Kategoriler" },
        {
          to: "agreements",
          icon: ClipboardDocumentListIcon,
          label: "Satıcı Sözleşmeleri",
        },
      ],
    },
    {
      title: "Pazarlama & Kampanyalar",
      items: [
        { to: "campaigns", icon: GiftIcon, label: "Kampanyalar" },
        { to: "coupons", icon: TagIcon, label: "Kuponlar" },
        {
          to: "algorithm",
          icon: ArrowTrendingUpIcon,
          label: "Algoritma Yönetimi",
        },
        { to: "emails", icon: EnvelopeIcon, label: "Email Şablonları" },
      ],
    },
    {
      title: "Sistem Yönetimi",
      items: [
        { to: "messages", icon: ChatBubbleLeftRightIcon, label: "Mesajlaşma" },
        { to: "notifications", icon: BellIcon, label: "Bildirimler" },
        { to: "payments", icon: CurrencyDollarIcon, label: "Ödeme Yönetimi" },
        { to: "shipping", icon: TruckIcon, label: "Kargo Yönetimi" },
      ],
    },
    {
      title: "Teknik",
      items: [
        { to: "system-health", icon: ServerIcon, label: "Sistem Sağlığı" },
        { to: "backups", icon: ArchiveBoxIcon, label: "Yedekleme" },
        { to: "api", icon: KeyIcon, label: "API Yönetimi" },
        { to: "performance", icon: CpuChipIcon, label: "Performans" },
      ],
    },
    {
      title: "Diğer",
      items: [
        { to: "seo", icon: GlobeAltIcon, label: "SEO Yönetimi" },
        { to: "mobile", icon: DevicePhoneMobileIcon, label: "Mobil App" },
        { to: "features", icon: FlagIcon, label: "Özellik Bayrakları" },
        { to: "audit", icon: ClockIcon, label: "Audit Logları" },
      ],
    },
    {
      title: "Ayarlar",
      items: [{ to: "settings", icon: CogIcon, label: "Genel Ayarlar" }],
    },
  ];

  const SidebarItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={`/admin/${to}`}
      end={to === ""}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
          isActive
            ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold border-l-4 border-blue-500"
            : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        }`
      }
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm">{label}</span>
    </NavLink>
  );

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldCheckIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Admin Panel
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Yönetim Merkezi
            </p>
          </div>
        </div>
      </div>

      <nav className="px-3 pb-4">
        <div className="space-y-6">
          {menuSections.map((section, index) => (
            <div key={index}>
              {section.title && (
                <div className="px-3 mb-3">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {section.title}
                  </h3>
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item, idx) => (
                  <SidebarItem
                    key={idx}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
