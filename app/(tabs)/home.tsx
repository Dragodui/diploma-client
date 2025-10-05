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
import { useRouter } from "expo-router";
import { CheckCircle2, Circle, ShoppingBag, DollarSign, Home as HomeIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useHome } from "@/contexts/HomeContext";
import { taskApi, billApi, shoppingApi, Assignment, Bill, ShoppingItem } from "@/lib/api";
import Colors from "@/constants/colors";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();
  const { home, isLoading: homeLoading } = useHome();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadDashboardData = useCallback(async () => {
    if (!home || !user) return;

    try {
      setIsLoading(true);

      const [assignmentsRes, billsRes] = await Promise.all([
        taskApi.getUserAssignments(user.id).catch(() => ({ data: [] })),
        billApi.getHomeBills(home.id).catch(() => ({ data: [] })),
      ]);

      setAssignments(assignmentsRes.data.slice(0, 3));
      setBills(billsRes.data.filter((b: Bill) => !b.payed).slice(0, 3));

      if (home.id) {
        try {
          const categoriesRes = await shoppingApi.getCategories(home.id);
          if (categoriesRes.data.length > 0) {
            const itemsRes = await shoppingApi.getCategoryItems(
              home.id,
              categoriesRes.data[0].id
            );
            setShoppingItems(itemsRes.data.filter((i: ShoppingItem) => !i.bought).slice(0, 3));
          }
        } catch (error) {
          console.error("Error loading shopping items:", error);
        }
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, [home, user]);

  useEffect(() => {  
    if (homeLoading) return;
    if (isAuthenticated && home && user) {
      loadDashboardData();
    } else if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [homeLoading, isLoading, isAuthenticated, home, user, loadDashboardData, router]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const completeTask = async (assignmentId: string) => {
    try {
      await taskApi.completeAssignment(assignmentId);
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  if (homeLoading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.black} />
      </View>
    );
  }

  if (!home) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top + 20 }]}>
        <HomeIcon size={64} color={Colors.gray400} />
        <Text style={styles.emptyTitle}>No Home Yet</Text>
        <Text style={styles.emptyText}>
          Create or join a home to start managing tasks with your roommates
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/profile" as any)}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name || "there"}!</Text>
        <Text style={styles.homeName}>{home.name}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Tasks</Text>
          <TouchableOpacity onPress={() => router.push("/tasks" as any)}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {assignments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No tasks assigned</Text>
          </View>
        ) : (
          assignments.map((assignment) => (
            <TouchableOpacity
              key={assignment.id}
              style={styles.card}
              onPress={() => completeTask(assignment.id)}
            >
              <View style={styles.cardContent}>
                {assignment.completed ? (
                  <CheckCircle2 size={24} color={Colors.black} />
                ) : (
                  <Circle size={24} color={Colors.gray400} />
                )}
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{assignment.task.title}</Text>
                  {assignment.task.description ? (
                    <Text style={styles.cardSubtitle}>
                      {assignment.task.description}
                    </Text>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Bills</Text>
        </View>

        {bills.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No upcoming bills</Text>
          </View>
        ) : (
          bills.map((bill) => (
            <View key={bill.id} style={styles.card}>
              <View style={styles.cardContent}>
                <DollarSign size={24} color={Colors.black} />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{bill.title}</Text>
                  <Text style={styles.cardSubtitle}>
                    ${bill.amount.toFixed(2)} • Due{" "}
                    {new Date(bill.due_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shopping List</Text>
          <TouchableOpacity onPress={() => router.push("/shopping" as any)}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {shoppingItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>Shopping list is empty</Text>
          </View>
        ) : (
          shoppingItems.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardContent}>
                <ShoppingBag size={24} color={Colors.black} />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  {item.quantity ? (
                    <Text style={styles.cardSubtitle}>Qty: {item.quantity}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
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
    fontFamily: "Nunito"
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray600,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: Colors.black,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  header: {
    marginBottom: 32,
  },
  greeting: {
    fontSize: 16,
    color: Colors.gray600,
    marginBottom: 4,
  },
  homeName: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.black,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.black,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.gray600,
  },
  card: {
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.black,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.gray600,
  },
  emptyCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  emptyCardText: {
    fontSize: 14,
    color: Colors.gray600,
  },
});
