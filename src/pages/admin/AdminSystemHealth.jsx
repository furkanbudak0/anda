import { useState, useEffect } from "react";
import {
  ServerIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import AdminSidebar from "../AdminSidebar";

export default function AdminSystemHealth() {
  const [systemHealth, setSystemHealth] = useState({
    status: "healthy",
    uptime: "7d 14h 32m",
    lastCheck: new Date(),
    services: {
      database: { status: "healthy", responseTime: 45, uptime: "99.8%" },
      api: { status: "healthy", responseTime: 28, uptime: "99.9%" },
      storage: { status: "healthy", responseTime: 12, uptime: "99.7%" },
      cache: { status: "warning", responseTime: 156, uptime: "98.9%" },
      email: { status: "healthy", responseTime: 89, uptime: "99.2%" },
      search: { status: "healthy", responseTime: 67, uptime: "99.5%" },
    },
    metrics: {
      cpu: { usage: 42, cores: 4, load: 1.2 },
      memory: { used: 3.2, total: 8.0, percentage: 40 },
      disk: { used: 120, total: 500, percentage: 24 },
      network: { in: 1.2, out: 0.8 },
    },
    errors: [
      {
        id: 1,
        level: "warning",
        message: "Cache response time yüksek",
        timestamp: new Date(Date.now() - 3600000),
        service: "cache",
      },
      {
        id: 2,
        level: "info",
        message: "Database backup tamamlandı",
        timestamp: new Date(Date.now() - 7200000),
        service: "database",
      },
    ],
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemHealth((prev) => ({
        ...prev,
        lastCheck: new Date(),
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setSystemHealth((prev) => ({
        ...prev,
        lastCheck: new Date(),
        services: {
          ...prev.services,
          cache: {
            ...prev.services.cache,
            responseTime: Math.floor(Math.random() * 100) + 20,
          },
        },
      }));
      setIsRefreshing(false);
    }, 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "healthy":
        return <CheckCircleIcon className="w-5 h-5" />;
      case "warning":
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      case "error":
        return <XCircleIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleString("tr-TR");
  };

  const getUsageColor = (percentage) => {
    if (percentage > 90) return "bg-red-500";
    if (percentage > 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <AdminSidebar />
      <div className="flex-1 pt-16 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sistem Sağlığı</h1>
            <p className="text-gray-600">
              Son güncelleme: {formatTimestamp(systemHealth.lastCheck)}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <ArrowPathIcon
              className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Yenile
          </button>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(
                  systemHealth.status
                )}`}
              >
                {getStatusIcon(systemHealth.status)}
              </div>
              <div>
                <p className="text-sm text-gray-500">Sistem Durumu</p>
                <p className="font-semibold capitalize">
                  {systemHealth.status === "healthy"
                    ? "Sağlıklı"
                    : systemHealth.status}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sistem Çalışma Süresi</p>
                <p className="font-semibold">{systemHealth.uptime}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ServerIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Aktif Servisler</p>
                <p className="font-semibold">
                  {
                    Object.values(systemHealth.services).filter(
                      (s) => s.status === "healthy"
                    ).length
                  }
                  /{Object.values(systemHealth.services).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Uyarılar</p>
                <p className="font-semibold">
                  {
                    systemHealth.errors.filter((e) => e.level === "warning")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Services Status */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Servis Durumu
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(systemHealth.services).map(([key, service]) => (
                <div
                  key={key}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(
                          service.status
                        )}`}
                      >
                        {getStatusIcon(service.status)}
                      </div>
                      <h3 className="font-medium text-gray-900 capitalize">
                        {key}
                      </h3>
                    </div>
                    <span className="text-sm text-gray-500">
                      {service.uptime}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>
                      Yanıt Süresi:{" "}
                      <span className="font-medium">
                        {service.responseTime}ms
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Sistem Kaynakları
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* CPU Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ServerIcon className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                      CPU Kullanımı
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {systemHealth.metrics.cpu.usage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getUsageColor(
                      systemHealth.metrics.cpu.usage
                    )}`}
                    style={{ width: `${systemHealth.metrics.cpu.usage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {systemHealth.metrics.cpu.cores} core, Load:{" "}
                  {systemHealth.metrics.cpu.load}
                </p>
              </div>

              {/* Memory Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ServerIcon className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">
                      RAM Kullanımı
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {systemHealth.metrics.memory.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getUsageColor(
                      systemHealth.metrics.memory.percentage
                    )}`}
                    style={{
                      width: `${systemHealth.metrics.memory.percentage}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {systemHealth.metrics.memory.used}GB /{" "}
                  {systemHealth.metrics.memory.total}GB
                </p>
              </div>

              {/* Disk Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ServerIcon className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Disk Kullanımı
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {systemHealth.metrics.disk.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getUsageColor(
                      systemHealth.metrics.disk.percentage
                    )}`}
                    style={{
                      width: `${systemHealth.metrics.disk.percentage}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {systemHealth.metrics.disk.used}GB /{" "}
                  {systemHealth.metrics.disk.total}GB
                </p>
              </div>

              {/* Network */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ServerIcon className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Network Trafiği
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>↓ {systemHealth.metrics.network.in} MB/s</span>
                  <span>↑ {systemHealth.metrics.network.out} MB/s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Events */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Son Olaylar
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {systemHealth.errors.map((error) => (
                  <div
                    key={error.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getStatusColor(
                        error.level
                      )}`}
                    >
                      {getStatusIcon(error.level)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {error.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {error.service}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(error.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
