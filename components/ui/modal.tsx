import { FC, ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import fonts from "@/constants/fonts";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  height?: "auto" | "full" | number;
}

const Modal: FC<ModalProps> = ({ visible, onClose, title, children, height = "auto" }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const getHeightStyle = () => {
    if (height === "full") {
      return { height: "95%" as const };
    }
    if (height === "auto") {
      return { maxHeight: "85%" as const };
    }
    return { height: `${height}%` as const };
  };

  return (
    <RNModal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { backgroundColor: theme.isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.5)" }]} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={[styles.container, getHeightStyle(), { paddingBottom: insets.bottom + 16, backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            {title && <Text style={[styles.title, { color: theme.text }]}>{title}</Text>}
            <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.background }]} onPress={onClose} activeOpacity={0.7}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts[700],
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },
});

export default Modal;
