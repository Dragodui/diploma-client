import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { authApi, User } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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
        const user = JSON.parse(userJson);
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

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      const user: User =  response.user;
      
      await AsyncStorage.setItem("user", JSON.stringify(user));
      
      setAuthState({
        user,
        token: response.token,
        isLoading: false,
        isAuthenticated: true,
      });
      
      return { success: true };
    } catch (error: any) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
      };
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      await authApi.register(email, password, name);
      return { success: true };
    } catch (error: any) {
      console.error("Register error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Registration failed",
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      await AsyncStorage.removeItem("user");
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

  return useMemo(() => ({
    ...authState,
    login,
    register,
    logout,
  }), [authState, login, register, logout]);
});
