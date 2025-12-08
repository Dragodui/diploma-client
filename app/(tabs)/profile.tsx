import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import {
  LogOut,
  Home as HomeIcon,
  Settings,
  Bell,
  Shield,
  ChevronRight,
  Copy,
  RefreshCw,
  DoorOpen,
  Users,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "@/contexts/AuthContext";
import { useHome } from "@/contexts/HomeContext";
import Colors from "@/constants/colors";
import fonts from "@/constants/fonts";
import Modal from "@/components/ui/modal";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { home, isAdmin, createHome, joinHome, leaveHome, regenerateInviteCode } = useHome();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [homeName, setHomeName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
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

  const handleLeaveHome = () => {
    Alert.alert("Leave Home", "Are you sure you want to leave this home?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          const result = await leaveHome();
          if (!result.success) {
            Alert.alert("Error", result.error || "Failed to leave home");
          }
        },
      },
    ]);
  };

  const copyInviteCode = async () => {
    if (home?.invite_code) {
      await Clipboard.setStringAsync(home.invite_code);
      Alert.alert("Copied", "Invite code copied to clipboard");
    }
  };

  const handleRegenerateCode = () => {
    Alert.alert("Regenerate Code", "This will invalidate the current invite code. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Regenerate",
        onPress: async () => {
          const result = await regenerateInviteCode();
          if (result.success) {
            Alert.alert("Success", "Invite code regenerated");
          } else {
            Alert.alert("Error", result.error || "Failed to regenerate code");
          }
        },
      },
    ]);
  };

  console.log(home)

  const MENU_ITEMS = [
    {
      icon: HomeIcon,
      label: "Home Settings",
      color: Colors.accentYellow,
      onPress: () => {},
      show: !!home,
    },
    {
      icon: Settings,
      label: "App Settings",
      color: Colors.white,
      onPress: () => {},
      show: true,
    },
    {
      icon: Bell,
      label: "Notifications",
      color: Colors.accentPurple,
      onPress: () => {},
      show: true,
    },
    {
      icon: Shield,
      label: "Security",
      color: Colors.accentPink,
      onPress: () => {},
      show: true,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || "U"}</Text>
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user?.name || "User"}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {home && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{isAdmin ? "Home Admin" : "Member"}</Text>
            </View>
          )}
        </View>

        {/* Home Section */}
        {!home ? (
          <View style={styles.noHomeSection}>
            <Text style={styles.noHomeTitle}>Join or Create a Home</Text>
            <Text style={styles.noHomeText}>
              Connect with your roommates to manage tasks, bills, and more together.
            </Text>
            <View style={styles.homeButtons}>
              <TouchableOpacity
                style={styles.createHomeButton}
                onPress={() => setShowCreateModal(true)}
                activeOpacity={0.8}
              >
                <HomeIcon size={24} color={Colors.black} />
                <Text style={styles.createHomeText}>Create Home</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.joinHomeButton}
                onPress={() => setShowJoinModal(true)}
                activeOpacity={0.8}
              >
                <Users size={24} color={Colors.white} />
                <Text style={styles.joinHomeText}>Join Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.homeSection}>
            <View style={styles.homeCard}>
              <View style={styles.homeHeader}>
                <HomeIcon size={24} color={Colors.black} />
                <Text style={styles.homeName}>{home.name}</Text>
              </View>
              {home.invite_code && (
                <View style={styles.inviteCodeSection}>
                  <Text style={styles.inviteLabel}>INVITE CODE</Text>
                  <View style={styles.inviteCodeRow}>
                    <Text style={styles.inviteCode}>{home.invite_code}</Text>
                    <TouchableOpacity onPress={copyInviteCode} style={styles.copyButton}>
                      <Copy size={20} color={Colors.black} />
                    </TouchableOpacity>
                    {isAdmin && (
                      <TouchableOpacity onPress={handleRegenerateCode} style={styles.refreshButton}>
                        <RefreshCw size={18} color={Colors.gray500} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
              {home.memberships && (
                <Text style={styles.membersCount}>
                  {home.memberships.length} member{home.memberships.length !== 1 ? "s" : ""}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.filter((item) => item.show).map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                  <Icon size={20} color={Colors.black} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <ChevronRight size={20} color={Colors.gray400} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Leave Home / Logout */}
        <View style={styles.bottomActions}>
          {home && (
            <TouchableOpacity
              style={styles.leaveHomeButton}
              onPress={handleLeaveHome}
              activeOpacity={0.8}
            >
              <DoorOpen size={20} color={Colors.red500} />
              <Text style={styles.leaveHomeText}>Leave Home</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LogOut size={20} color={Colors.red500} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Create Home Modal */}
      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Home"
      >
        <View style={styles.modalContent}>
          <Input
            label="Home Name"
            placeholder="e.g., Our Apartment"
            value={homeName}
            onChangeText={setHomeName}
            dark
          />
          <Button
            title="Create Home"
            onPress={handleCreateHome}
            loading={isLoading}
            disabled={!homeName.trim() || isLoading}
            variant="yellow"
            style={styles.modalButton}
          />
        </View>
      </Modal>

      {/* Join Home Modal */}
      <Modal visible={showJoinModal} onClose={() => setShowJoinModal(false)} title="Join Home">
        <View style={styles.modalContent}>
          <Input
            label="Invite Code"
            placeholder="Enter invite code"
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
            dark
          />
          <Button
            title="Join Home"
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
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.accentYellow,
    padding: 4,
    marginBottom: 16,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 56,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 56,
    backgroundColor: Colors.gray200,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 40,
    fontFamily: fonts[700],
    color: Colors.black,
  },
  userName: {
    fontSize: 28,
    fontFamily: fonts[700],
    color: Colors.black,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: fonts[400],
    color: Colors.gray400,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: Colors.secondaryDark,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontFamily: fonts[700],
    color: Colors.accentYellow,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  noHomeSection: {
    backgroundColor: Colors.gray50,
    borderRadius: 32,
    padding: 32,
    marginBottom: 24,
    alignItems: "center",
  },
  noHomeTitle: {
    fontSize: 22,
    fontFamily: fonts[700],
    color: Colors.black,
    marginBottom: 8,
    textAlign: "center",
  },
  noHomeText: {
    fontSize: 14,
    fontFamily: fonts[400],
    color: Colors.gray500,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  homeButtons: {
    width: "100%",
    gap: 12,
  },
  createHomeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: Colors.accentYellow,
    paddingVertical: 16,
    borderRadius: 16,
  },
  createHomeText: {
    fontSize: 16,
    fontFamily: fonts[700],
    color: Colors.black,
  },
  joinHomeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: Colors.black,
    paddingVertical: 16,
    borderRadius: 16,
  },
  joinHomeText: {
    fontSize: 16,
    fontFamily: fonts[700],
    color: Colors.white,
  },
  homeSection: {
    marginBottom: 24,
  },
  homeCard: {
    backgroundColor: Colors.accentYellow,
    borderRadius: 32,
    padding: 24,
  },
  homeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  homeName: {
    fontSize: 24,
    fontFamily: fonts[700],
    color: Colors.black,
  },
  inviteCodeSection: {
    marginBottom: 16,
  },
  inviteLabel: {
    fontSize: 10,
    fontFamily: fonts[700],
    color: "rgba(0,0,0,0.5)",
    letterSpacing: 2,
    marginBottom: 8,
  },
  inviteCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inviteCode: {
    fontSize: 20,
    fontFamily: fonts[800],
    color: Colors.black,
    letterSpacing: 2,
    flex: 1,
  },
  copyButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  membersCount: {
    fontSize: 14,
    fontFamily: fonts[600],
    color: "rgba(0,0,0,0.6)",
  },
  menuSection: {
    gap: 12,
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray50,
    borderRadius: 20,
    padding: 16,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts[700],
    color: Colors.black,
  },
  bottomActions: {
    gap: 12,
  },
  leaveHomeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingVertical: 16,
    borderRadius: 20,
  },
  leaveHomeText: {
    fontSize: 16,
    fontFamily: fonts[700],
    color: Colors.red500,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingVertical: 16,
    borderRadius: 20,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: fonts[700],
    color: Colors.red500,
  },
  modalContent: {
    flex: 1,
  },
  modalButton: {
    marginTop: "auto",
  },
});
