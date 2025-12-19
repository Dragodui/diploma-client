import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Home, Trash2, DoorOpen } from "lucide-react-native";
import { useHome } from "@/contexts/HomeContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n, interpolate } from "@/contexts/I18nContext";
import fonts from "@/constants/fonts";
import Modal from "@/components/ui/modal";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function RoomsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { home, rooms, isAdmin, createRoom, deleteRoom } = useHome();
  const { theme } = useTheme();
  const { t } = useI18n();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;

    setIsLoading(true);
    const result = await createRoom(roomName.trim());
    setIsLoading(false);

    if (result.success) {
      setShowCreateModal(false);
      setRoomName("");
    } else {
      Alert.alert(t.common.error, result.error || t.rooms.failedToCreate);
    }
  };

  const handleDeleteRoom = (roomId: number, roomName: string) => {
    Alert.alert(t.rooms.deleteRoom, interpolate(t.rooms.deleteRoomConfirm, { name: roomName }), [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        style: "destructive",
        onPress: async () => {
          const result = await deleteRoom(roomId);
          if (!result.success) {
            Alert.alert(t.common.error, result.error || t.rooms.failedToDelete);
          }
        },
      },
    ]);
  };

  if (!home) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.surface }]}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>{t.rooms.title}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t.rooms.joinHomeToManage}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.surface }]}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>{t.rooms.title}</Text>
          {isAdmin ? (
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={[styles.addButton, { backgroundColor: theme.accent.yellow }]}
            >
              <Plus size={24} color="#1C1C1E" />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        {/* Rooms Grid */}
        {rooms.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.surface }]}>
              <DoorOpen size={48} color={theme.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t.rooms.noRooms}</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              {isAdmin
                ? t.rooms.noRoomsAdminHint
                : t.rooms.noRoomsMemberHint}
            </Text>
          </View>
        ) : (
          <View style={styles.roomsGrid}>
            {rooms.map((room, index) => {
              // Use theme colors for room cards if needed, or keep colorful cards but ensure text contrast
              // For now keeping colorful cards as per design, but ensuring text is readable
              const ROOM_COLORS = [
                theme.accent.yellow,
                theme.accent.purple,
                theme.accent.pink,
                theme.surface,
                theme.border,
              ];
              const colorIndex = index % ROOM_COLORS.length;
              const backgroundColor = ROOM_COLORS[colorIndex];
              const isDarkBg = backgroundColor === theme.surface && theme.background === "#000000"; // Simple check
              const textColor = "#1C1C1E"; // Most accent colors are light, so dark text is fine. Surface might need check.

              // If surface is dark (dark mode), we need light text for that card
              const finalTextColor = (backgroundColor === theme.surface || backgroundColor === theme.border) ? theme.text : "#1C1C1E";

              return (
                <View
                  key={room.id}
                  style={[styles.roomCard, { backgroundColor }]}
                >
                  <View style={styles.roomIcon}>
                    <Home size={28} color={finalTextColor} />
                  </View>
                  <Text style={[styles.roomName, { color: finalTextColor }]}>{room.name}</Text>
                  <Text style={[styles.roomDate, { color: finalTextColor, opacity: 0.6 }]}>
                    {interpolate(t.rooms.added, { date: new Date(room.created_at).toLocaleDateString() })}
                  </Text>
                  {isAdmin && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteRoom(room.id, room.name)}
                    >
                      <Trash2 size={18} color={theme.accent.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Create Room Modal */}
      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t.rooms.newRoom}
        height="full"
      >
        <View style={styles.modalContent}>
          <Input
            label={t.rooms.roomName}
            placeholder={t.rooms.roomNamePlaceholder}
            value={roomName}
            onChangeText={setRoomName}
          />
          <Button
            title={t.rooms.createRoom}
            onPress={handleCreateRoom}
            loading={isLoading}
            disabled={!roomName.trim() || isLoading}
            variant="yellow"
            style={styles.modalButton}
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
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontSize: 24,
    fontFamily: fonts[700],
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    width: 48,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fonts[400],
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
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
    fontSize: 22,
    fontFamily: fonts[700],
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fonts[400],
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  roomsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  roomCard: {
    width: "47%",
    borderRadius: 28,
    padding: 24,
    minHeight: 160,
    position: "relative",
  },
  roomIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  roomName: {
    fontSize: 18,
    fontFamily: fonts[700],
    marginBottom: 4,
  },
  roomDate: {
    fontSize: 12,
    fontFamily: fonts[400],
  },
  deleteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
  },
  modalButton: {
    marginTop: "auto",
  },
});
