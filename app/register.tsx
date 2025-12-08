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
import Colors from "@/constants/colors";
import fonts from "@/constants/fonts";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

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
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Join HOME</Text>
          <Text style={styles.tagline}>Smart living starts here.</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Alex Doe"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError("");
            }}
            autoCapitalize="words"
            autoComplete="name"
            dark
          />

          <Input
            label="Email"
            placeholder="hello@home.app"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError("");
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            dark
          />

          <Input
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError("");
            }}
            secureTextEntry
            autoComplete="password-new"
            error={error || undefined}
            dark
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

        <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.footerText}>Already a member? </Text>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={styles.link}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    justifyContent: "space-between",
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 48,
    fontFamily: fonts[700],
    color: Colors.white,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    fontFamily: fonts[400],
    color: Colors.gray400,
  },
  form: {
    flex: 1,
    justifyContent: "center",
  },
  registerButton: {
    marginTop: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: Colors.gray400,
    fontFamily: fonts[400],
  },
  link: {
    fontSize: 14,
    fontFamily: fonts[700],
    color: Colors.white,
    textDecorationLine: "underline",
  },
});
