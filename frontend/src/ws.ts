import { Client } from "@stomp/stompjs";

export function createStompClient(onConnect?: () => void) {
  const url = `ws://${window.location.hostname}:8080/ws`;

  const client = new Client({
    brokerURL: url,
    reconnectDelay: 2000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => onConnect?.(),
    onStompError: (f) =>
      console.error("STOMP error", f.headers["message"], f.body),
    onWebSocketError: (e) => console.error("WS error", e),
  });

  return client;
}
