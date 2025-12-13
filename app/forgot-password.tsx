import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";
import fonts from "@/constants/fonts";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await forgotPassword(email);
    setIsLoading(false);

    if (result.success) {
      setEmailSent(true);
    } else {
      setError(result.error || "Failed to send reset email");
    }
  };

  if (emailSent) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.black} />
        </TouchableOpacity>

        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle size={64} color={Colors.accentPurple} />
          </View>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successText}>
            We've sent a password reset link to{"\n"}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
          <Button
            title="Back to Login"
            onPress={() => router.replace("/login")}
            variant="purple"
            style={styles.backToLoginButton}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.black} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Mail size={40} color={Colors.black} />
          </View>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            No worries! Enter your email and we'll send you a reset link.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email Address"
            placeholder="hello@home.app"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError("");
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={error || undefined}
          />

          <Button
            title="Send Reset Link"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading || !email}
            variant="purple"
            style={styles.submitButton}
          />
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.footerText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={styles.link}>Sign In</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 32,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.gray50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  header: {
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: Colors.accentYellow,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: fonts[700],
    color: Colors.black,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts[400],
    color: Colors.gray500,
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  submitButton: {
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
    color: Colors.black,
    textDecorationLine: "underline",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accentPurple + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 28,
    fontFamily: fonts[700],
    color: Colors.black,
    marginBottom: 16,
    textAlign: "center",
  },
  successText: {
    fontSize: 16,
    fontFamily: fonts[400],
    color: Colors.gray500,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  emailHighlight: {
    fontFamily: fonts[700],
    color: Colors.black,
  },
  backToLoginButton: {
    width: "100%",
  },
});
