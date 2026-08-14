import { getWsBaseUrl } from '../../lib/api-client';
import type { ClientWebSocketMessage, ServerWebSocketMessage } from './types';

type MessageHandler = (msg: ServerWebSocketMessage) => void;
type ConnectionHandler = (connected: boolean, reason?: string) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessage: MessageHandler;
  private onConnectionChange: ConnectionHandler;
  
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  private pingInterval: number | null = null;
  private isManuallyClosed = false;

  constructor(
    roomCode: string,
    token: string,
    onMessage: MessageHandler,
    onConnectionChange: ConnectionHandler
  ) {
    this.url = `${getWsBaseUrl()}/${roomCode.toUpperCase()}?token=${encodeURIComponent(token)}`;
    this.onMessage = onMessage;
    this.onConnectionChange = onConnectionChange;
  }

  public connect() {
    this.isManuallyClosed = false;
    this.setupConnection();
  }

  private setupConnection() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.onConnectionChange(true);
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as ServerWebSocketMessage;
          this.onMessage(msg);
        } catch {
          // Handle string errors from backend like "Room not found", "Invalid WebSocket token"
          const rawText = String(event.data);
          if (
            rawText.includes('Room not found') ||
            rawText.includes('Invalid WebSocket token') ||
            rawText.includes('no longer in the room') ||
            rawText.includes('expired')
          ) {
            this.isManuallyClosed = true;
            this.onConnectionChange(false, rawText);
          }
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        if (this.isManuallyClosed) {
          this.onConnectionChange(false);
          return;
        }

        this.onConnectionChange(false);
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.warn('WebSocket error encountered:', error);
      };
    } catch (err) {
      console.error('Failed to create WebSocket instance:', err);
      this.onConnectionChange(false, 'failed_to_initialize');
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.onConnectionChange(false, 'permanent_failure');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);

    this.reconnectTimeout = window.setTimeout(() => {
      if (!this.isManuallyClosed) {
        this.setupConnection();
      }
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = window.setInterval(() => {
      this.send({ type: 'presence_ping' });
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public send(msg: ClientWebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  public disconnect() {
    this.isManuallyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }
}
