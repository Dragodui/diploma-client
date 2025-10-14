import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import PageHeader from "@/components/page-header";
import Button from "@/components/ui/button";
import colors from "@/constants/colors";
import fonts from "@/constants/fonts";
import { authApi } from "@/lib/api";
import { CheckCircle, XCircle, Mail } from "lucide-react-native";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      setLoading(true);
      setError("");
      try {
        await authApi.verifyEmail(token);
        setVerified(true);
      } catch (err: any) {
        console.log(err);
        setError(err?.response?.data?.error || "Verification failed");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  const handleSendEmail = async () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.regenerateVerify(email);
      setSent(true);
    } catch (err: any) {
      console.log(err);
      setError(err?.response?.data?.error || "Failed to send verification email");
    } finally {
      setLoading(false);
    }
  };

  if (token) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <PageHeader title="Verify Email" description="" />
          <View style={styles.content}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.black} />
            ) : (
              <View style={styles.resultRow}>
                {verified ? (
                  <CheckCircle size={28} color={colors.green500} />
                ) : (
                  <XCircle size={28} color={colors.red500} />
                )}
                <Text
                  style={[
                    styles.message,
                    { color: verified ? colors.green500 : colors.red500 },
                  ]}
                >
                  {verified
                    ? "Email verified successfully!"
                    : error || "Verification failed"}
                </Text>
              </View>
            )}

            <Button
              title="Go to Login"
              onPress={() => router.replace("/login")}
              style={{ marginTop: 24, width: "100%" }}
            />
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <PageHeader title="Resend Verification Email" description="" />

        <View style={styles.content}>
          {sent ? (
            <>
              <View style={styles.resultRow}>
                <CheckCircle size={28} color={colors.green500} />
                <Text style={[styles.message, { color: colors.green500 }]}>
                  Verification email sent!
                </Text>
              </View>

              <Button
                title="Go to Login"
                onPress={() => router.replace("/login")}
                style={{ marginTop: 24, width: "100%" }}
              />
            </>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Mail size={20} color={colors.gray600} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.gray600}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button
                title="Send Verification Email"
                onPress={handleSendEmail}
                loading={loading}
                disabled={loading}
                style={{ marginTop: 24, width: "100%" }}
              />
            </>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  message: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: fonts[700],
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts[400],
    color: colors.black,
  },
  error: {
    color: colors.red500,
    fontSize: 14,
    marginTop: 8,
    fontFamily: fonts[400],
  },
});
