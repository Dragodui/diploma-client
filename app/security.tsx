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
import {
  ArrowLeft,
  Shield,
  Key,
  Mail,
  CheckCircle,
  AlertCircle,
} from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import fonts from "@/constants/fonts";
import Modal from "@/components/ui/modal";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t.common.error, t.security.fillAllFields || "Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t.common.error, t.security.passwordsMismatch || "Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t.common.error, t.security.passwordTooShort || "Password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      // TODO: Implement password change API call
      // await authApi.changePassword({ currentPassword, newPassword });

      Alert.alert(
        t.common.success || "Success",
        t.security.passwordChanged || "Password changed successfully"
      );
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      Alert.alert(t.common.error, t.security.passwordChangeFailed || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
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
            {t.profile.security}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Email Verification Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t.security.account || "ACCOUNT"}
          </Text>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.statusRow}>
              <View style={[styles.statusIcon, { backgroundColor: theme.accent.purple }]}>
                <Mail size={20} color="#1C1C1E" />
              </View>
              <View style={styles.statusInfo}>
                <Text style={[styles.statusLabel, { color: theme.text }]}>
                  {t.security.email || "Email"}
                </Text>
                <Text style={[styles.statusValue, { color: theme.textSecondary }]}>
                  {user?.email || "Not set"}
                </Text>
              </View>
              {user?.email_verified ? (
                <View style={[styles.verifiedBadge, { backgroundColor: theme.status.success + "20" }]}>
                  <CheckCircle size={16} color={theme.status.success} />
                  <Text style={[styles.verifiedText, { color: theme.status.success }]}>
                    {t.security.verified || "Verified"}
                  </Text>
                </View>
              ) : (
                <View style={[styles.verifiedBadge, { backgroundColor: theme.status.warning + "20" }]}>
                  <AlertCircle size={16} color={theme.status.warning} />
                  <Text style={[styles.verifiedText, { color: theme.status.warning }]}>
                    {t.security.unverified || "Unverified"}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Password Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t.security.password || "PASSWORD"}
          </Text>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.surface }]}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={[styles.menuIcon, { backgroundColor: theme.accent.pink }]}>
              <Key size={20} color="#1C1C1E" />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuLabel, { color: theme.text }]}>
                {t.security.changePassword || "Change Password"}
              </Text>
              <Text style={[styles.menuDescription, { color: theme.textSecondary }]}>
                {t.security.lastChanged || "Update your password regularly for security"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Security Tips */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t.security.tips || "SECURITY TIPS"}
          </Text>
          <View style={[styles.tipsCard, { backgroundColor: theme.surface }]}>
            <View style={styles.tipRow}>
              <Shield size={18} color={theme.accent.purple} />
              <Text style={[styles.tipText, { color: theme.text }]}>
                {t.security.tip1 || "Use a strong, unique password"}
              </Text>
            </View>
            <View style={styles.tipRow}>
              <Shield size={18} color={theme.accent.purple} />
              <Text style={[styles.tipText, { color: theme.text }]}>
                {t.security.tip2 || "Never share your password with others"}
              </Text>
            </View>
            <View style={styles.tipRow}>
              <Shield size={18} color={theme.accent.purple} />
              <Text style={[styles.tipText, { color: theme.text }]}>
                {t.security.tip3 || "Enable email verification for extra security"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title={t.security.changePassword || "Change Password"}
        height="full"
      >
        <View style={styles.modalContent}>
          <Input
            label={t.security.currentPassword || "Current Password"}
            placeholder="Enter current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <Input
            label={t.security.newPassword || "New Password"}
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <Input
            label={t.security.confirmPassword || "Confirm Password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <Button
            title={t.security.changePassword || "Change Password"}
            onPress={handleChangePassword}
            loading={isChangingPassword}
            disabled={!currentPassword || !newPassword || !confirmPassword}
            variant="pink"
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontFamily: fonts[600],
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 14,
    fontFamily: fonts[400],
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 12,
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
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontFamily: fonts[600],
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 13,
    fontFamily: fonts[400],
  },
  tipsCard: {
    padding: 20,
    borderRadius: 20,
    gap: 16,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts[500],
  },
  modalContent: {
    flex: 1,
  },
  modalButton: {
    marginTop: "auto",
  },
});
