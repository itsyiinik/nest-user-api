import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '@app/common';

@WebSocketGateway()
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() io: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  afterInit() {
    this.logger.log('Notifications Gateway Initialized');
  }

  async handleConnection(client: Socket) {
    const token = (client.handshake.auth?.token ??
      client.handshake.query.token) as string;
    if (!token) {
      this.logger.warn(
        `Client ${client.id} connected without token, disconnecting`,
      );
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      // eslint-disable-next-line
      client.data.userId = payload.userId;
    } catch {
      this.logger.warn(`Client ${client.id} invalid token, disconnecting`);
      client.disconnect();
      return;
    }

    const userId = client.data.userId;
    await client.join(userId);

    const rooms = this.io.sockets.adapter.rooms;
    const room = rooms.get(userId);

    if (room) {
      const connectionsCount = room.size;
      this.logger.log(`Room ${userId} has ${connectionsCount} connection(s)`);

      const socketIds = Array.from(room);
      this.logger.log(`Sockets in room: ${socketIds.join(', ')}`);
    }

    this.logger.log(`Client connected: ${client.id}, user: ${userId}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client: ${client.id}, disconnected: ${client.id}`);
  }

  sendNotification(userId: string, data: any) {
    this.io.to(userId).emit('notification', data);
    this.logger.log(`Notification sent to user ${userId}`);
  }
}
