import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Zap, ArrowRight, Home as HomeIcon, BarChart2, User } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useHome } from "@/contexts/HomeContext";
import { useTheme } from "@/contexts/ThemeContext";
import { taskApi, pollApi, billApi } from "@/lib/api";
import { TaskAssignment, Poll } from "@/lib/types";
import fonts from "@/constants/fonts";
import Card from "@/components/ui/card";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { home, rooms, isLoading: homeLoading } = useHome();
  const { theme } = useTheme();

  const [nextAssignment, setNextAssignment] = useState<TaskAssignment | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [monthlySpend, setMonthlySpend] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning,";
    if (hour < 18) return "Good Afternoon,";
    return "Good Evening,";
  };

  const loadDashboardData = useCallback(async () => {
    if (!home || !user) {
      setIsLoading(false);
      return;
    }

    try {
      const [assignmentData, pollsData, billsData] = await Promise.all([
        taskApi.getClosestAssignment(home.id, user.id).catch(() => null),
        pollApi.getByHomeId(home.id).catch(() => []),
        billApi.getByHomeId(home.id).catch(() => []),
      ]);

      setNextAssignment(assignmentData);
      setPolls(pollsData.filter((p) => p.status === "open") || []);

      // Calculate monthly spend
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const total = (billsData || []).reduce((sum, bill) => {
        const billDate = new Date(bill.created_at);
        if (billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear) {
          return sum + bill.total_amount;
        }
        return sum;
      }, 0);
      setMonthlySpend(total);

    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, [home, user]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    loadDashboardData();
  }, [authLoading, isAuthenticated, home, user, loadDashboardData, router]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (authLoading || homeLoading || isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  // No home state
  if (!home) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.background, paddingTop: insets.top + 40 }]}>
        <View style={[styles.emptyIconContainer, { backgroundColor: theme.accent.yellow }]}>
          <HomeIcon size={48} color="#1C1C1E" />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No Home Yet</Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Create or join a home to start managing tasks with your roommates
        </Text>
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: theme.text }]}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.8}
        >
          <Text style={[styles.emptyButtonText, { color: theme.background }]}>Get Started</Text>
        </TouchableOpacity>
      </View>
    );
  }
  console.log(nextAssignment)

  const formatTaskTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${timeStr}`;
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${timeStr}`;
    }
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.text}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header - matches PDF exactly */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>{getGreeting()}</Text>
            <Text style={[styles.userName, { color: theme.text }]}>{user?.name?.split(" ")[0] || "there"}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.8}>
            <View style={[styles.avatarContainer, { borderColor: theme.accent.purple }]}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.surface }]}>
                  <User size={28} color={theme.textSecondary} />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Hero Card - Up Next Task (Yellow card from PDF) */}
        <Card
          variant="yellow"
          borderRadius={32}
          padding={28}
          onPress={() => router.push("/(tabs)/tasks")}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <Text style={styles.heroLabel}>UP NEXT</Text>
            <View style={styles.zapContainer}>
              <Zap size={24} color="#1C1C1E" fill="#1C1C1E" />
            </View>
          </View>
          {nextAssignment ? (
            <>
              <Text style={styles.heroTitle}>{nextAssignment.task?.name || " Current Task"}</Text>
              <View style={styles.heroFooter}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>
                    {formatTaskTime(nextAssignment.assigned_date)}
                  </Text>
                </View>
                <ArrowRight size={24} color="#1C1C1E" />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.heroTitle}>All caught up!</Text>
              <View style={styles.heroFooter}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>No pending tasks</Text>
                </View>
                <ArrowRight size={24} color="#1C1C1E" />
              </View>
            </>
          )}
        </Card>

        {/* Grid Cards - My Rooms (dark) and Active Polls (purple) */}
        <View style={styles.grid}>
          {/* Rooms Card - Dark */}
          <Card
            variant="surface"
            borderRadius={28}
            padding={20}
            onPress={() => router.push("/rooms")}
            style={styles.gridCard}
          >
            <View style={[styles.gridIconContainer, { borderColor: theme.borderLight }]}>
              <HomeIcon size={22} color={theme.text} />
            </View>
            <View style={styles.gridContent}>
              <Text style={[styles.gridTitle, { color: theme.text }]}>My{"\n"}Rooms</Text>
              <Text style={[styles.gridSubtitle, { color: theme.textSecondary }]}>{rooms.length} spaces</Text>
            </View>
          </Card>

          {/* Polls Card - Purple */}
          <Card
            variant="purple"
            borderRadius={28}
            padding={20}
            onPress={() => router.push("/polls")}
            style={styles.gridCard}
          >
            <View style={styles.gridIconContainerDark}>
              <BarChart2 size={22} color="#1C1C1E" />
            </View>
            <View style={styles.gridContent}>
              <Text style={styles.gridTitleDark}>Active{"\n"}Polls</Text>
              <Text style={styles.gridSubtitleDark}>{polls.length} Pending</Text>
            </View>
          </Card>
        </View>

        {/* Budget Card - White card with Monthly Spend */}
        <Card
          variant="white"
          borderRadius={32}
          padding={28}
          onPress={() => router.push("/(tabs)/budget")}
          style={styles.budgetCard}
        >
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetLabel}>MONTHLY SPEND</Text>
            {/* <View style={styles.budgetBadge}>
              <Text style={styles.budgetBadgeText}>+12%</Text>
            </View> */}
          </View>
          <Text style={styles.budgetAmount}>${monthlySpend.toFixed(0)}</Text>
          <View style={styles.budgetFooter}>
            <View style={styles.budgetProgress}>
              <Text style={styles.budgetProgressText}>Total expenses this month</Text>
            </View>
            <ArrowRight size={24} color="#1C1C1E" />
          </View>
        </Card>
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
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 28,
    fontFamily: fonts[700],
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fonts[400],
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 20,
  },
  emptyButtonText: {
    fontSize: 16,
    fontFamily: fonts[700],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontFamily: fonts[400],
    fontStyle: "italic",
    marginBottom: 4,
  },
  userName: {
    fontSize: 36,
    fontFamily: fonts[700],
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  heroCard: {
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 12,
    fontFamily: fonts[700],
    color: "rgba(0, 0, 0, 0.4)",
    letterSpacing: 1.5,
  },
  zapContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: fonts[800],
    color: "#1C1C1E",
    lineHeight: 34,
    marginBottom: 24,
  },
  heroFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  heroBadgeText: {
    fontSize: 14,
    fontFamily: fonts[600],
    color: "#1C1C1E",
  },
  grid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  gridCard: {
    flex: 1,
    height: 180,
    justifyContent: "space-between",
  },
  gridIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  gridIconContainerDark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  gridContent: {
    flex: 1,
    justifyContent: "flex-end",
  },
  gridTitle: {
    fontSize: 22,
    fontFamily: fonts[700],
    lineHeight: 26,
  },
  gridTitleDark: {
    fontSize: 22,
    fontFamily: fonts[700],
    color: "#1C1C1E",
    lineHeight: 26,
  },
  gridSubtitle: {
    fontSize: 14,
    fontFamily: fonts[400],
    marginTop: 4,
  },
  gridSubtitleDark: {
    fontSize: 14,
    fontFamily: fonts[400],
    color: "rgba(0, 0, 0, 0.5)",
    marginTop: 4,
  },
  budgetCard: {
    marginBottom: 24,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 12,
    fontFamily: fonts[600],
    color: "#8E8E93",
    letterSpacing: 1.5,
  },
  budgetBadge: {
    backgroundColor: "rgba(255, 116, 118, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  budgetBadgeText: {
    fontSize: 13,
    fontFamily: fonts[700],
    color: "#FF7476",
  },
  budgetAmount: {
    fontSize: 48,
    fontFamily: fonts[800],
    color: "#1C1C1E",
    marginBottom: 20,
  },
  budgetFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetProgress: {
    backgroundColor: "rgba(255, 116, 118, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  budgetProgressText: {
    fontSize: 13,
    fontFamily: fonts[700],
    color: "#FF7476",
  },
});
