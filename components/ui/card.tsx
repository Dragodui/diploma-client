import { FC, ReactNode } from "react";
import { View, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

type CardVariant = "default" | "surface" | "yellow" | "purple" | "pink" | "mint" | "white";

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
  borderRadius?: number;
}

const Card: FC<CardProps> = ({
  children,
  variant = "default",
  style,
  onPress,
  padding = 24,
  borderRadius = 32,
}) => {
  const { theme } = useTheme();

  const getCardStyle = () => {
    switch (variant) {
      case "surface":
        return { backgroundColor: theme.surface };
      case "yellow":
        return { backgroundColor: theme.accent.yellow };
      case "purple":
        return { backgroundColor: theme.accent.purple };
      case "pink":
        return { backgroundColor: theme.accent.pink };
      case "mint":
        return { backgroundColor: theme.accent.mint };
      case "white":
        return { backgroundColor: "#FFFFFF" };
      default:
        return { backgroundColor: theme.surface };
    }
  };

  const cardStyles = [
    styles.card,
    getCardStyle(),
    { padding, borderRadius },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyles} onPress={onPress} activeOpacity={0.95}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
});

export default Card;
