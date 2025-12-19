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
import { Plus, Check, Users, X } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useHome } from "@/contexts/HomeContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import { pollApi } from "@/lib/api";
import { Poll, PollOption } from "@/lib/types";
import fonts from "@/constants/fonts";
import Modal from "@/components/ui/modal";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function PollsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { home, isAdmin } = useHome();
  const { theme } = useTheme();
  const { t } = useI18n();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      setPolls(pollsData?.filter((p) => p.status === "open") || []);
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
      Alert.alert(t.common.error, t.polls.addAtLeastTwoOptions);
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
      Alert.alert(t.common.error, t.polls.failedToCreate);
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
      Alert.alert(t.common.error, t.polls.failedToVote);
    }
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

  const getTimeRemaining = () => {
    // Demo - in real app, calculate from poll data
    return "Closing in 2h";
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
        <Text style={[styles.title, { color: theme.text }]}>{t.polls.title}</Text>

        {/* Poll Cards */}
        {polls.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t.polls.noActivePolls}</Text>
          </View>
        ) : (
          polls.map((poll) => {
            const voted = hasUserVoted(poll);
            const userVote = getUserVote(poll);

            return (
              <View
                key={poll.id}
                style={[styles.pollCard, { backgroundColor: theme.accent.purple }]}
              >
                {/* Poll Header */}
                <View style={styles.pollHeader}>
                  <View style={styles.pollBadge}>
                    <Text style={styles.pollBadgeText}>{getTimeRemaining()}</Text>
                  </View>
                  <View style={styles.pollUsers}>
                    <Users size={16} color="#1C1C1E" />
                    <Users size={16} color="#1C1C1E" style={{ marginLeft: -8 }} />
                    <Users size={16} color="#1C1C1E" style={{ marginLeft: -8 }} />
                  </View>
                </View>

                {/* Poll Question */}
                <Text style={styles.pollQuestion}>{poll.question}</Text>

                {/* Poll Options */}
                <View style={styles.optionsList}>
                  {poll.options?.map((option) => {
                    const isSelected = userVote === option.id;
                    const voteCount = option.votes?.length || 0;

                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.optionButton,
                          isSelected && styles.optionButtonSelected,
                        ]}
                        onPress={() => !voted && handleVote(poll.id, option.id)}
                        disabled={voted}
                        activeOpacity={voted ? 1 : 0.8}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                          ]}
                        >
                          {option.option_text}
                        </Text>
                        <View style={styles.optionRight}>
                          {isSelected && <Check size={16} color="#FFFFFF" />}
                          <Text
                            style={[
                              styles.optionVotes,
                              isSelected && styles.optionVotesSelected,
                            ]}
                          >
                            {voteCount} {voteCount !== 1 ? t.polls.votes : t.polls.vote}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}

        {/* Create New Poll Button */}
        <TouchableOpacity
          style={[styles.createPollButton, { borderColor: theme.textSecondary }]}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={24} color={theme.textSecondary} />
          <Text style={[styles.createPollText, { color: theme.textSecondary }]}>
            {t.polls.newPoll}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Create Poll Modal */}
      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t.polls.createPoll}
        height="full"
      >
        <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.modalContent}>
            <Input
              label={t.polls.question}
              placeholder={t.polls.questionPlaceholder}
              value={pollQuestion}
              onChangeText={setPollQuestion}
            />

            <View style={styles.optionsSection}>
              <Text style={[styles.optionsLabel, { color: theme.textSecondary }]}>{t.polls.options}</Text>
              {pollOptions.map((option, index) => (
                <View key={index} style={styles.optionInputRow}>
                  <View style={styles.optionInputWrapper}>
                    <Input
                      placeholder={t.polls.optionPlaceholder.replace("{index}", String(index + 1))}
                      value={option}
                      onChangeText={(text) => updateOption(index, text)}
                    />
                  </View>
                  {pollOptions.length > 2 && (
                    <TouchableOpacity
                      style={[styles.removeOptionButton, { backgroundColor: theme.surface }]}
                      onPress={() => removeOption(index)}
                    >
                      <X size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {pollOptions.length < 6 && (
                <TouchableOpacity
                  style={[styles.addOptionButton, { borderColor: theme.accent.purple }]}
                  onPress={addOption}
                >
                  <Plus size={20} color={theme.accent.purple} />
                  <Text style={[styles.addOptionText, { color: theme.accent.purple }]}>
                    {t.polls.addOption}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
          <Button
            title={t.polls.createPoll}
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
  title: {
    fontSize: 36,
    fontFamily: fonts[700],
    marginBottom: 24,
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
  pollCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 16,
  },
  pollHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  pollBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pollBadgeText: {
    fontSize: 12,
    fontFamily: fonts[600],
    color: "#1C1C1E",
  },
  pollUsers: {
    flexDirection: "row",
    alignItems: "center",
  },
  pollQuestion: {
    fontSize: 22,
    fontFamily: fonts[700],
    color: "#1C1C1E",
    lineHeight: 28,
    marginBottom: 20,
  },
  optionsList: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionButtonSelected: {
    backgroundColor: "#1C1C1E",
  },
  optionText: {
    fontSize: 15,
    fontFamily: fonts[600],
    color: "#1C1C1E",
  },
  optionTextSelected: {
    color: "#FFFFFF",
  },
  optionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionVotes: {
    fontSize: 13,
    fontFamily: fonts[500],
    color: "rgba(0, 0, 0, 0.5)",
  },
  optionVotesSelected: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  createPollButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    marginTop: 8,
  },
  createPollText: {
    fontSize: 16,
    fontFamily: fonts[600],
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
    borderStyle: "dashed",
    marginTop: 8,
  },
  addOptionText: {
    fontSize: 14,
    fontFamily: fonts[700],
  },
  modalFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
