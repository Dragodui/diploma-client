import { FC, useState } from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import Colors from "@/constants/colors";
import fonts from "@/constants/fonts";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  dark?: boolean;
}

const Input: FC<InputProps> = ({ label, error, style, dark = false, secureTextEntry, ...rest }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry !== undefined;

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            dark && styles.inputDark,
            error && styles.inputError,
            isPassword && styles.inputWithIcon,
            style,
          ]}
          placeholderTextColor={Colors.gray400}
          secureTextEntry={isPassword && !showPassword}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            {showPassword ? (
              <EyeOff size={20} color={Colors.gray400} />
            ) : (
              <Eye size={20} color={Colors.gray400} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
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
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: 4,
    fontFamily: fonts[700],
  },
  labelDark: {
    color: Colors.gray400,
  },
  inputContainer: {
    position: "relative",
  },
  input: {
    height: 56,
    borderWidth: 0,
    borderRadius: 20,
    paddingHorizontal: 20,
    fontSize: 16,
    color: Colors.black,
    backgroundColor: Colors.gray50,
    fontFamily: fonts[600],
  },
  inputDark: {
    backgroundColor: Colors.secondaryDark,
    color: Colors.white,
  },
  inputWithIcon: {
    paddingRight: 50,
  },
  inputError: {
    borderWidth: 2,
    borderColor: Colors.red500,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  error: {
    color: Colors.red500,
    fontSize: 12,
    marginLeft: 4,
    fontFamily: fonts[500],
  },
});

export default Input;
