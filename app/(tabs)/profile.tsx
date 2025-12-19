import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import {
  LogOut,
  Home as HomeIcon,
  Settings,
  Bell,
  Shield,
  ChevronRight,
  User,
  Sun,
  Moon,
  Copy,
  Globe,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useHome } from "@/contexts/HomeContext";
import { useTheme } from "@/contexts/ThemeContext";
import fonts from "@/constants/fonts";
import Modal from "@/components/ui/modal";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

import * as ImagePicker from "expo-image-picker";
import { imageApi } from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";
import { Language } from "@/lib/i18n";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const { home, isAdmin, createHome, joinHome, leaveHome } = useHome();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { t, language, setLanguage, languageNames, availableLanguages } = useI18n();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [homeName, setHomeName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].uri) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadImage = async (uri: string) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      // @ts-ignore - React Native FormData expects specific format
      formData.append("image", {
        uri,
        name: "avatar.jpg",
        type: "image/jpeg",
      });

      const response = await imageApi.upload(formData);
      if (response.url) {
        await updateUser({ avatar: response.url });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t.auth.logOut, t.auth.logOutConfirm, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.auth.logOut,
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const handleCreateHome = async () => {
    if (!homeName.trim()) return;

    setIsLoading(true);
    const result = await createHome(homeName);
    setIsLoading(false);

    if (result.success) {
      setShowCreateModal(false);
      setHomeName("");
    } else {
      Alert.alert("Error", result.error || "Failed to create home");
    }
  };

  const handleJoinHome = async () => {
    if (!inviteCode.trim()) return;

    setIsLoading(true);
    const result = await joinHome(inviteCode);
    setIsLoading(false);

    if (result.success) {
      setShowJoinModal(false);
      setInviteCode("");
    } else {
      Alert.alert("Error", result.error || "Failed to join home");
    }
  };

  const getUsername = () => {
    if (user?.name) {
      const names = user.name.split(" ");
      return `@${names[0].toLowerCase()}_${names[names.length - 1]?.toLowerCase() || "user"}`;
    }
    return "@user";
  };

  const MENU_ITEMS = [
    {
      icon: HomeIcon,
      label: t.profile.homeSettings,
      color: theme.accent.yellow,
      onPress: () => router.push("/rooms"),
    },
    {
      icon: Settings,
      label: t.profile.settings,
      color: theme.surface,
      onPress: () => { },
    },
    {
      icon: Bell,
      label: t.profile.notifications,
      color: theme.surface,
      onPress: () => { },
    },
    {
      icon: Shield,
      label: t.profile.security,
      color: theme.accent.pink,
      onPress: () => { },
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Avatar - matches PDF exactly */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={[styles.avatarContainer, { borderColor: theme.accent.purple }]}
            onPress={pickImage}
            activeOpacity={0.8}
            disabled={isUploading}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={[styles.avatar, isUploading && { opacity: 0.5 }]} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.surface }]}>
                <User size={64} color={theme.textSecondary} />
              </View>
            )}
            {isUploading && (
              <View style={StyleSheet.absoluteFill}>
                <ActivityIndicator size="small" color={theme.accent.purple} style={{ flex: 1 }} />
              </View>
            )}
          </TouchableOpacity>

          {/* Name */}
          <Text style={[styles.userName, { color: theme.text }]}>{user?.name || "User"}</Text>

          {/* Username */}
          <Text style={[styles.userHandle, { color: theme.textSecondary }]}>{getUsername()}</Text>

          {/* Role Badge */}
          {home && (
            <View style={[styles.roleBadge, { backgroundColor: theme.surface }]}>
              <Text style={[styles.roleBadgeText, { color: theme.textSecondary }]}>
                {isAdmin ? t.profile.homeAdmin : t.profile.member}
              </Text>
            </View>
          )}

          {/* Invite Code */}
          {home && home.invite_code && (
            <TouchableOpacity
              style={[styles.inviteCodeContainer, { backgroundColor: theme.surface }]}
              onPress={async () => {
                await Clipboard.setStringAsync(home.invite_code);
                Alert.alert(t.common.copied, t.profile.inviteCodeCopied);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.inviteCodeLabel, { color: theme.textSecondary }]}>
                {t.profile.homeCode}
              </Text>
              <View style={styles.inviteCodeRow}>
                <Text style={[styles.inviteCodeText, { color: theme.text }]}>
                  {home.invite_code}
                </Text>
                <Copy size={16} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Menu Items - matches PDF exactly */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { backgroundColor: theme.surface }]}
                onPress={item.onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                  <Icon size={22} color="#1C1C1E" />
                </View>
                <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
                <ChevronRight size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Theme Toggle */}
        <View style={styles.themeSection}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t.profile.theme}</Text>
          <View style={styles.themeToggle}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: theme.surface },
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
                { backgroundColor: theme.surface },
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

        {/* Language Selector */}
        <View style={styles.themeSection}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            <Globe size={12} color={theme.textSecondary} /> LANGUAGE
          </Text>
          <View style={styles.languageGrid}>
            {availableLanguages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageOption,
                  { backgroundColor: theme.surface },
                  language === lang && { backgroundColor: theme.accent.purple },
                ]}
                onPress={() => setLanguage(lang)}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    { color: language === lang ? "#1C1C1E" : theme.textSecondary },
                  ]}
                >
                  {languageNames[lang]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Home Actions - only show if no home */}
        {!home && (
          <View style={styles.homeActions}>
            <Button
              title={t.profile.createHome}
              onPress={() => setShowCreateModal(true)}
              variant="yellow"
              style={styles.homeButton}
            />
            <Button
              title={t.profile.joinHome}
              onPress={() => setShowJoinModal(true)}
              variant="purple"
              style={styles.homeButton}
            />
          </View>
        )}

        {/* Logout Button - matches PDF exactly */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.accent.dangerLight }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>{t.auth.logOut}</Text>
          <LogOut size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>

      {/* Create Home Modal */}
      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t.profile.createHome}
        height="full"
      >
        <View style={styles.modalContent}>
          <Input
            label={t.profile.homeName}
            placeholder={t.profile.homeNamePlaceholder}
            value={homeName}
            onChangeText={setHomeName}
          />
          <Button
            title={t.profile.createHome}
            onPress={handleCreateHome}
            loading={isLoading}
            disabled={!homeName.trim() || isLoading}
            variant="yellow"
            style={styles.modalButton}
          />
        </View>
      </Modal>

      {/* Join Home Modal */}
      <Modal visible={showJoinModal} onClose={() => setShowJoinModal(false)} title={t.profile.joinHome}>
        <View style={styles.modalContent}>
          <Input
            label={t.profile.inviteCode}
            placeholder={t.profile.inviteCodePlaceholder}
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
          />
          <Button
            title={t.profile.joinHome}
            onPress={handleJoinHome}
            loading={isLoading}
            disabled={!inviteCode.trim() || isLoading}
            variant="purple"
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
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    overflow: "hidden",
    marginBottom: 20,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 28,
    fontFamily: fonts[700],
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 16,
    fontFamily: fonts[400],
    marginBottom: 16,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 13,
    fontFamily: fonts[600],
  },
  inviteCodeContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  inviteCodeLabel: {
    fontSize: 11,
    fontFamily: fonts[600],
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  inviteCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inviteCodeText: {
    fontSize: 18,
    fontFamily: fonts[700],
    letterSpacing: 2,
  },
  menuSection: {
    gap: 12,
    marginBottom: 32,
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
  themeSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts[700],
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  themeToggle: {
    flexDirection: "row",
    gap: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  themeOptionText: {
    fontSize: 14,
    fontFamily: fonts[600],
  },
  languageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  languageOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  languageOptionText: {
    fontSize: 14,
    fontFamily: fonts[600],
  },
  homeActions: {
    gap: 12,
    marginBottom: 32,
  },
  homeButton: {},
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 20,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: fonts[700],
    color: "#FFFFFF",
  },
  modalContent: {
    flex: 1,
  },
  modalButton: {
    marginTop: "auto",
  },
});
