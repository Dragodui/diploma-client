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
import { Zap, ArrowRight, Home as HomeIcon, BarChart2, Plus } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useHome } from "@/contexts/HomeContext";
import { taskApi, pollApi } from "@/lib/api";
import { TaskAssignment, Poll } from "@/lib/types";
import Colors from "@/constants/colors";
import fonts from "@/constants/fonts";
import Card from "@/components/ui/card";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { home, rooms, isLoading: homeLoading } = useHome();

  const [nextAssignment, setNextAssignment] = useState<TaskAssignment | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
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
      const [assignmentData, pollsData] = await Promise.all([
        taskApi.getClosestAssignment(home.id, user.id).catch(() => null),
        pollApi.getByHomeId(home.id).catch(() => []),
      ]);

      setNextAssignment(assignmentData);
      setPolls(pollsData.filter((p) => p.status === "open") || []);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.black} />
      </View>
    );
  }

  // No home state
  if (!home) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top + 40 }]}>
        <View style={styles.emptyIconContainer}>
          <HomeIcon size={48} color={Colors.black} />
        </View>
        <Text style={styles.emptyTitle}>No Home Yet</Text>
        <Text style={styles.emptyText}>
          Create or join a home to start managing tasks with your roommates
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.name || "there"}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.8}>
            <View style={styles.avatarContainer}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{user?.name?.charAt(0) || "U"}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Hero Card - Next Task */}
        <Card
          variant="yellow"
          borderRadius={40}
          padding={32}
          onPress={() => router.push("/(tabs)/tasks")}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <Text style={styles.heroLabel}>UP NEXT</Text>
            <Zap size={32} color={Colors.black} fill={Colors.black} />
          </View>
          {nextAssignment ? (
            <>
              <Text style={styles.heroTitle}>{nextAssignment.task?.name || "Task"}</Text>
              <View style={styles.heroFooter}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>
                    {formatTaskTime(nextAssignment.assigned_date)}
                  </Text>
                </View>
                <ArrowRight size={28} color={Colors.black} />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.heroTitle}>All caught up!</Text>
              <View style={styles.heroFooter}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>No pending tasks</Text>
                </View>
                <ArrowRight size={28} color={Colors.black} />
              </View>
            </>
          )}
        </Card>

        {/* Grid Cards */}
        <View style={styles.grid}>
          {/* Rooms Card */}
          <Card
            variant="dark"
            borderRadius={32}
            padding={24}
            onPress={() => router.push("/rooms")}
            style={styles.gridCard}
          >
            <View style={styles.gridIconContainer}>
              <HomeIcon size={24} color={Colors.white} />
            </View>
            <View style={styles.gridContent}>
              <Text style={styles.gridTitle}>My{"\n"}Rooms</Text>
              <Text style={styles.gridSubtitle}>{rooms.length} spaces</Text>
            </View>
          </Card>

          {/* Polls Card */}
          <Card
            variant="purple"
            borderRadius={32}
            padding={24}
            onPress={() => router.push("/polls")}
            style={styles.gridCard}
          >
            <View style={styles.gridIconContainerDark}>
              <BarChart2 size={24} color={Colors.black} />
            </View>
            <View style={styles.gridContent}>
              <Text style={styles.gridTitleDark}>Active{"\n"}Polls</Text>
              <Text style={styles.gridSubtitleDark}>{polls.length} Pending</Text>
            </View>
          </Card>
        </View>

        {/* Budget Card */}
        <Card
          variant="white"
          borderRadius={40}
          padding={32}
          onPress={() => router.push("/(tabs)/budget")}
          style={styles.budgetCard}
        >
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetLabel}>MONTHLY SPEND</Text>
            <View style={styles.budgetBadge}>
              <Text style={styles.budgetBadgeText}>+12%</Text>
            </View>
          </View>
          <Text style={styles.budgetAmount}>$3,232</Text>
          <View style={styles.budgetFooter}>
            <View style={styles.budgetProgress}>
              <Text style={styles.budgetProgressText}>70% of budget used</Text>
            </View>
            <ArrowRight size={24} color={Colors.black} />
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "70%" }]} />
          </View>
        </Card>

        {/* Quick Add Button */}
        <TouchableOpacity
          style={styles.quickAddButton}
          onPress={() => router.push("/(tabs)/tasks")}
          activeOpacity={0.8}
        >
          <Plus size={24} color={Colors.white} />
          <Text style={styles.quickAddText}>Add Task</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: Colors.white,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.accentYellow,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 28,
    fontFamily: fonts[700],
    color: Colors.black,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fonts[400],
    color: Colors.gray500,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    backgroundColor: Colors.black,
    borderRadius: 20,
  },
  emptyButtonText: {
    fontSize: 16,
    fontFamily: fonts[700],
    color: Colors.white,
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
    color: Colors.gray400,
    marginBottom: 4,
  },
  userName: {
    fontSize: 36,
    fontFamily: fonts[700],
    color: Colors.black,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.gray200,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontFamily: fonts[700],
    color: Colors.black,
  },
  heroCard: {
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  heroLabel: {
    fontSize: 12,
    fontFamily: fonts[700],
    color: "rgba(0,0,0,0.5)",
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: fonts[800],
    color: Colors.black,
    lineHeight: 36,
    marginBottom: 32,
  },
  heroFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroBadge: {
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  heroBadgeText: {
    fontSize: 14,
    fontFamily: fonts[700],
    color: Colors.black,
  },
  grid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  gridCard: {
    flex: 1,
    height: 180,
    justifyContent: "space-between",
  },
  gridIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  gridIconContainerDark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.1)",
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
    color: Colors.white,
    lineHeight: 28,
  },
  gridTitleDark: {
    fontSize: 22,
    fontFamily: fonts[700],
    color: Colors.black,
    lineHeight: 28,
  },
  gridSubtitle: {
    fontSize: 14,
    fontFamily: fonts[400],
    color: Colors.gray400,
    marginTop: 4,
  },
  gridSubtitleDark: {
    fontSize: 14,
    fontFamily: fonts[400],
    color: "rgba(0,0,0,0.5)",
    marginTop: 4,
  },
  budgetCard: {
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 12,
    fontFamily: fonts[700],
    color: Colors.gray400,
    letterSpacing: 2,
  },
  budgetBadge: {
    backgroundColor: "rgba(255, 116, 118, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  budgetBadgeText: {
    fontSize: 12,
    fontFamily: fonts[700],
    color: Colors.accentPink,
  },
  budgetAmount: {
    fontSize: 48,
    fontFamily: fonts[800],
    color: Colors.black,
    marginBottom: 24,
  },
  budgetFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  budgetProgress: {
    backgroundColor: "rgba(255, 116, 118, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  budgetProgressText: {
    fontSize: 12,
    fontFamily: fonts[700],
    color: Colors.accentPink,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray100,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.black,
    borderRadius: 4,
  },
  quickAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.black,
    paddingVertical: 16,
    borderRadius: 20,
  },
  quickAddText: {
    fontSize: 16,
    fontFamily: fonts[700],
    color: Colors.white,
  },
});
