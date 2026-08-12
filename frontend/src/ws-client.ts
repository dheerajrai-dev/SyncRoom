import type { ClientMessage, ServerMessage } from './types/ws-messages';

type MessageHandler = (msg: ServerMessage) => void;
type ConnectionHandler = () => void;
type CloseHandler = (event: CloseEvent) => void;

export class WsClient {
  private ws: WebSocket | null = null;
  private url: string;
  private messageHandlers: Set<MessageHandler> = new Set();
  private openHandlers: Set<ConnectionHandler> = new Set();
  private closeHandlers: Set<CloseHandler> = new Set();

  constructor(roomId: string, token: string) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // In dev mode, Vite runs on different port, but assuming proxy or direct url:
    // If backend is on 8000:
    const backendHost = import.meta.env.VITE_BACKEND_URL ? new URL(import.meta.env.VITE_BACKEND_URL).host : 'localhost:8000';
    this.url = `${protocol}//${backendHost}/ws/${roomId}?token=${token}`;
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.openHandlers.forEach((h) => h());
    };

    this.ws.onmessage = (event) => {
      try {
        const data: ServerMessage = JSON.parse(event.data);
        this.messageHandlers.forEach((h) => h(data));
      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    };

    this.ws.onclose = (event) => {
      this.closeHandlers.forEach((h) => h(event));
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: ClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Tried to send message on closed socket', message);
    }
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onOpen(handler: ConnectionHandler) {
    this.openHandlers.add(handler);
    return () => this.openHandlers.delete(handler);
  }

  onClose(handler: CloseHandler) {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }
}
