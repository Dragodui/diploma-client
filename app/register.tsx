import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

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
      Alert.alert(
        "Success",
        "Registration successful! Please check your email to verify your account.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/login"),
          },
        ]
      );
    } else {
      setError(result.error || "Registration failed");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={Colors.gray400}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                testID="name-input"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={Colors.gray400}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                testID="email-input"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.gray400}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password-new"
                testID="password-input"
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              testID="register-button"
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.link}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray600,
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.black,
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
  },
  button: {
    height: 52,
    backgroundColor: Colors.black,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  error: {
    fontSize: 14,
    color: "#EF4444",
    marginTop: -8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: Colors.gray600,
  },
  link: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.black,
  },
});
