import { FC, ReactNode } from "react";
import { View, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";
import Colors from "@/constants/colors";

type CardVariant = "default" | "dark" | "yellow" | "purple" | "pink" | "white";

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
  const getCardStyle = () => {
    switch (variant) {
      case "dark":
        return styles.cardDark;
      case "yellow":
        return styles.cardYellow;
      case "purple":
        return styles.cardPurple;
      case "pink":
        return styles.cardPink;
      case "white":
        return styles.cardWhite;
      default:
        return styles.cardDefault;
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
  cardDefault: {
    backgroundColor: Colors.gray50,
  },
  cardDark: {
    backgroundColor: Colors.secondaryDark,
  },
  cardYellow: {
    backgroundColor: Colors.accentYellow,
  },
  cardPurple: {
    backgroundColor: Colors.accentPurple,
  },
  cardPink: {
    backgroundColor: Colors.accentPink,
  },
  cardWhite: {
    backgroundColor: Colors.white,
  },
});

export default Card;
