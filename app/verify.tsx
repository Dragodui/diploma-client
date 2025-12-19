import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "@/components/ui/button";
import Colors from "@/constants/colors";
import fonts from "@/constants/fonts";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n, interpolate } from "@/contexts/I18nContext";
import { Mail, CheckCircle, XCircle, ArrowLeft } from "lucide-react-native";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, email: paramEmail } = useLocalSearchParams<{ token?: string; email?: string }>();
  const { verifyEmail, resendVerification } = useAuth();
  const { t } = useI18n();

  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const email = paramEmail || "";

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      setLoading(true);
      setError("");
      const result = await verifyEmail(token);
      setLoading(false);

      if (result.success) {
        setVerified(true);
      } else {
        setError(result.error || t.verify.verificationFailed);
      }
    };

    verify();
  }, [token, verifyEmail]);

  const handleResend = async () => {
    if (!email) {
      setError(t.verify.emailRequired);
      return;
    }

    setError("");
    setLoading(true);
    const result = await resendVerification(email);
    setLoading(false);

    if (result.success) {
      setSent(true);
    } else {
      setError(result.error || t.verify.failedToSend);
    }
  };

  // Token-based verification result
  if (token) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
          <View style={styles.content}>
            {loading ? (
              <ActivityIndicator size="large" color={Colors.accentPurple} />
            ) : (
              <>
                <View style={[styles.iconContainer, verified ? styles.successBg : styles.errorBg]}>
                  {verified ? (
                    <CheckCircle size={48} color={Colors.white} />
                  ) : (
                    <XCircle size={48} color={Colors.white} />
                  )}
                </View>
                <Text style={styles.title}>
                  {verified ? t.verify.emailVerified : t.verify.verificationFailed}
                </Text>
                <Text style={styles.subtitle}>
                  {verified
                    ? t.verify.verifiedMessage
                    : error || t.verify.linkExpired}
                </Text>
              </>
            )}

            <Button
              title={verified ? t.verify.continueToLogin : t.verify.tryAgain}
              onPress={() => router.replace("/login")}
              variant={verified ? "purple" : "primary"}
              style={styles.button}
            />
          </View>
        </View>
      </>
    );
  }

  // Email verification pending screen
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.black} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={[styles.iconContainer, styles.pendingBg]}>
            <Mail size={48} color={Colors.black} />
          </View>

          <Text style={styles.title}>{t.verify.title}</Text>
          <Text style={styles.subtitle}>
            {sent
              ? interpolate(t.verify.sentMessage, { email })
              : interpolate(t.verify.checkInbox, { email })}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {!sent && (
            <Button
              title={t.verify.resendEmail}
              onPress={handleResend}
              loading={loading}
              disabled={loading}
              variant="outline"
              style={styles.button}
            />
          )}

          <Button
            title={t.verify.backToLogin}
            onPress={() => router.replace("/login")}
            variant="primary"
            style={styles.button}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 32,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray50,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 80,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successBg: {
    backgroundColor: Colors.green500,
  },
  errorBg: {
    backgroundColor: Colors.red500,
  },
  pendingBg: {
    backgroundColor: Colors.accentYellow,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts[700],
    color: Colors.black,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts[400],
    color: Colors.gray500,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  error: {
    color: Colors.red500,
    fontSize: 14,
    fontFamily: fonts[500],
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    width: "100%",
    marginTop: 12,
  },
});
