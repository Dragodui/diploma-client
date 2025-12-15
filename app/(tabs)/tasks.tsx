import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Plus, Calendar, Trash } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useHome } from "@/contexts/HomeContext";
import { useTheme } from "@/contexts/ThemeContext";
import { taskApi } from "@/lib/api";
import { Task, TaskAssignment } from "@/lib/types";
import fonts from "@/constants/fonts";
import Modal from "@/components/ui/modal";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { userColors } from "@/constants/colors";

type FilterType = "All" | "My" | "By Room";

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { home, rooms } = useHome();
  const { theme } = useTheme();

  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  // Load Data
  const loadTasks = useCallback(async () => {
    if (!home || !user) {
      setIsLoading(false);
      return;
    }

    try {
      const [tasksData, assignmentsData] = await Promise.all([
        taskApi.getByHomeId(home.id),
        taskApi.getUserAssignments(home.id, user.id).catch(() => []),
      ]);

      setTasks(tasksData || []);
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [home, user]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  // --- ACTIONS ---

  const handleDelete = (taskId: number) => {
    if (!home) return;
    console.log(home)

    Alert.alert(
      "Delete Task?",
      "This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await taskApi.delete(home.id, taskId);
              await loadTasks();
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Failed to delete task.");
            }
          },
        },
      ]
    );
  };

  const handleCompleteTask = async (taskId: number) => {
    if (!home) return;
    try {
      await taskApi.completeTask(home.id, taskId);
      await loadTasks();
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleCreateTask = async () => {
    if (!home || !newTaskName.trim()) return;

    setCreating(true);
    try {
      await taskApi.create(home.id, {
        name: newTaskName.trim(),
        description: newTaskDescription.trim(),
        schedule_type: "once",
        home_id: home.id,
        room_id: selectedRoomId || undefined,
      });

      // Reset form
      setNewTaskName("");
      setNewTaskDescription("");
      setSelectedRoomId(null);
      setShowCreateModal(false);
      await loadTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      Alert.alert("Error", "Could not create task.");
    } finally {
      setCreating(false);
    }
  };

  // --- HELPERS ---

  const getFilteredTasks = () => {
    if (activeFilter === "My") {
      const myTaskIds = assignments.map((a) => a.task_id);
      return tasks.filter((t) => myTaskIds.includes(t.id));
    }
    return tasks;
  };

  const isTaskCompleted = (task: Task) => {
    if (task.assignments && task.assignments.length > 0) {
      const userAssignment = task.assignments.find((a) => a.user_id === user?.id);
      if (userAssignment) return userAssignment.status === "completed";
      return task.assignments.some((a) => a.status === "completed");
    }
    const assignment = assignments.find((a) => a.task_id === task.id);
    return assignment?.status === "completed";
  };

  const getTaskAssignee = (task: Task) => {
    if (task.assignments && task.assignments.length > 0) {
      return task.assignments[0].user?.name || "Assigned";
    }
    return "Unassigned";
  };

  const getTaskDueText = (task: Task) => {
    const dueTexts = ["Today", "Tomorrow", "Thu", "Fri"];
    return dueTexts[Math.floor(Math.random() * dueTexts.length)];
  };

  const getMyTasksCount = () => {
    const myTaskIds = assignments.map((a) => a.task_id);
    return tasks.filter((t) => myTaskIds.includes(t.id)).length;
  };

  // --- RENDERERS ---

  const renderTaskItem = (task: Task, index: number) => {
    const completed = isTaskCompleted(task);
    const colorIndex = index % userColors.length;

    return (
      // 1. CHANGE: The outer container is now a VIEW (not clickable)
      <View
        key={task.id}
        style={[styles.taskCard, { backgroundColor: theme.surface }]}
      >
        <View style={styles.taskContent}>
          
          {/* 2. NEW: Wrap the Checkbox and Text in their own TouchableOpacity */}
          {/* This takes up the remaining space (flex: 1) so you can click anywhere on the text */}
          <TouchableOpacity 
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 }}
            onPress={() => handleCompleteTask(task.id)}
            activeOpacity={0.7}
          >
            {/* Checkbox */}
            <View
              style={[
                styles.checkbox,
                { borderColor: theme.textSecondary },
                completed && { backgroundColor: theme.accent.pink, borderColor: theme.accent.pink },
              ]}
            >
              {completed && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
            </View>

            {/* Info */}
            <View style={styles.taskInfo}>
              <Text
                style={[
                  styles.taskTitle,
                  { color: theme.text },
                  completed && styles.taskTitleCompleted,
                ]}
                numberOfLines={1}
              >
                {task.name}
              </Text>
              <View style={styles.taskMeta}>
                <View style={[styles.taskDot, { backgroundColor: userColors[colorIndex] }]} />
                <Text style={[styles.taskAssignee, { color: theme.textSecondary }]}>
                  {getTaskAssignee(task)}
                </Text>
                <Text style={[styles.taskSeparator, { color: theme.textSecondary }]}>•</Text>
                <View style={styles.taskDue}>
                  <Calendar size={12} color={theme.textSecondary} />
                  <Text style={[styles.taskDueText, { color: theme.textSecondary }]}>
                    {getTaskDueText(task)}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* 3. SEPARATE: The Delete button is now a sibling, not a child */}
          <TouchableOpacity 
            onPress={() => handleDelete(task.id)} 
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            style={styles.deleteButton}
            activeOpacity={0.6}
          >
            <Trash size={20} color={theme.accent.pink} />
          </TouchableOpacity>

        </View>
      </View>
    );
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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Tasks</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {getMyTasksCount()} assigned to you
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.accent.purple }]}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <Plus size={28} color="#1C1C1E" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(["All", "My", "By Room"] as FilterType[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                activeFilter === filter && styles.filterButtonActive,
              ]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: theme.textSecondary },
                  activeFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No tasks yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Tap the + button to create your first task
            </Text>
          </View>
        ) : (
          <View style={styles.taskList}>
            {getFilteredTasks().map((task, index) => renderTaskItem(task, index))}
          </View>
        )}
      </ScrollView>

      {/* Create Task Modal */}
      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New Task"
        height="full"
      >
        <View style={styles.modalContent}>
          <Input
            label="Task Name"
            placeholder="e.g., Clean Kitchen"
            value={newTaskName}
            onChangeText={setNewTaskName}
          />

          <Input
            label="Description (Optional)"
            placeholder="Add details..."
            value={newTaskDescription}
            onChangeText={setNewTaskDescription}
            multiline
            numberOfLines={3}
          />

          {rooms.length > 0 && (
            <View style={styles.roomPicker}>
              <Text style={[styles.pickerLabel, { color: theme.textSecondary }]}>Room (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.roomOptions}>
                  <TouchableOpacity
                    style={[
                      styles.roomOption,
                      { backgroundColor: theme.surface },
                      !selectedRoomId && { backgroundColor: theme.text },
                    ]}
                    onPress={() => setSelectedRoomId(null)}
                  >
                    <Text
                      style={[
                        styles.roomOptionText,
                        { color: theme.textSecondary },
                        !selectedRoomId && { color: theme.background },
                      ]}
                    >
                      None
                    </Text>
                  </TouchableOpacity>
                  {rooms.map((room) => (
                    <TouchableOpacity
                      key={room.id}
                      style={[
                        styles.roomOption,
                        { backgroundColor: theme.surface },
                        selectedRoomId === room.id && { backgroundColor: theme.text },
                      ]}
                      onPress={() => setSelectedRoomId(room.id)}
                    >
                      <Text
                        style={[
                          styles.roomOptionText,
                          { color: theme.textSecondary },
                          selectedRoomId === room.id && { color: theme.background },
                        ]}
                      >
                        {room.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <Button
            title="Create Task"
            onPress={handleCreateTask}
            loading={creating}
            disabled={!newTaskName.trim() || creating}
            variant="yellow"
            style={styles.createButton}
          />
        </View>
      </Modal>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontFamily: fonts[700],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts[400],
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  filterContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterButtonActive: {
    backgroundColor: "#1C1C1E",
    borderColor: "#1C1C1E",
  },
  filterText: {
    fontSize: 14,
    fontFamily: fonts[600],
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  taskList: {
    gap: 12,
  },
  taskCard: {
    borderRadius: 24,
    padding: 20,
  },
  taskContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontFamily: fonts[700],
    marginBottom: 8,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskAssignee: {
    fontSize: 12,
    fontFamily: fonts[600],
  },
  taskSeparator: {
    fontSize: 10,
  },
  taskDue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  taskDueText: {
    fontSize: 12,
    fontFamily: fonts[600],
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: fonts[700],
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fonts[400],
  },
  modalContent: {
    flex: 1,
  },
  roomPicker: {
    marginBottom: 24,
  },
  pickerLabel: {
    fontSize: 12,
    fontFamily: fonts[700],
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  roomOptions: {
    flexDirection: "row",
    gap: 10,
  },
  roomOption: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  roomOptionText: {
    fontSize: 14,
    fontFamily: fonts[600],
  },
  createButton: {
    marginTop: "auto",
  },
});