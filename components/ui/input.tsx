import { FC } from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import Colors from "@/constants/colors";
import fonts from "@/constants/fonts";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

const Input: FC<InputProps> = ({ label, error, style, ...rest }) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, style, error ? styles.inputError : null]}
        placeholderTextColor={Colors.gray400}
        {...rest}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.black,
    fontFamily: fonts[500],
  },
  input: {
    height: 52,
    borderWidth: 2,
    borderColor: Colors.gray100,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.black,
    backgroundColor: Colors.white,
    fontFamily: fonts[400],
  },
  inputError: {
    borderColor: "#EF4444",
  },
  error: {
    color: "#EF4444",
    fontSize: 12,
  },
});

export default Input;
