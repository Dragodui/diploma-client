import { useState, useEffect } from "react";
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
import { useI18n } from "@/contexts/I18nContext";
import fonts from "@/constants/fonts";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { useGoogleAuth } from "@/lib/useGoogleAuth";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, googleSignIn } = useAuth();
  const { theme } = useTheme();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const { request, response, promptAsync, getUserInfo, isReady } = useGoogleAuth();

  useEffect(() => {
    handleGoogleResponse();
  }, [response]);

  const handleGoogleResponse = async () => {
    if (response?.type === "success") {
      setIsGoogleLoading(true);
      setError("");

      const { authentication } = response;
      if (authentication?.accessToken) {
        const userInfo = await getUserInfo(authentication.accessToken);

        if (userInfo) {
          const result = await googleSignIn(userInfo.email, userInfo.name, userInfo.picture);

          if (result.success) {
            router.replace("/(tabs)/home");
          } else {
            setError(result.error || t.auth.googleSignInFailed);
          }
        } else {
          setError(t.auth.failedToGetUserInfo);
        }
      }
      setIsGoogleLoading(false);
    } else if (response?.type === "error") {
      setError(t.auth.googleSignInCancelled);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isReady) {
      setError(t.auth.googleSignInNotReady);
      return;
    }
    await promptAsync();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t.auth.fillAllFields);
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
      setError(result.error || t.auth.loginFailed);
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
          <Text style={[styles.brand, { color: theme.text }]}>{t.auth.brand}</Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>{t.auth.tagline}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label={t.auth.email}
            placeholder={t.auth.emailPlaceholder}
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
            label={t.auth.password}
            placeholder={t.auth.passwordPlaceholder}
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
            title={t.auth.getStarted}
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading || isGoogleLoading}
            variant="purple"
            style={styles.loginButton}
          />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textSecondary }]}>{t.common.or}</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, { borderColor: theme.border }]}
            onPress={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading || !isReady}
          >
            <Ionicons name="logo-google" size={20} color={theme.text} />
            <Text style={[styles.googleButtonText, { color: theme.text }]}>
              {isGoogleLoading ? t.auth.signingIn : t.auth.continueWithGoogle}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>{t.auth.newHere} </Text>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={[styles.link, { color: theme.text }]}>{t.auth.createAccount}</Text>
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
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontFamily: fonts[400],
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontFamily: fonts[600],
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
