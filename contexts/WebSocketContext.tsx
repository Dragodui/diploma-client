import { useEffect, useRef, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { useAuth } from "./AuthContext";

const WS_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/^https?/, "ws") + "/ws";

export type EventModule =
  | "BILL_CATEGORY"
  | "BILL"
  | "HOME"
  | "NOTIFICATION"
  | "HOME_NOTIFICATION"
  | "POLL"
  | "ROOM"
  | "SHOPPING_CATEGORY"
  | "SHOPPING_ITEM"
  | "TASK"
  | "USER";

export type EventAction =
  | "CREATED"
  | "UPDATED"
  | "DELETED"
  | "MARKED_PAYED"
  | "CLOSED"
  | "VOTED"
  | "UNVOTED"
  | "MEMBER_JOINED"
  | "MEMBER_LEFT"
  | "MEMBER_REMOVED"
  | "ASSIGNED"
  | "COMPLETED"
  | "UNCOMPLETED"
  | "MARK_READ";

export interface RealTimeEvent {
  module: EventModule;
  action: EventAction;
  data: any;
}

type EventCallback = (event: RealTimeEvent) => void;

export const [WebSocketProvider, useWebSocket] = createContextHook(() => {
  const { isAuthenticated } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Map<string, Set<EventCallback>>>(new Map());
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log("[WS] Connected");
      };

      ws.onmessage = (e) => {
        try {
          const event: RealTimeEvent = JSON.parse(e.data);
          const moduleSubscribers = subscribersRef.current.get(event.module);
          if (moduleSubscribers) {
            moduleSubscribers.forEach((cb) => cb(event));
          }
        } catch (err) {
          console.error("[WS] Failed to parse message:", err);
        }
      };

      ws.onclose = () => {
        console.log("[WS] Disconnected");
        wsRef.current = null;
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isAuthenticated) {
            connect();
          }
        }, 3000);
      };

      ws.onerror = (err) => {
        console.error("[WS] Error:", err);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("[WS] Connection failed:", err);
    }
  }, [isAuthenticated]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }
    return disconnect;
  }, [isAuthenticated, connect, disconnect]);

  const subscribe = useCallback(
    (modules: EventModule[], callback: EventCallback): (() => void) => {
      modules.forEach((module) => {
        if (!subscribersRef.current.has(module)) {
          subscribersRef.current.set(module, new Set());
        }
        subscribersRef.current.get(module)!.add(callback);
      });

      return () => {
        modules.forEach((module) => {
          subscribersRef.current.get(module)?.delete(callback);
        });
      };
    },
    []
  );

  return useMemo(() => ({ subscribe }), [subscribe]);
});
