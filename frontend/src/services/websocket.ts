import type { ClientMessage, WebSocketMessage } from '../types/websocket';

type MessageHandler = (msg: WebSocketMessage) => void;
type ConnectionHandler = (connected: boolean, error?: string) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessage: MessageHandler;
  private onConnectionChange: ConnectionHandler;
  
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  private manualClose = false;

  constructor(
    roomId: string,
    wsToken: string,
    onMessage: MessageHandler,
    onConnectionChange: ConnectionHandler
  ) {
    // Determine WS protocol based on window location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // We assume backend is on port 8000 for local dev if frontend is 5173
    const backendHost = host.includes('5173') ? 'localhost:8000' : host;
    
    this.url = `${protocol}//${backendHost}/api/v1/ws/${roomId}?token=${wsToken}`;
    this.onMessage = onMessage;
    this.onConnectionChange = onConnectionChange;
  }

  public connect() {
    this.manualClose = false;
    this.setupConnection();
  }

  private setupConnection() {
    if (this.ws) {
      this.ws.close();
    }

    console.log(`Connecting to WS: ${this.url}`);
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WS Connected');
      this.reconnectAttempts = 0;
      this.onConnectionChange(true);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.onMessage(msg);
      } catch (e) {
        // Raw string message like "Room not found"
        console.error('WS raw message or parse error:', event.data);
        if (event.data === 'Reconnect window expired. Please join again.' ||
            event.data === 'Room not found' ||
            event.data === 'Participant is no longer in the room' ||
            event.data === 'Invalid WebSocket token') {
            this.manualClose = true;
            this.onConnectionChange(false, event.data);
        }
      }
    };

    this.ws.onclose = (event) => {
      console.log('WS Closed', event.code, event.reason);
      if (this.manualClose) {
        this.onConnectionChange(false);
        return;
      }
      
      this.onConnectionChange(false);
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WS Error:', error);
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      this.onConnectionChange(false, 'permanent_failure');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    console.log(`Attempting reconnect in ${delay}ms (Attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = window.setTimeout(() => {
      this.setupConnection();
    }, delay);
  }

  public send(msg: ClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.error('Cannot send message, WS is not open');
    }
  }

  public disconnect() {
    this.manualClose = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
