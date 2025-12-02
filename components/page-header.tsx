import { FC, ReactNode } from "react";
import { View, Text, StyleSheet, ViewStyle, Image, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import fonts from "@/constants/fonts";

interface PageHeaderProps {
  title: string;
  description?: string;
  style?: ViewStyle;
  rightAction?: ReactNode;
  avatar?: string;
  onAvatarPress?: () => void;
  dark?: boolean;
}

const PageHeader: FC<PageHeaderProps> = ({
  title,
  description,
  style,
  rightAction,
  avatar,
  onAvatarPress,
  dark = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, dark && styles.containerDark, { paddingTop: insets.top + 12 }, style]}>
      <View style={styles.textContainer}>
        {description && (
          <Text style={[styles.description, dark && styles.descriptionDark]}>{description}</Text>
        )}
        <Text style={[styles.title, dark && styles.titleDark]}>{title}</Text>
      </View>
      <View style={styles.rightContainer}>
        {rightAction}
        {avatar && (
          <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: Colors.white,
  },
  containerDark: {
    backgroundColor: Colors.primaryDark,
  },
  textContainer: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: Colors.gray400,
    fontFamily: fonts[400],
    marginBottom: 4,
  },
  descriptionDark: {
    color: Colors.gray400,
  },
  title: {
    fontSize: 32,
    fontFamily: fonts[700],
    color: Colors.black,
  },
  titleDark: {
    color: Colors.white,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: Colors.gray200,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
});

export default PageHeader;
