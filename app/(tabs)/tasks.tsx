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
import { Check, Plus, Calendar, MapPin } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useHome } from "@/contexts/HomeContext";
import { taskApi } from "@/lib/api";
import { Task, TaskAssignment } from "@/lib/types";
import Colors from "@/constants/colors";
import fonts from "@/constants/fonts";
import Modal from "@/components/ui/modal";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

type FilterType = "All" | "My Tasks" | "By Room";

const TASK_COLORS = [
  Colors.accentYellow,
  Colors.accentPurple,
  Colors.accentPink,
  Colors.white,
];

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { home, rooms } = useHome();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create task modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

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

  const handleCompleteTask = async (taskId: number) => {
    if (!home) return;

    try {
      await taskApi.markCompleted(home.id, taskId);
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

      setNewTaskName("");
      setNewTaskDescription("");
      setSelectedRoomId(null);
      setShowCreateModal(false);
      await loadTasks();
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setCreating(false);
    }
  };

  const getFilteredTasks = () => {
    if (activeFilter === "My Tasks") {
      const myTaskIds = assignments.map((a) => a.task_id);
      return tasks.filter((t) => myTaskIds.includes(t.id));
    }
    return tasks;
  };

  const getTasksByRoom = () => {
    const grouped: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      const roomName = task.room?.name || "Unassigned";
      if (!grouped[roomName]) grouped[roomName] = [];
      grouped[roomName].push(task);
    });
    return grouped;
  };

  const isTaskCompleted = (taskId: number) => {
    const assignment = assignments.find((a) => a.task_id === taskId);
    return assignment?.status === "completed";
  };

  const getTaskAssignee = (task: Task) => {
    if (task.assignments && task.assignments.length > 0) {
      return task.assignments[0].user?.name || "Assigned";
    }
    return "Unassigned";
  };

  const renderTaskItem = (task: Task, index: number) => {
    const completed = isTaskCompleted(task.id);
    const colorIndex = index % TASK_COLORS.length;

    return (
      <TouchableOpacity
        key={task.id}
        style={[styles.taskCard, completed && styles.taskCardCompleted]}
        onPress={() => handleCompleteTask(task.id)}
        activeOpacity={0.95}
      >
        <View style={styles.taskContent}>
          <TouchableOpacity
            style={[styles.checkbox, completed && styles.checkboxCompleted]}
            onPress={() => handleCompleteTask(task.id)}
          >
            {completed && <Check size={16} color={Colors.black} strokeWidth={4} />}
          </TouchableOpacity>
          <View style={styles.taskInfo}>
            <Text style={[styles.taskTitle, completed && styles.taskTitleCompleted]}>
              {task.name}
            </Text>
            <View style={styles.taskMeta}>
              <View style={[styles.taskDot, { backgroundColor: TASK_COLORS[colorIndex] }]} />
              <Text style={styles.taskAssignee}>{getTaskAssignee(task)}</Text>
              <Text style={styles.taskSeparator}>•</Text>
              <View style={styles.taskDue}>
                <Calendar size={12} color={Colors.gray400} />
                <Text style={styles.taskDueText}>Today</Text>
              </View>
              {activeFilter !== "By Room" && task.room && (
                <>
                  <Text style={styles.taskSeparator}>•</Text>
                  <Text style={styles.taskRoom}>{task.room.name}</Text>
                </>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (activeFilter === "By Room") {
      const grouped = getTasksByRoom();
      return Object.entries(grouped).map(([room, roomTasks]) => (
        <View key={room} style={styles.roomGroup}>
          <View style={styles.roomHeader}>
            <MapPin size={14} color={Colors.accentPurple} />
            <Text style={styles.roomTitle}>{room}</Text>
          </View>
          {roomTasks.map((task, index) => renderTaskItem(task, index))}
        </View>
      ));
    }

    const filteredTasks = getFilteredTasks();
    return (
      <View style={styles.taskList}>
        {filteredTasks.map((task, index) => renderTaskItem(task, index))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.black} />
      </View>
    );
  }

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
          <View>
            <Text style={styles.title}>Tasks</Text>
            <Text style={styles.subtitle}>
              {activeFilter === "My Tasks" ? "Assigned to you" : "Household chores"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <Plus size={28} color={Colors.black} strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {(["All", "My Tasks", "By Room"] as FilterType[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, activeFilter === filter && styles.filterButtonActive]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tasks */}
        {tasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to create your first task</Text>
          </View>
        ) : (
          renderContent()
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
            dark
          />

          <Input
            label="Description (Optional)"
            placeholder="Add details..."
            value={newTaskDescription}
            onChangeText={setNewTaskDescription}
            multiline
            numberOfLines={3}
            dark
          />

          {rooms.length > 0 && (
            <View style={styles.roomPicker}>
              <Text style={styles.pickerLabel}>Room (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.roomOptions}>
                  <TouchableOpacity
                    style={[styles.roomOption, !selectedRoomId && styles.roomOptionActive]}
                    onPress={() => setSelectedRoomId(null)}
                  >
                    <Text
                      style={[styles.roomOptionText, !selectedRoomId && styles.roomOptionTextActive]}
                    >
                      None
                    </Text>
                  </TouchableOpacity>
                  {rooms.map((room) => (
                    <TouchableOpacity
                      key={room.id}
                      style={[
                        styles.roomOption,
                        selectedRoomId === room.id && styles.roomOptionActive,
                      ]}
                      onPress={() => setSelectedRoomId(room.id)}
                    >
                      <Text
                        style={[
                          styles.roomOptionText,
                          selectedRoomId === room.id && styles.roomOptionTextActive,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontFamily: fonts[700],
    color: Colors.black,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: fonts[400],
    color: Colors.gray400,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.accentPurple,
    justifyContent: "center",
    alignItems: "center",
  },
  filterContainer: {
    marginBottom: 24,
    marginHorizontal: -24,
  },
  filterContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.gray50,
  },
  filterButtonActive: {
    backgroundColor: Colors.black,
  },
  filterText: {
    fontSize: 14,
    fontFamily: fonts[700],
    color: Colors.gray400,
  },
  filterTextActive: {
    color: Colors.white,
  },
  taskList: {
    gap: 16,
  },
  roomGroup: {
    marginBottom: 24,
  },
  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    marginLeft: 8,
  },
  roomTitle: {
    fontSize: 12,
    fontFamily: fonts[700],
    color: Colors.accentPurple,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  taskCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
  },
  taskCardCompleted: {
    opacity: 0.5,
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
    borderColor: Colors.gray400,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxCompleted: {
    backgroundColor: Colors.accentYellow,
    borderColor: Colors.accentYellow,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontFamily: fonts[700],
    color: Colors.black,
    marginBottom: 8,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: Colors.gray500,
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
    fontFamily: fonts[700],
    color: Colors.gray400,
    textTransform: "uppercase",
  },
  taskSeparator: {
    color: Colors.gray400,
    fontSize: 10,
  },
  taskDue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  taskDueText: {
    fontSize: 12,
    fontFamily: fonts[700],
    color: Colors.gray400,
  },
  taskRoom: {
    fontSize: 12,
    fontFamily: fonts[700],
    color: Colors.gray400,
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
    color: Colors.gray400,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fonts[400],
    color: Colors.gray400,
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
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  roomOptions: {
    flexDirection: "row",
    gap: 12,
  },
  roomOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primaryDark,
    borderWidth: 2,
    borderColor: "transparent",
  },
  roomOptionActive: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  roomOptionText: {
    fontSize: 14,
    fontFamily: fonts[600],
    color: Colors.gray400,
  },
  roomOptionTextActive: {
    color: Colors.black,
  },
  createButton: {
    marginTop: "auto",
  },
});
