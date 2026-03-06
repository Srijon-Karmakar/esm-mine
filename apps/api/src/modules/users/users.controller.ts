// import { Controller, Get, Req, UseGuards } from "@nestjs/common";
// import { JwtAuthGuard } from "../auth/jwt.guard";
// import { UsersService } from "./users.service";

// @Controller()
// export class UsersController {
//   constructor(private users: UsersService) {}

//   @UseGuards(JwtAuthGuard)
//   @Get("me")
//   async me(@Req() req: any) {
//     const userId = req.user?.sub;
//     const user = await this.users.findById(userId);
//     return { user };
//   }
// }

import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private users: UsersService) {}

  // ✅ TEMP DEBUG
  @UseGuards(JwtAuthGuard)
  @Get('auth-check')
  authCheck(@Req() req: any) {
    return { ok: true, user: req.user };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    const userId = req.user?.sub;
    const user = await this.users.findById(userId);
    return { user };
  }
}
