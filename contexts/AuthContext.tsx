import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { authApi, userApi } from "@/lib/api";
import { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthResult {
  success: boolean;
  error?: string;
  needsVerification?: boolean;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      const userJson = await AsyncStorage.getItem("user");

      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        setAuthState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error("Error loading auth:", error);
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await authApi.login(email, password);
      const user = response.user;

      setAuthState({
        user,
        token: response.token,
        isLoading: false,
        isAuthenticated: true,
      });

      return { success: true };
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.error || "Login failed";

      // Check if error is about email verification
      if (errorMessage.toLowerCase().includes("verify") || errorMessage.toLowerCase().includes("verified")) {
        return {
          success: false,
          error: errorMessage,
          needsVerification: true,
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string): Promise<AuthResult> => {
    try {
      await authApi.register(email, password, name);
      return { success: true, needsVerification: true };
    } catch (error: any) {
      console.error("Register error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Registration failed",
      };
    }
  }, []);

  const verifyEmail = useCallback(async (token: string): Promise<AuthResult> => {
    try {
      await authApi.verifyEmail(token);
      return { success: true };
    } catch (error: any) {
      console.error("Verify email error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Verification failed",
      };
    }
  }, []);

  const resendVerification = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      await authApi.regenerateVerify(email);
      return { success: true };
    } catch (error: any) {
      console.error("Resend verification error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to resend verification email",
      };
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      await authApi.forgotPassword(email);
      return { success: true };
    } catch (error: any) {
      console.error("Forgot password error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to send reset email",
      };
    }
  }, []);

  const resetPassword = useCallback(async (token: string, password: string): Promise<AuthResult> => {
    try {
      await authApi.resetPassword(token, password);
      return { success: true };
    } catch (error: any) {
      console.error("Reset password error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to reset password",
      };
    }
  }, []);

  const updateUser = useCallback(async (data: { name?: string; avatar?: string }): Promise<AuthResult> => {
    try {
      const updatedUser = await userApi.update(data);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
      }));
      return { success: true };
    } catch (error: any) {
      console.error("Update user error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update profile",
      };
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const user = await userApi.getMe();
      await AsyncStorage.setItem("user", JSON.stringify(user));
      setAuthState((prev) => ({
        ...prev,
        user,
      }));
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  return useMemo(
    () => ({
      ...authState,
      login,
      register,
      logout,
      verifyEmail,
      resendVerification,
      forgotPassword,
      resetPassword,
      updateUser,
      refreshUser,
    }),
    [
      authState,
      login,
      register,
      logout,
      verifyEmail,
      resendVerification,
      forgotPassword,
      resetPassword,
      updateUser,
      refreshUser,
    ]
  );
});
