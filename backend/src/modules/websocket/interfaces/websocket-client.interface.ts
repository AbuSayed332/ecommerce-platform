export interface WebsocketClient {
  id: string;
  userId?: string;
  username?: string;
  email?: string;
  connectedAt: Date;
  lastActivity: Date;
  status?: 'online' | 'away' | 'busy' | 'offline';
  rooms: string[];
  metadata: Record<string, any>;
}

export interface MessageResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: string;
}

export interface RoomData {
  name: string;
  clients: string[];
  createdAt: Date;
  createdBy: string;
  isPrivate: boolean;
  password?: string;
  metadata: Record<string, any>;
  clientDetails?: WebsocketClient[];
}

export interface TypingIndicator {
  user: WebsocketClient;
  room?: string;
  timestamp: string;
}

export interface ConnectionEvent {
  type: 'connect' | 'disconnect' | 'reconnect';
  client: WebsocketClient;
  timestamp: string;
}

export interface RoomEvent {
  type: 'join' | 'leave' | 'create' | 'delete';
  room: string;
  client: WebsocketClient;
  timestamp: string;
}

export interface MessageEvent {
  id: string;
  type: string;
  content: string;
  sender: WebsocketClient;
  room?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
