import { FC } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import Colors from "@/constants/colors";
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
  const getButtonStyle = () => {
    switch (variant) {
      case "yellow":
        return styles.buttonYellow;
      case "purple":
        return styles.buttonPurple;
      case "pink":
        return styles.buttonPink;
      case "secondary":
        return styles.buttonSecondary;
      case "outline":
        return styles.buttonOutline;
      case "danger":
        return styles.buttonDanger;
      default:
        return styles.buttonPrimary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "yellow":
      case "purple":
      case "pink":
        return styles.textDark;
      case "outline":
        return styles.textOutline;
      case "danger":
        return styles.textDanger;
      default:
        return styles.textLight;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === "yellow" || variant === "purple" || variant === "pink" ? Colors.black : Colors.white} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 24,
  },
  buttonPrimary: {
    backgroundColor: Colors.black,
  },
  buttonSecondary: {
    backgroundColor: Colors.secondaryDark,
  },
  buttonYellow: {
    backgroundColor: Colors.accentYellow,
  },
  buttonPurple: {
    backgroundColor: Colors.accentPurple,
  },
  buttonPink: {
    backgroundColor: Colors.accentPink,
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: Colors.gray600,
  },
  buttonDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontFamily: fonts[700],
  },
  textLight: {
    color: Colors.white,
  },
  textDark: {
    color: Colors.black,
  },
  textOutline: {
    color: Colors.gray400,
  },
  textDanger: {
    color: Colors.red500,
  },
});

export default Button;
