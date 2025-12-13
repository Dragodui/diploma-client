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

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const { theme } = useTheme();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await register(email, password, name);
    setIsLoading(false);

    if (result.success) {
      router.push({ pathname: "/verify", params: { email } });
    } else {
      setError(result.error || "Registration failed");
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
        {/* Header - matches PDF */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Join HŌME</Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>Smart living starts here.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="FULL NAME"
            placeholder="Alex Doe"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError("");
            }}
            autoCapitalize="words"
            autoComplete="name"
          />

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
            placeholder="Create a password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError("");
            }}
            secureTextEntry
            autoComplete="password-new"
            error={error || undefined}
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            variant="yellow"
            style={styles.registerButton}
          />
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>Already a member? </Text>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={[styles.link, { color: theme.text }]}>Log In</Text>
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
  title: {
    fontSize: 48,
    fontFamily: fonts[800],
    marginBottom: 8,
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
  registerButton: {
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
