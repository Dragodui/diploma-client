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
import { CheckCircle2, Circle } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useHome } from "@/contexts/HomeContext";
import { taskApi, Assignment } from "@/lib/api";
import Colors from "@/constants/colors";

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { home } = useHome();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadAssignments = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await taskApi.getUserAssignments(user.id);
      setAssignments(response.data);
    } catch (error) {
      console.error("Error loading assignments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && home) {
      loadAssignments();
    }
  }, [user, home, loadAssignments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAssignments();
    setRefreshing(false);
  };

  const completeTask = async (assignmentId: string) => {
    try {
      await taskApi.completeAssignment(assignmentId);
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId ? { ...a, completed: true } : a
        )
      );
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.black} />
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
      <Text style={styles.title}>My Tasks</Text>

      {assignments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tasks assigned yet</Text>
        </View>
      ) : (
        <View style={styles.taskList}>
          {assignments.map((assignment) => (
            <TouchableOpacity
              key={assignment.id}
              style={[
                styles.taskCard,
                assignment.completed && styles.taskCardCompleted,
              ]}
              onPress={() => !assignment.completed && completeTask(assignment.id)}
              disabled={assignment.completed}
            >
              <View style={styles.taskContent}>
                {assignment.completed ? (
                  <CheckCircle2 size={28} color={Colors.black} />
                ) : (
                  <Circle size={28} color={Colors.gray400} />
                )}
                <View style={styles.taskText}>
                  <Text
                    style={[
                      styles.taskTitle,
                      assignment.completed && styles.taskTitleCompleted,
                    ]}
                  >
                    {assignment.task.title}
                  </Text>
                  {assignment.task.description ? (
                    <Text style={styles.taskDescription}>
                      {assignment.task.description}
                    </Text>
                  ) : null}
                  <Text style={styles.taskDue}>
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.black,
    marginBottom: 24,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray600,
  },
  taskList: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 20,
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  taskText: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.black,
    marginBottom: 6,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: Colors.gray600,
  },
  taskDescription: {
    fontSize: 14,
    color: Colors.gray600,
    marginBottom: 8,
  },
  taskDue: {
    fontSize: 12,
    color: Colors.gray400,
  },
});
