import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { AuthGuard } from "@nestjs/passport";

@Controller('profile')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  async getProfileUser(@Req() req) {
    return this.userService.getProfileUser(req.user.userId);
  }
}
