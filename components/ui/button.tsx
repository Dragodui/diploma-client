import { FC } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import fonts from "@/constants/fonts";

type ButtonVariant = "primary" | "secondary" | "yellow" | "purple" | "pink" | "outline" | "danger";

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const Button: FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  style,
  textStyle,
  icon,
}) => {
  const { theme } = useTheme();

  const getButtonStyle = () => {
    switch (variant) {
      case "yellow":
        return { backgroundColor: theme.accent.yellow };
      case "purple":
        return { backgroundColor: theme.accent.purple };
      case "pink":
        return { backgroundColor: theme.accent.pink };
      case "secondary":
        return { backgroundColor: theme.surface };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 2,
          borderColor: theme.border,
          borderStyle: "dashed" as const,
        };
      case "danger":
        return { backgroundColor: theme.accent.dangerLight };
      default:
        return { backgroundColor: theme.isDark ? theme.text : theme.background };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "yellow":
      case "purple":
      case "pink":
        return "#1C1C1E"; // Always dark text on accent colors
      case "outline":
        return theme.textSecondary;
      case "danger":
        return "#FFFFFF";
      default:
        return theme.isDark ? "#1C1C1E" : "#FFFFFF";
    }
  };

  const getLoaderColor = () => {
    switch (variant) {
      case "yellow":
      case "purple":
      case "pink":
        return "#1C1C1E";
      default:
        return theme.isDark ? "#1C1C1E" : "#FFFFFF";
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getLoaderColor()} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 24,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontFamily: fonts[700],
  },
});

export default Button;
