import { useState, useEffect, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { homeApi, Home } from "@/lib/api";
import { useAuth } from "./AuthContext";

export const [HomeProvider, useHome] = createContextHook(() => {
  const { isAuthenticated } = useAuth();
  const [home, setHome] = useState<Home | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadHome = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await homeApi.getUserHome();
      setHome(response.data);
    } catch (error: any) {
      console.error("Error loading home:", error);
      if (error.response?.status !== 404) {
        console.error("Unexpected error:", error);
      }
      setHome(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadHome();
    } else {
      setHome(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, loadHome]);

  const createHome = useCallback(async (name: string) => {
    try {
      await homeApi.createHome(name);
      await loadHome();
      return { success: true };
    } catch (error: any) {
      console.error("Error creating home:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to create home",
      };
    }
  }, [loadHome]);

  const joinHome = useCallback(async (code: string) => {
    try {
      await homeApi.joinHome(code);
      await loadHome();
      return { success: true };
    } catch (error: any) {
      console.error("Error joining home:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to join home",
      };
    }
  }, [loadHome]);

  const leaveHome = useCallback(async () => {
    try {
      await homeApi.leaveHome();
      setHome(null);
      return { success: true };
    } catch (error: any) {
      console.error("Error leaving home:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to leave home",
      };
    }
  }, []);

  const regenerateInviteCode = useCallback(async () => {
    if (!home) return { success: false, error: "No home found" };
    
    try {
      await homeApi.regenerateInviteCode(home.id);
      await loadHome();
      return { success: true };
    } catch (error: any) {
      console.error("Error regenerating invite code:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to regenerate invite code",
      };
    }
  }, [home, loadHome]);

  return useMemo(() => ({
    home,
    isLoading,
    loadHome,
    createHome,
    joinHome,
    leaveHome,
    regenerateInviteCode,
  }), [home, isLoading, loadHome, createHome, joinHome, leaveHome, regenerateInviteCode]);
});
