import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { JwtPayload } from '@app/common';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const authHeader = client.handshake.query.token as string;
    if (!authHeader) {
      throw new WsException('Not authenticated');
    }
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(authHeader);

      const userId = payload.userId;
      // eslint-disable-next-line
      client.data.userId = userId;
      return true;
    } catch (error) {
      throw new WsException(error);
    }
  }
}
