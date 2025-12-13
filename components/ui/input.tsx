import { FC, useState } from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import fonts from "@/constants/fonts";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  focused?: boolean;
}

const Input: FC<InputProps> = ({ label, error, style, secureTextEntry, ...rest }) => {
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isPassword = secureTextEntry !== undefined;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBackground,
              color: theme.inputText,
              borderColor: error
                ? theme.status.error
                : isFocused
                ? theme.inputBorderFocused
                : theme.inputBorder,
              borderWidth: error || isFocused ? 2 : 0,
            },
            isPassword && styles.inputWithIcon,
            style,
          ]}
          placeholderTextColor={theme.inputPlaceholder}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            {showPassword ? (
              <EyeOff size={20} color={theme.textSecondary} />
            ) : (
              <Eye size={20} color={theme.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.error, { color: theme.status.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginLeft: 4,
    fontFamily: fonts[700],
  },
  inputContainer: {
    position: "relative",
  },
  input: {
    height: 64,
    borderRadius: 20,
    paddingHorizontal: 24,
    fontSize: 16,
    fontFamily: fonts[500],
  },
  inputWithIcon: {
    paddingRight: 56,
  },
  eyeIcon: {
    position: "absolute",
    right: 20,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  error: {
    fontSize: 12,
    marginLeft: 4,
    fontFamily: fonts[500],
  },
});

export default Input;
