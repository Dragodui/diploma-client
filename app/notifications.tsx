import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, Check, Trash2 } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import { useHome } from "@/contexts/HomeContext";
import { notificationApi } from "@/lib/api";
import { Notification, HomeNotification } from "@/lib/types";
import fonts from "@/constants/fonts";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useI18n();
  const { home } = useHome();

  const [notifications, setNotifications] = useState<(Notification | HomeNotification)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      let allNotifications: (Notification | HomeNotification)[] = [];

      // Load user notifications
      const userNotifications = await notificationApi.getUserNotifications().catch(() => []);
      allNotifications = [...userNotifications];

      // Load home notifications if user is in a home
      if (home) {
        const homeNotifications = await notificationApi.getHomeNotifications(home.id).catch(() => []);
        allNotifications = [...allNotifications, ...homeNotifications];
      }

      // Sort by date (newest first)
      allNotifications.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(allNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [home]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notification: Notification | HomeNotification) => {
    try {
      if ('home_id' in notification) {
        // Home notification
        await notificationApi.markHomeNotificationAsRead(notification.home_id, notification.id);
      } else {
        // User notification
        await notificationApi.markAsRead(notification.id);
      }
      await loadNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t.notifications.justNow || "Just now";
    if (diffMins < 60) return `${diffMins} ${t.notifications.minutesAgo || "min ago"}`;
    if (diffHours < 24) return `${diffHours} ${t.notifications.hoursAgo || "h ago"}`;
    if (diffDays < 7) return `${diffDays} ${t.notifications.daysAgo || "d ago"}`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.surface }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>
            {t.profile.notifications}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.surface }]}>
              <Bell size={48} color={theme.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {t.notifications.noNotifications || "No notifications"}
            </Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {t.notifications.noNotificationsText || "You're all caught up!"}
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <View
                key={`${notification.id}-${'home_id' in notification ? 'home' : 'user'}`}
                style={[
                  styles.notificationItem,
                  { backgroundColor: theme.surface },
                  !notification.read && { borderLeftWidth: 3, borderLeftColor: theme.accent.purple },
                ]}
              >
                <View style={styles.notificationContent}>
                  <View style={[styles.notificationIcon, { backgroundColor: theme.accent.purple }]}>
                    <Bell size={18} color="#1C1C1E" />
                  </View>
                  <View style={styles.notificationText}>
                    <Text style={[styles.notificationMessage, { color: theme.text }]}>
                      {notification.description}
                    </Text>
                    <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
                      {formatDate(notification.created_at)}
                    </Text>
                  </View>
                </View>
                {!notification.read && (
                  <TouchableOpacity
                    style={[styles.markReadButton, { backgroundColor: theme.background }]}
                    onPress={() => markAsRead(notification)}
                  >
                    <Check size={18} color={theme.accent.purple} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontFamily: fonts[700],
    textAlign: "center",
  },
  placeholder: {
    width: 48,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: fonts[700],
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: fonts[400],
  },
  notificationsList: {
    gap: 12,
  },
  notificationItem: {
    padding: 16,
    borderRadius: 16,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationText: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 15,
    fontFamily: fonts[500],
    lineHeight: 22,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 13,
    fontFamily: fonts[400],
  },
  markReadButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});
