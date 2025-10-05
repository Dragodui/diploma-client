import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LogOut, Home as HomeIcon, UserPlus, Copy } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useHome } from "@/contexts/HomeContext";
import Colors from "@/constants/colors";
import * as Clipboard from "expo-clipboard";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { home, createHome, joinHome, leaveHome, regenerateInviteCode } = useHome();
  const [showCreateHome, setShowCreateHome] = useState<boolean>(false);
  const [showJoinHome, setShowJoinHome] = useState<boolean>(false);
  const [homeName, setHomeName] = useState<string>("");
  const [inviteCode, setInviteCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogout = async () => {
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
    if (!homeName.trim()) {
      Alert.alert("Error", "Please enter a home name");
      return;
    }

    setIsLoading(true);
    const result = await createHome(homeName);
    setIsLoading(false);

    if (result.success) {
      setShowCreateHome(false);
      setHomeName("");
      Alert.alert("Success", "Home created successfully!");
    } else {
      Alert.alert("Error", result.error || "Failed to create home");
    }
  };

  const handleJoinHome = async () => {
    if (!inviteCode.trim()) {
      Alert.alert("Error", "Please enter an invite code");
      return;
    }

    setIsLoading(true);
    const result = await joinHome(inviteCode);
    setIsLoading(false);

    if (result.success) {
      setShowJoinHome(false);
      setInviteCode("");
      Alert.alert("Success", "Joined home successfully!");
    } else {
      Alert.alert("Error", result.error || "Failed to join home");
    }
  };

  const handleLeaveHome = async () => {
    Alert.alert(
      "Leave Home",
      "Are you sure you want to leave this home?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            const result = await leaveHome();
            if (result.success) {
              Alert.alert("Success", "Left home successfully");
            } else {
              Alert.alert("Error", result.error || "Failed to leave home");
            }
          },
        },
      ]
    );
  };

  const copyInviteCode = async () => {
    if (home?.invite_code) {
      await Clipboard.setStringAsync(home.invite_code);
      Alert.alert("Copied", "Invite code copied to clipboard");
    }
  };

  const handleRegenerateCode = async () => {
    Alert.alert(
      "Regenerate Code",
      "This will invalidate the current invite code. Continue?",
      [
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
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user?.name || "N/A"}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email || "N/A"}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Home</Text>

        {home ? (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>Home Name</Text>
              <Text style={styles.value}>{home.name}</Text>
            </View>

            {home.invite_code ? (
              <View style={styles.card}>
                <Text style={styles.label}>Invite Code</Text>
                <View style={styles.inviteCodeContainer}>
                  <Text style={styles.inviteCode}>{home.invite_code}</Text>
                  <TouchableOpacity onPress={copyInviteCode}>
                    <Copy size={20} color={Colors.black} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={handleRegenerateCode}
                >
                  <Text style={styles.linkButtonText}>Regenerate Code</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleLeaveHome}
            >
              <Text style={styles.dangerButtonText}>Leave Home</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {!showCreateHome && !showJoinHome ? (
              <>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => setShowCreateHome(true)}
                >
                  <HomeIcon size={20} color={Colors.white} />
                  <Text style={styles.buttonText}>Create Home</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.outlineButton}
                  onPress={() => setShowJoinHome(true)}
                >
                  <UserPlus size={20} color={Colors.black} />
                  <Text style={styles.outlineButtonText}>Join Home</Text>
                </TouchableOpacity>
              </>
            ) : null}

            {showCreateHome ? (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Create New Home</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Home name"
                  placeholderTextColor={Colors.gray400}
                  value={homeName}
                  onChangeText={setHomeName}
                />
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={styles.formButton}
                    onPress={handleCreateHome}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.formButtonText}>Create</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.formCancelButton}
                    onPress={() => {
                      setShowCreateHome(false);
                      setHomeName("");
                    }}
                  >
                    <Text style={styles.formCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {showJoinHome ? (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Join Home</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Invite code"
                  placeholderTextColor={Colors.gray400}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                />
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={styles.formButton}
                    onPress={handleJoinHome}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.formButtonText}>Join</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.formCancelButton}
                    onPress={() => {
                      setShowJoinHome(false);
                      setInviteCode("");
                    }}
                  >
                    <Text style={styles.formCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#EF4444" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
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
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.black,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.black,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.gray600,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 16,
    color: Colors.black,
  },
  inviteCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inviteCode: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.black,
    letterSpacing: 2,
  },
  linkButton: {
    marginTop: 12,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.gray600,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    backgroundColor: Colors.black,
    borderRadius: 16,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 16,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.black,
  },
  dangerButton: {
    height: 52,
    backgroundColor: "#FEE2E2",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#EF4444",
  },
  formCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.black,
    marginBottom: 16,
  },
  input: {
    height: 52,
    borderWidth: 2,
    borderColor: Colors.gray100,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.black,
    backgroundColor: Colors.white,
    marginBottom: 16,
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
  },
  formButton: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.black,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  formButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  formCancelButton: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray200,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  formCancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.gray600,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    backgroundColor: "#FEE2E2",
    borderRadius: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#EF4444",
  },
});
