import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Sun,
  Moon,
  Globe,
  Trash2,
  ChevronRight,
} from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import { useHome } from "@/contexts/HomeContext";
import fonts from "@/constants/fonts";
import Modal from "@/components/ui/modal";
import Button from "@/components/ui/button";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { t, language, setLanguage, languageNames, availableLanguages } = useI18n();
  const { home, leaveHome, isAdmin } = useHome();

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeaveHome = async () => {
    if (!home) return;

    setIsLeaving(true);
    try {
      const result = await leaveHome();
      if (result.success) {
        setShowDeleteConfirm(false);
        router.replace("/(tabs)/profile");
      } else {
        Alert.alert(t.common.error, result.error || t.settings.leaveHomeFailed);
      }
    } catch (error) {
      Alert.alert(t.common.error, t.settings.leaveHomeFailed);
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.surface }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>
            {t.profile.settings}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t.settings.appearance || "APPEARANCE"}
          </Text>

          {/* Theme Toggle */}
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {t.profile.theme}
            </Text>
            <View style={styles.themeOptions}>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  { backgroundColor: theme.background },
                  themeMode === "light" && { backgroundColor: theme.accent.yellow },
                ]}
                onPress={() => setThemeMode("light")}
              >
                <Sun size={20} color={themeMode === "light" ? "#1C1C1E" : theme.textSecondary} />
                <Text
                  style={[
                    styles.themeOptionText,
                    { color: themeMode === "light" ? "#1C1C1E" : theme.textSecondary },
                  ]}
                >
                  {t.profile.light}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  { backgroundColor: theme.background },
                  themeMode === "dark" && { backgroundColor: theme.accent.purple },
                ]}
                onPress={() => setThemeMode("dark")}
              >
                <Moon size={20} color={themeMode === "dark" ? "#1C1C1E" : theme.textSecondary} />
                <Text
                  style={[
                    styles.themeOptionText,
                    { color: themeMode === "dark" ? "#1C1C1E" : theme.textSecondary },
                  ]}
                >
                  {t.profile.dark}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t.settings.language || "LANGUAGE"}
          </Text>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.surface }]}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={[styles.menuIcon, { backgroundColor: theme.accent.purple }]}>
              <Globe size={20} color="#1C1C1E" />
            </View>
            <Text style={[styles.menuLabel, { color: theme.text }]}>
              {languageNames[language]}
            </Text>
            <ChevronRight size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Home Settings Section */}
        {home && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {t.settings.homeSettings || "HOME SETTINGS"}
            </Text>
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <View style={styles.cardRow}>
                <Text style={[styles.cardLabel, { color: theme.text }]}>
                  {t.settings.homeName || "Home Name"}
                </Text>
                <Text style={[styles.cardValue, { color: theme.textSecondary }]}>
                  {home.name}
                </Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.cardLabel, { color: theme.text }]}>
                  {t.settings.yourRole || "Your Role"}
                </Text>
                <Text style={[styles.cardValue, { color: theme.textSecondary }]}>
                  {isAdmin ? t.profile.homeAdmin : t.profile.member}
                </Text>
              </View>
            </View>

            {/* Leave/Delete Home */}
            <TouchableOpacity
              style={[styles.dangerButton, { backgroundColor: theme.accent.dangerLight }]}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={20} color="#FFFFFF" />
              <Text style={styles.dangerButtonText}>
                {isAdmin
                  ? (t.settings.deleteHome || "Delete Home")
                  : (t.settings.leaveHome || "Leave Home")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        title={t.settings.selectLanguage || "Select Language"}
        height="full"
      >
        <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
          {availableLanguages.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageItem,
                { backgroundColor: theme.surface },
                language === lang && { backgroundColor: theme.accent.purple },
              ]}
              onPress={() => {
                setLanguage(lang);
                setShowLanguageModal(false);
              }}
            >
              <Text
                style={[
                  styles.languageText,
                  { color: language === lang ? "#1C1C1E" : theme.text },
                ]}
              >
                {languageNames[lang]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>

      {/* Delete/Leave Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={isAdmin
          ? (t.settings.deleteHomeConfirmTitle || "Delete Home?")
          : (t.settings.leaveHomeConfirmTitle || "Leave Home?")}
      >
        <View style={styles.confirmContent}>
          <Text style={[styles.confirmText, { color: theme.textSecondary }]}>
            {isAdmin
              ? (t.settings.deleteHomeConfirmText || "This action cannot be undone. All data will be permanently deleted.")
              : (t.settings.leaveHomeConfirmText || "You will no longer have access to this home.")}
          </Text>
          <View style={styles.confirmButtons}>
            <Button
              title={t.common.cancel}
              onPress={() => setShowDeleteConfirm(false)}
              variant="surface"
              style={styles.confirmButton}
            />
            <Button
              title={isAdmin ? (t.common.delete || "Delete") : (t.settings.leave || "Leave")}
              onPress={handleLeaveHome}
              variant="danger"
              loading={isLeaving}
              style={styles.confirmButton}
            />
          </View>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
    flex: 1,
    fontSize: 24,
    fontFamily: fonts[700],
    textAlign: "center",
  },
  placeholder: {
    width: 48,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: fonts[700],
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    padding: 20,
    borderRadius: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts[600],
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  cardLabel: {
    fontSize: 15,
    fontFamily: fonts[500],
  },
  cardValue: {
    fontSize: 15,
    fontFamily: fonts[400],
  },
  themeOptions: {
    flexDirection: "row",
    gap: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  themeOptionText: {
    fontSize: 14,
    fontFamily: fonts[600],
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    gap: 14,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts[600],
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  dangerButtonText: {
    fontSize: 16,
    fontFamily: fonts[600],
    color: "#FFFFFF",
  },
  languageList: {
    flex: 1,
  },
  languageItem: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 10,
  },
  languageText: {
    fontSize: 17,
    fontFamily: fonts[600],
  },
  confirmContent: {
    paddingTop: 10,
  },
  confirmText: {
    fontSize: 15,
    fontFamily: fonts[400],
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
  },
  confirmButton: {
    flex: 1,
  },
});
