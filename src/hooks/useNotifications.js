import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { toast } from "react-hot-toast";

// Get user notifications
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          *,
          order:orders(order_number),
          product:products(name, image_url, slug),
          campaign:seller_campaigns(name)
        `
        )
        .eq("user_id", user.id)
        .eq("show_in_app", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });
}

// Get unread notification count
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["unread-notification-count"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false)
        .eq("show_in_app", true);

      if (error) throw error;
      return count || 0;
    },
  });
}

// Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", notificationId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
      queryClient.invalidateQueries(["unread-notification-count"]);
    },
  });
}

// Mark all notifications as read
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
      queryClient.invalidateQueries(["unread-notification-count"]);
      toast.success("Tüm bildirimler okundu olarak işaretlendi");
    },
  });
}

// Create notification
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationData) => {
      const { data, error } = await supabase
        .from("notifications")
        .insert(notificationData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
      queryClient.invalidateQueries(["unread-notification-count"]);
    },
  });
}

// Send stock available notification
export function useSendStockNotification() {
  const createNotification = useCreateNotification();

  return useMutation({
    mutationFn: async ({ productId, userId }) => {
      // Get product details
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("name, slug, seller_id")
        .eq("id", productId)
        .single();

      if (productError) throw productError;

      // Create notification
      await createNotification.mutateAsync({
        user_id: userId,
        type: "stock_available",
        title: "Stok Müjdesi!",
        message: `${product.name} ürünü tekrar stokta! Hemen sipariş verebilirsiniz.`,
        product_id: productId,
        show_in_app: true,
        send_email: true,
        send_push: true,
      });
    },
    onSuccess: () => {
      toast.success("Stok bildirimi gönderildi!");
    },
  });
}

// Get user's push notification settings
export function usePushNotificationSettings() {
  return useQuery({
    queryKey: ["push-notification-settings"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });
}

// Update push notification settings
export function useUpdatePushNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      const { data, error } = await supabase
        .from("push_subscriptions")
        .upsert({
          ...settings,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["push-notification-settings"]);
      toast.success("Bildirim tercihleri güncellendi!");
    },
  });
}

// Subscribe to push notifications
export function useSubscribePushNotifications() {
  const updateSettings = useUpdatePushNotificationSettings();

  return useMutation({
    mutationFn: async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Bu tarayıcı push bildirimleri desteklemiyor");
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Bildirim izni verilmedi");
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY,
      });

      // Save subscription to database
      await updateSettings.mutateAsync({
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        enabled: true,
        order_updates: true,
        promotions: true,
        stock_alerts: true,
        price_drops: true,
      });

      return subscription;
    },
    onSuccess: () => {
      toast.success("Push bildirimler etkinleştirildi!");
    },
    onError: (error) => {
      console.error("Push notification subscription error:", error);
      toast.error("Push bildirimler etkinleştirilemedi");
    },
  });
}

// Send cart abandonment reminder
export function useSendCartReminderNotification() {
  const createNotification = useCreateNotification();

  return useMutation({
    mutationFn: async ({ userId, cartItemCount }) => {
      await createNotification.mutateAsync({
        user_id: userId,
        type: "cart_reminder",
        title: "Sepetinizi tamamlamak ister misiniz?",
        message: `Sepetinizde ${cartItemCount} ürün bekliyor. Satın almayı tamamlamak için tıklayın.`,
        show_in_app: true,
        send_push: true,
        send_email: false,
      });
    },
  });
}

// Get seller notifications
export function useSellerNotifications() {
  return useQuery({
    queryKey: ["seller-notifications"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          *,
          order:orders(order_number, total),
          product:products(name, image_url, slug)
        `
        )
        .eq("seller_id", user.id)
        .eq("show_in_app", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });
}

// Real-time notification subscription
export function useNotificationSubscription() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["notification-subscription"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      // Set up real-time subscription
      const channel = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Show toast notification
            if (payload.new.show_in_app) {
              toast.custom(
                (t) => (
                  <div
                    className={`${
                      t.visible ? "animate-enter" : "animate-leave"
                    } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                  >
                    <div className="flex-1 w-0 p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {payload.new.type === "order_status" && (
                            <span className="text-2xl">📦</span>
                          )}
                          {payload.new.type === "stock_available" && (
                            <span className="text-2xl">✅</span>
                          )}
                          {payload.new.type === "price_drop" && (
                            <span className="text-2xl">💰</span>
                          )}
                          {payload.new.type === "cart_reminder" && (
                            <span className="text-2xl">🛒</span>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {payload.new.title}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {payload.new.message}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex border-l border-gray-200">
                      <button
                        onClick={() => toast.dismiss(t.id)}
                        className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        Kapat
                      </button>
                    </div>
                  </div>
                ),
                { duration: 5000 }
              );
            }

            // Invalidate queries to refresh notification list
            queryClient.invalidateQueries(["notifications"]);
            queryClient.invalidateQueries(["unread-notification-count"]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    staleTime: Infinity, // This subscription should persist
  });
}
