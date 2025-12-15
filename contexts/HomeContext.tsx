import { useState, useEffect, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { homeApi, roomApi } from "@/lib/api";
import { Home, Room, HomeMembership } from "@/lib/types";
import { useAuth } from "./AuthContext";

interface HomeResult {
  success: boolean;
  error?: string;
}

export const [HomeProvider, useHome] = createContextHook(() => {
  const { isAuthenticated, user } = useAuth();
  const [home, setHome] = useState<Home | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const loadHome = useCallback(async () => {
    try {
      setIsLoading(true);
      const homeData = await homeApi.getUserHome();
      // Check if home has valid ID
        console.log("Home data received:", homeData);
    console.log("Home data type:", typeof homeData);
    console.log("Home has id?", homeData?.id);
      if (homeData && homeData.id) {
        setHome(homeData);

        // Check if current user is admin
        if (homeData.memberships && user) {
          const membership = homeData.memberships.find((m: HomeMembership) => m.user_id === user.id);
          setIsAdmin(membership?.role === "admin");
        }

        // Load rooms
        const roomsData = await roomApi.getByHomeId(homeData.id);
        setRooms(roomsData || []);
      } else {
        setHome(null);
        setRooms([]);
        setIsAdmin(false);
      }
    } catch (error: any) {
      console.error("Error loading home:", error);
      if (error.response?.status !== 404) {
        console.error("Unexpected error:", error);
      }
      setHome(null);
      setRooms([]);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      loadHome();
    } else {
      setHome(null);
      setRooms([]);
      setIsAdmin(false);
      setIsLoading(false);
    }
  }, [isAuthenticated, loadHome]);

  const createHome = useCallback(
    async (name: string): Promise<HomeResult> => {
      try {
        await homeApi.create(name);
        // Reload home data after creating
        await loadHome();
        return { success: true };
      } catch (error: any) {
        console.error("Error creating home:", error);
        return {
          success: false,
          error: error.response?.data?.error || "Failed to create home",
        };
      }
    },
    [loadHome]
  );

  const joinHome = useCallback(
    async (code: string): Promise<HomeResult> => {
      try {
        await homeApi.join(code);
        await loadHome();
        return { success: true };
      } catch (error: any) {
        console.error("Error joining home:", error);
        return {
          success: false,
          error: error.response?.data?.error || "Failed to join home",
        };
      }
    },
    [loadHome]
  );

  const leaveHome = useCallback(async (): Promise<HomeResult> => {
    if (!home) return { success: false, error: "No home found" };

    try {
      await homeApi.leave(home.id);
      setHome(null);
      setRooms([]);
      setIsAdmin(false);
      return { success: true };
    } catch (error: any) {
      console.error("Error leaving home:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to leave home",
      };
    }
  }, [home]);

  const deleteHome = useCallback(async (): Promise<HomeResult> => {
    if (!home) return { success: false, error: "No home found" };

    try {
      await homeApi.delete(home.id);
      setHome(null);
      setRooms([]);
      setIsAdmin(false);
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting home:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete home",
      };
    }
  }, [home]);

  const removeMember = useCallback(
    async (userId: number): Promise<HomeResult> => {
      if (!home) return { success: false, error: "No home found" };

      try {
        await homeApi.removeMember(home.id, userId);
        await loadHome();
        return { success: true };
      } catch (error: any) {
        console.error("Error removing member:", error);
        return {
          success: false,
          error: error.response?.data?.error || "Failed to remove member",
        };
      }
    },
    [home, loadHome]
  );

  const regenerateInviteCode = useCallback(async (): Promise<HomeResult> => {
    if (!home) return { success: false, error: "No home found" };

    try {
      await homeApi.regenerateInviteCode(home.id);
      // Reload home data to get the new invite code
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

  const refreshRooms = useCallback(async () => {
    if (!home) return;

    try {
      const roomsData = await roomApi.getByHomeId(home.id);
      setRooms(roomsData || []);
    } catch (error) {
      console.error("Error refreshing rooms:", error);
    }
  }, [home]);

  // Room operations
  const createRoom = useCallback(
    async (name: string): Promise<HomeResult> => {
      if (!home) return { success: false, error: "No home found" };

      try {
        await roomApi.create(home.id, name);
        // Reload rooms after creating
        await refreshRooms();
        return { success: true };
      } catch (error: any) {
        console.error("Error creating room:", error);
        return {
          success: false,
          error: error.response?.data?.error || "Failed to create room",
        };
      }
    },
    [home, refreshRooms]
  );

  const deleteRoom = useCallback(
    async (roomId: number): Promise<HomeResult> => {
      if (!home) return { success: false, error: "No home found" };

      try {
        await roomApi.delete(home.id, roomId);
        setRooms((prev) => prev.filter((r) => r.id !== roomId));
        return { success: true };
      } catch (error: any) {
        console.error("Error deleting room:", error);
        return {
          success: false,
          error: error.response?.data?.error || "Failed to delete room",
        };
      }
    },
    [home]
  );

  return useMemo(
    () => ({
      home,
      rooms,
      isLoading,
      isAdmin,
      loadHome,
      createHome,
      joinHome,
      leaveHome,
      deleteHome,
      removeMember,
      regenerateInviteCode,
      createRoom,
      deleteRoom,
      refreshRooms,
    }),
    [
      home,
      rooms,
      isLoading,
      isAdmin,
      loadHome,
      createHome,
      joinHome,
      leaveHome,
      deleteHome,
      removeMember,
      regenerateInviteCode,
      createRoom,
      deleteRoom,
      refreshRooms,
    ]
  );
});
