import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { WebsocketService } from './websocket.service';
import { WebsocketMessageDto } from './dto';
import { WebsocketClient, MessageResponse, RoomData } from './interfaces';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/ws',
  transports: ['websocket', 'polling'],
})
@UsePipes(new ValidationPipe({ transform: true }))
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(private readonly websocketService: WebsocketService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.websocketService.setServer(server);
  }

  async handleConnection(client: Socket) {
    try {
      const clientInfo: WebsocketClient = {
        id: client.id,
        userId: client.handshake.auth?.userId,
        username: client.handshake.auth?.username,
        connectedAt: new Date(),
        lastActivity: new Date(),
        rooms: [],
        metadata: {
          userAgent: client.handshake.headers['user-agent'],
          ip: client.handshake.address,
          ...client.handshake.auth,
        },
      };

      await this.websocketService.addClient(clientInfo);
      this.logger.log(`Client connected: ${client.id}`);

      // Send welcome message
      client.emit('connection:success', {
        message: 'Connected successfully',
        clientId: client.id,
        timestamp: new Date().toISOString(),
      });

      // Notify other clients about new connection (optional)
      client.broadcast.emit('user:connected', {
        userId: clientInfo.userId,
        username: clientInfo.username,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.emit('connection:error', {
        message: 'Connection failed',
        error: error.message,
      });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const clientInfo = await this.websocketService.getClient(client.id);
      await this.websocketService.removeClient(client.id);
      
      this.logger.log(`Client disconnected: ${client.id}`);

      // Notify other clients about disconnection (optional)
      if (clientInfo) {
        client.broadcast.emit('user:disconnected', {
          userId: clientInfo.userId,
          username: clientInfo.username,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.logger.error(`Disconnection error for client ${client.id}:`, error);
    }
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @MessageBody() data: WebsocketMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<MessageResponse> {
    try {
      this.logger.log(`Message from ${client.id}:`, data);

      // Update client activity
      await this.websocketService.updateClientActivity(client.id);

      // Process message
      const response = await this.websocketService.processMessage(client.id, data);

      // Broadcast message to room or specific clients
      if (data.room) {
        client.to(data.room).emit('message:received', {
          ...response,
          sender: await this.websocketService.getClient(client.id),
        });
      } else if (data.targetClientId) {
        this.server.to(data.targetClientId).emit('message:received', {
          ...response,
          sender: await this.websocketService.getClient(client.id),
        });
      } else {
        // Broadcast to all clients
        client.broadcast.emit('message:received', {
          ...response,
          sender: await this.websocketService.getClient(client.id),
        });
      }

      return {
        success: true,
        message: 'Message sent successfully',
        data: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error handling message:', error);
      throw new WsException({
        success: false,
        message: 'Failed to send message',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @MessageBody() data: { room: string; password?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<MessageResponse> {
    try {
      const result = await this.websocketService.joinRoom(client.id, data.room, data.password);
      
      if (result.success) {
        await client.join(data.room);
        
        // Notify room members
        client.to(data.room).emit('room:user-joined', {
          room: data.room,
          user: await this.websocketService.getClient(client.id),
          timestamp: new Date().toISOString(),
        });

        // Send room info to the client
        const roomInfo = await this.websocketService.getRoomInfo(data.room);
        client.emit('room:info', roomInfo);
      }

      return result;
    } catch (error) {
      this.logger.error('Error joining room:', error);
      throw new WsException({
        success: false,
        message: 'Failed to join room',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('room:leave')
  async handleLeaveRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ): Promise<MessageResponse> {
    try {
      const result = await this.websocketService.leaveRoom(client.id, data.room);
      
      if (result.success) {
        await client.leave(data.room);
        
        // Notify room members
        client.to(data.room).emit('room:user-left', {
          room: data.room,
          user: await this.websocketService.getClient(client.id),
          timestamp: new Date().toISOString(),
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Error leaving room:', error);
      throw new WsException({
        success: false,
        message: 'Failed to leave room',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @MessageBody() data: { room?: string; targetClientId?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientInfo = await this.websocketService.getClient(client.id);
    const typingData = {
      user: clientInfo,
      timestamp: new Date().toISOString(),
    };

    if (data.room) {
      client.to(data.room).emit('typing:start', typingData);
    } else if (data.targetClientId) {
      this.server.to(data.targetClientId).emit('typing:start', typingData);
    }
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @MessageBody() data: { room?: string; targetClientId?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientInfo = await this.websocketService.getClient(client.id);
    const typingData = {
      user: clientInfo,
      timestamp: new Date().toISOString(),
    };

    if (data.room) {
      client.to(data.room).emit('typing:stop', typingData);
    } else if (data.targetClientId) {
      this.server.to(data.targetClientId).emit('typing:stop', typingData);
    }
  }

  @SubscribeMessage('status:update')
  async handleStatusUpdate(
    @MessageBody() data: { status: 'online' | 'away' | 'busy' | 'offline' },
    @ConnectedSocket() client: Socket,
  ): Promise<MessageResponse> {
    try {
      const result = await this.websocketService.updateClientStatus(client.id, data.status);
      
      // Broadcast status change
      client.broadcast.emit('user:status-changed', {
        user: await this.websocketService.getClient(client.id),
        status: data.status,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      this.logger.error('Error updating status:', error);
      throw new WsException({
        success: false,
        message: 'Failed to update status',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: Socket): Promise<any> {
    await this.websocketService.updateClientActivity(client.id);
    return {
      event: 'pong',
      timestamp: new Date().toISOString(),
    };
  }
}