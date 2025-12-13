import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import fonts from "@/constants/fonts";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      router.replace("/(tabs)/home");
    } else if (result.needsVerification) {
      router.push({ pathname: "/verify", params: { email } });
    } else {
      setError(result.error || "Login failed");
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header - matches PDF exactly */}
        <View style={styles.header}>
          <Text style={[styles.brand, { color: theme.text }]}>HŌME</Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>Co-living made bold.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="EMAIL"
            placeholder="hello@gome.app"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError("");
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Input
            label="PASSWORD"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError("");
            }}
            secureTextEntry
            autoComplete="password"
            error={error || undefined}
          />

          <Button
            title="Get Started"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            variant="purple"
            style={styles.loginButton}
          />
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>New here? </Text>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={[styles.link, { color: theme.text }]}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 48,
  },
  brand: {
    fontSize: 64,
    fontFamily: fonts[800],
    marginBottom: 8,
    letterSpacing: -2,
  },
  tagline: {
    fontSize: 20,
    fontFamily: fonts[400],
  },
  form: {
    flex: 1,
    justifyContent: "center",
    gap: 8,
  },
  loginButton: {
    marginTop: 24,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 32,
  },
  footerText: {
    fontSize: 14,
    fontFamily: fonts[400],
  },
  link: {
    fontSize: 14,
    fontFamily: fonts[700],
    textDecorationLine: "underline",
  },
});
