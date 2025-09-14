import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { WebsocketClient, MessageResponse, RoomData } from './interfaces';
import { WebsocketMessageDto } from './dto';

@Injectable()
export class WebsocketService {
  private readonly logger = new Logger(WebsocketService.name);
  private server: Server;
  private clients: Map<string, WebsocketClient> = new Map();
  private rooms: Map<string, RoomData> = new Map();

  setServer(server: Server) {
    this.server = server;
  }

  async addClient(client: WebsocketClient): Promise<void> {
    this.clients.set(client.id, client);
    this.logger.log(`Client added to registry: ${client.id}`);
  }

  async removeClient(clientId: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (client) {
      // Remove client from all rooms
      for (const roomName of client.rooms) {
        await this.leaveRoom(clientId, roomName);
      }
    }
    this.clients.delete(clientId);
    this.logger.log(`Client removed from registry: ${clientId}`);
  }

  async getClient(clientId: string): Promise<WebsocketClient | undefined> {
    return this.clients.get(clientId);
  }

  async getAllClients(): Promise<WebsocketClient[]> {
    return Array.from(this.clients.values());
  }

  async getClientsByUserId(userId: string): Promise<WebsocketClient[]> {
    return Array.from(this.clients.values()).filter(
      client => client.userId === userId
    );
  }

  async updateClientActivity(clientId: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastActivity = new Date();
      this.clients.set(clientId, client);
    }
  }

  async updateClientStatus(
    clientId: string,
    status: 'online' | 'away' | 'busy' | 'offline'
  ): Promise<MessageResponse> {
    const client = this.clients.get(clientId);
    if (client) {
      client.status = status;
      client.lastActivity = new Date();
      this.clients.set(clientId, client);
      
      return {
        success: true,
        message: 'Status updated successfully',
        data: { status },
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: false,
      message: 'Client not found',
      timestamp: new Date().toISOString(),
    };
  }

  async processMessage(
    clientId: string,
    message: WebsocketMessageDto
  ): Promise<any> {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Process different message types
    switch (message.type) {
      case 'text':
        return {
          id: this.generateMessageId(),
          type: message.type,
          content: message.content,
          sender: client.id,
          timestamp: new Date().toISOString(),
          room: message.room,
        };
      
      case 'file':
        return {
          id: this.generateMessageId(),
          type: message.type,
          content: message.content,
          fileName: message.fileName,
          fileSize: message.fileSize,
          sender: client.id,
          timestamp: new Date().toISOString(),
          room: message.room,
        };
      
      default:
        return {
          id: this.generateMessageId(),
          type: message.type,
          content: message.content,
          sender: client.id,
          timestamp: new Date().toISOString(),
          room: message.room,
        };
    }
  }

  async joinRoom(
    clientId: string,
    roomName: string,
    password?: string
  ): Promise<MessageResponse> {
    const client = this.clients.get(clientId);
    if (!client) {
      return {
        success: false,
        message: 'Client not found',
        timestamp: new Date().toISOString(),
      };
    }

    let room = this.rooms.get(roomName);
    if (!room) {
      // Create new room
      room = {
        name: roomName,
        clients: [],
        createdAt: new Date(),
        createdBy: clientId,
        isPrivate: !!password,
        password,
        metadata: {},
      };
      this.rooms.set(roomName, room);
    }

    // Check password if room is private
    if (room.isPrivate && room.password !== password) {
      return {
        success: false,
        message: 'Invalid room password',
        timestamp: new Date().toISOString(),
      };
    }

    // Add client to room
    if (!room.clients.includes(clientId)) {
      room.clients.push(clientId);
    }
    if (!client.rooms.includes(roomName)) {
      client.rooms.push(roomName);
    }

    this.clients.set(clientId, client);
    this.rooms.set(roomName, room);

    return {
      success: true,
      message: 'Joined room successfully',
      data: { room: roomName, clientCount: room.clients.length },
      timestamp: new Date().toISOString(),
    };
  }

  async leaveRoom(clientId: string, roomName: string): Promise<MessageResponse> {
    const client = this.clients.get(clientId);
    const room = this.rooms.get(roomName);
    
    if (!client || !room) {
      return {
        success: false,
        message: 'Client or room not found',
        timestamp: new Date().toISOString(),
      };
    }

    // Remove client from room
    room.clients = room.clients.filter(id => id !== clientId);
    client.rooms = client.rooms.filter(name => name !== roomName);

    // Delete room if empty
    if (room.clients.length === 0) {
      this.rooms.delete(roomName);
    } else {
      this.rooms.set(roomName, room);
    }

    this.clients.set(clientId, client);

    return {
      success: true,
      message: 'Left room successfully',
      data: { room: roomName },
      timestamp: new Date().toISOString(),
    };
  }

  async getRoomInfo(roomName: string): Promise<RoomData | null> {
    const room = this.rooms.get(roomName);
    if (!room) return null;

    return {
      ...room,
      clientDetails: room.clients
        .map(clientId => this.clients.get(clientId))
        .filter(Boolean) as WebsocketClient[],
    };
  }

  async getAllRooms(): Promise<RoomData[]> {
    return Array.from(this.rooms.values());
  }

  async broadcastToRoom(roomName: string, event: string, data: any): Promise<void> {
    if (this.server) {
      this.server.to(roomName).emit(event, data);
    }
  }

  async broadcastToAll(event: string, data: any): Promise<void> {
    if (this.server) {
      this.server.emit(event, data);
    }
  }

  async sendToClient(clientId: string, event: string, data: any): Promise<void> {
    if (this.server) {
      this.server.to(clientId).emit(event, data);
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}