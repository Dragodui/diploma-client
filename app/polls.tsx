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
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Plus,
  BarChart2,
  Check,
  Clock,
  Users,
  X,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useHome } from "@/contexts/HomeContext";
import { pollApi } from "@/lib/api";
import { Poll, PollOption } from "@/lib/types";
import Colors from "@/constants/colors";
import fonts from "@/constants/fonts";
import Modal from "@/components/ui/modal";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

type FilterType = "active" | "closed";

export default function PollsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { home, isAdmin } = useHome();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("active");

  // Create poll modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [creating, setCreating] = useState(false);

  const loadPolls = useCallback(async () => {
    if (!home) {
      setIsLoading(false);
      return;
    }

    try {
      const pollsData = await pollApi.getByHomeId(home.id);
      setPolls(pollsData || []);
    } catch (error) {
      console.error("Error loading polls:", error);
    } finally {
      setIsLoading(false);
    }
  }, [home]);

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPolls();
    setRefreshing(false);
  };

  const handleCreatePoll = async () => {
    if (!home || !pollQuestion.trim()) return;

    const validOptions = pollOptions.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      Alert.alert("Error", "Please add at least 2 options");
      return;
    }

    setCreating(true);
    try {
      await pollApi.create(home.id, {
        question: pollQuestion.trim(),
        options: validOptions.map((opt) => opt.trim()),
      });

      setPollQuestion("");
      setPollOptions(["", ""]);
      setShowCreateModal(false);
      await loadPolls();
    } catch (error) {
      console.error("Error creating poll:", error);
      Alert.alert("Error", "Failed to create poll");
    } finally {
      setCreating(false);
    }
  };

  const handleVote = async (pollId: number, optionId: number) => {
    if (!home) return;

    try {
      await pollApi.vote(home.id, pollId, optionId);
      await loadPolls();
    } catch (error) {
      console.error("Error voting:", error);
      Alert.alert("Error", "Failed to submit vote");
    }
  };

  const handleClosePoll = (pollId: number) => {
    if (!home) return;

    Alert.alert("Close Poll", "Are you sure you want to close this poll?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Close",
        onPress: async () => {
          try {
            await pollApi.close(home.id, pollId);
            await loadPolls();
          } catch (error) {
            console.error("Error closing poll:", error);
            Alert.alert("Error", "Failed to close poll");
          }
        },
      },
    ]);
  };

  const addOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const removeOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = pollOptions.filter((_, i) => i !== index);
      setPollOptions(newOptions);
    }
  };

  const getFilteredPolls = () => {
    return polls.filter((poll) =>
      activeFilter === "active" ? poll.status === "open" : poll.status === "closed"
    );
  };

  const hasUserVoted = (poll: Poll) => {
    if (!user || !poll.options) return false;
    return poll.options.some((opt) => opt.votes?.some((v) => v.user_id === user.id));
  };

  const getUserVote = (poll: Poll): number | null => {
    if (!user || !poll.options) return null;
    for (const opt of poll.options) {
      if (opt.votes?.some((v) => v.user_id === user.id)) {
        return opt.id;
      }
    }
    return null;
  };

  const getTotalVotes = (poll: Poll) => {
    if (!poll.options) return 0;
    return poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
  };

  const getVotePercentage = (option: PollOption, poll: Poll) => {
    const total = getTotalVotes(poll);
    if (total === 0) return 0;
    return Math.round(((option.votes?.length || 0) / total) * 100);
  };

  const isPollCreator = (poll: Poll) => {
    return poll.creator_id === user?.id;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.black} />
      </View>
    );
  }

  if (!home) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.title}>Polls</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Join a home to participate in polls</Text>
        </View>
      </View>
    );
  }

  const filteredPolls = getFilteredPolls();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.title}>Polls</Text>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={styles.addButton}
          >
            <Plus size={24} color={Colors.black} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === "active" && styles.filterButtonActive]}
            onPress={() => setActiveFilter("active")}
          >
            <Text
              style={[styles.filterText, activeFilter === "active" && styles.filterTextActive]}
            >
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === "closed" && styles.filterButtonActive]}
            onPress={() => setActiveFilter("closed")}
          >
            <Text
              style={[styles.filterText, activeFilter === "closed" && styles.filterTextActive]}
            >
              Closed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Polls List */}
        {filteredPolls.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <BarChart2 size={48} color={Colors.gray400} />
            </View>
            <Text style={styles.emptyTitle}>
              No {activeFilter === "active" ? "Active" : "Closed"} Polls
            </Text>
            <Text style={styles.emptySubtext}>
              {activeFilter === "active"
                ? "Create a poll to get feedback from your roommates"
                : "Closed polls will appear here"}
            </Text>
          </View>
        ) : (
          <View style={styles.pollsList}>
            {filteredPolls.map((poll) => {
              const voted = hasUserVoted(poll);
              const userVote = getUserVote(poll);
              const totalVotes = getTotalVotes(poll);
              const isClosed = poll.status === "closed";
              const canClose = (isPollCreator(poll) || isAdmin) && !isClosed;

              return (
                <View key={poll.id} style={styles.pollCard}>
                  <View style={styles.pollHeader}>
                    <Text style={styles.pollQuestion}>{poll.question}</Text>
                    {canClose && (
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => handleClosePoll(poll.id)}
                      >
                        <X size={18} color={Colors.gray500} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.pollMeta}>
                    <View style={styles.pollMetaItem}>
                      <Users size={14} color={Colors.gray400} />
                      <Text style={styles.pollMetaText}>{totalVotes} votes</Text>
                    </View>
                    <View style={styles.pollMetaItem}>
                      <Clock size={14} color={Colors.gray400} />
                      <Text style={styles.pollMetaText}>
                        {isClosed ? "Closed" : "Open"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.optionsList}>
                    {poll.options?.map((option) => {
                      const percentage = getVotePercentage(option, poll);
                      const isSelected = userVote === option.id;
                      const showResults = voted || isClosed;

                      return (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.optionButton,
                            showResults && styles.optionButtonVoted,
                            isSelected && styles.optionButtonSelected,
                          ]}
                          onPress={() => !voted && !isClosed && handleVote(poll.id, option.id)}
                          disabled={voted || isClosed}
                          activeOpacity={voted || isClosed ? 1 : 0.8}
                        >
                          {showResults && (
                            <View
                              style={[styles.optionProgress, { width: `${percentage}%` }]}
                            />
                          )}
                          <View style={styles.optionContent}>
                            <Text
                              style={[
                                styles.optionText,
                                isSelected && styles.optionTextSelected,
                              ]}
                            >
                              {option.option_text}
                            </Text>
                            {showResults && (
                              <View style={styles.optionResult}>
                                {isSelected && (
                                  <Check size={16} color={Colors.accentPurple} />
                                )}
                                <Text
                                  style={[
                                    styles.optionPercentage,
                                    isSelected && styles.optionPercentageSelected,
                                  ]}
                                >
                                  {percentage}%
                                </Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Create Poll Modal */}
      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Poll"
        height="full"
      >
        <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.modalContent}>
            <Input
              label="Question"
              placeholder="What do you want to ask?"
              value={pollQuestion}
              onChangeText={setPollQuestion}
              dark
            />

            <View style={styles.optionsSection}>
              <Text style={styles.optionsLabel}>OPTIONS</Text>
              {pollOptions.map((option, index) => (
                <View key={index} style={styles.optionInputRow}>
                  <View style={styles.optionInputWrapper}>
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChangeText={(text) => updateOption(index, text)}
                      dark
                    />
                  </View>
                  {pollOptions.length > 2 && (
                    <TouchableOpacity
                      style={styles.removeOptionButton}
                      onPress={() => removeOption(index)}
                    >
                      <X size={20} color={Colors.gray400} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {pollOptions.length < 6 && (
                <TouchableOpacity style={styles.addOptionButton} onPress={addOption}>
                  <Plus size={20} color={Colors.accentPurple} />
                  <Text style={styles.addOptionText}>Add Option</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <Button
            title="Create Poll"
            onPress={handleCreatePoll}
            loading={creating}
            disabled={
              !pollQuestion.trim() ||
              pollOptions.filter((o) => o.trim()).length < 2 ||
              creating
            }
            variant="purple"
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
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.gray50,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: fonts[700],
    color: Colors.black,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.accentPurple,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    width: 48,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.gray50,
    alignItems: "center",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fonts[400],
    color: Colors.gray400,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.gray100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: fonts[700],
    color: Colors.black,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fonts[400],
    color: Colors.gray500,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  pollsList: {
    gap: 16,
  },
  pollCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 24,
    padding: 24,
  },
  pollHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  pollQuestion: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts[700],
    color: Colors.black,
    lineHeight: 26,
    marginRight: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.gray200,
    justifyContent: "center",
    alignItems: "center",
  },
  pollMeta: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  pollMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pollMetaText: {
    fontSize: 12,
    fontFamily: fonts[600],
    color: Colors.gray400,
  },
  optionsList: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    position: "relative",
    overflow: "hidden",
  },
  optionButtonVoted: {
    backgroundColor: Colors.gray100,
  },
  optionButtonSelected: {
    borderWidth: 2,
    borderColor: Colors.accentPurple,
  },
  optionProgress: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.accentPurple,
    opacity: 0.15,
    borderRadius: 16,
  },
  optionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionText: {
    fontSize: 15,
    fontFamily: fonts[600],
    color: Colors.black,
    flex: 1,
  },
  optionTextSelected: {
    color: Colors.accentPurple,
  },
  optionResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  optionPercentage: {
    fontSize: 14,
    fontFamily: fonts[700],
    color: Colors.gray500,
  },
  optionPercentageSelected: {
    color: Colors.accentPurple,
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  optionsSection: {
    marginTop: 8,
  },
  optionsLabel: {
    fontSize: 12,
    fontFamily: fonts[700],
    color: Colors.gray400,
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  optionInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  optionInputWrapper: {
    flex: 1,
  },
  removeOptionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryDark,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  addOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.accentPurple,
    borderStyle: "dashed",
    marginTop: 8,
  },
  addOptionText: {
    fontSize: 14,
    fontFamily: fonts[700],
    color: Colors.accentPurple,
  },
  modalFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray700,
  },
});
