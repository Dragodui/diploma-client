import { useEffect } from "react";
import { useWebSocket, EventModule } from "@/contexts/WebSocketContext";

export function useRealtimeRefresh(modules: EventModule[], callback: () => void) {
  const { subscribe } = useWebSocket();
  const modulesKey = modules.join(",");

  useEffect(() => {
    return subscribe(modules, callback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, callback, modulesKey]);
}
