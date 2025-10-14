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
import PageHeader from "@/components/page-header";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { home, isLoading: homeLoading } = useHome();
  console.log(home)

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (home && user) {
        const [assignmentsRes, billsRes] = await Promise.all([
          taskApi.getUserAssignments(user.id).catch(() => ({ data: [] })),
          billApi.getHomeBills(home.id).catch(() => ({ data: [] })),
        ]);

        setAssignments(assignmentsRes.data.slice(0, 3));
        setBills(billsRes.data.filter((b: Bill) => !b.payed).slice(0, 3));

        try {
          const categoriesRes = await shoppingApi.getCategories(home.id);
          if (categoriesRes.data.length > 0) {
            const itemsRes = await shoppingApi.getCategoryItems(
              home.id,
              categoriesRes.data[0].id
            );
            setShoppingItems(
              itemsRes.data.filter((i: ShoppingItem) => !i.bought).slice(0, 3)
            );
          }
        } catch (error) {
          console.error("Error loading shopping items:", error);
        }
      } else {
        setAssignments([]);
        setBills([]);
        setShoppingItems([]);
      }
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

  const completeTask = async (assignmentId: string) => {
    try {
      await taskApi.completeAssignment(assignmentId);
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  if (authLoading || homeLoading || isLoading) {
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
    <View style={styles.container}>
      {/* PageHeader вне ScrollView */}
      <PageHeader
        description={home?.name || ""}
        title={`${getGreeting()}, ${user?.name || "there"}!`}
        // style={{ paddingTop: insets.top }}
      />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* My Tasks Section */}
        <Section
          title="My Tasks"
          items={assignments}
          emptyText="No tasks assigned"
          renderItem={(assignment: Assignment) => (
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
                  {assignment.task.description && (
                    <Text style={styles.cardSubtitle}>{assignment.task.description}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Upcoming Bills Section */}
        <Section
          title="Upcoming Bills"
          items={bills}
          emptyText="No upcoming bills"
          renderItem={(bill: Bill) => (
            <View key={bill.id} style={styles.card}>
              <View style={styles.cardContent}>
                <DollarSign size={24} color={Colors.black} />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{bill.title}</Text>
                  <Text style={styles.cardSubtitle}>
                    ${bill.amount.toFixed(2)} • Due {new Date(bill.due_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />

        {/* Shopping List Section */}
        <Section
          title="Shopping List"
          items={shoppingItems}
          emptyText="Shopping list is empty"
          renderItem={(item: ShoppingItem) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardContent}>
                <ShoppingBag size={24} color={Colors.black} />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  {item.quantity && <Text style={styles.cardSubtitle}>Qty: {item.quantity}</Text>}
                </View>
              </View>
            </View>
          )}
        />
      </ScrollView>
    </View>
  );
}

// Вспомогательный компонент для секций
const Section = ({ title, items, emptyText, renderItem }: any) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {items.length === 0 ? (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyCardText}>{emptyText}</Text>
      </View>
    ) : (
      items.map(renderItem)
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContainer: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.white },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, backgroundColor: Colors.white },
  emptyTitle: { fontSize: 24, fontWeight: "700", color: Colors.black, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 16, color: Colors.gray600, textAlign: "center", marginBottom: 24 },
  button: { paddingHorizontal: 32, paddingVertical: 16, backgroundColor: Colors.black, borderRadius: 16 },
  buttonText: { fontSize: 16, fontWeight: "600", color: Colors.white },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: Colors.black },
  card: { backgroundColor: Colors.gray50, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: Colors.black, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: Colors.gray600 },
  emptyCard: { backgroundColor: Colors.gray50, borderRadius: 16, padding: 24, alignItems: "center" },
  emptyCardText: { fontSize: 14, color: Colors.gray600 },
});
