import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
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
    const jwtToken = client.handshake.query.token as string;
    if (!jwtToken) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(jwtToken);

      const userId = payload.userId;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      client.data.userId = userId;

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
    } catch {
      this.logger.warn(`JWT validation failed for client ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  sendNotification(userId: string, data: any) {
    this.io.to(userId).emit('notification', data);
    this.logger.log(`Notification sent to user ${userId}`);
    this.logger.error(`Failed to send notification to user ${userId}:`);
  }
}
