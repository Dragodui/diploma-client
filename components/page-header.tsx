import colors from "@/constants/colors";
import fonts from "@/constants/fonts";
import { FC } from "react";
import { StyleSheet, View, Text, Dimensions } from "react-native";

interface PageHeaderProps {
  title: string;
  description: string;
}

const { height: screenHeight } = Dimensions.get("window");

const PageHeader: FC<PageHeaderProps> = ({ title, description }) => {
  return (
    <View style={styles.header}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.black,
    height: screenHeight /3,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    overflow: "hidden",
    paddingHorizontal: 24,
    justifyContent: "flex-end", // текст внизу
    paddingBottom: 40, // отступ от нижнего края
  },

  textContainer: {
    // чтобы текст не прилипал к краю
  },

  title: {
    fontSize: 40,
    fontWeight: "700" as const,
    color: colors.white,
    marginBottom: 8,
    fontFamily: fonts[900],
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    fontFamily: fonts[400],
  },
});

export default PageHeader;
