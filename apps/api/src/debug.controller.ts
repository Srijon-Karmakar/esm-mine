import { Controller, Get, Req } from '@nestjs/common';

@Controller('debug')
export class DebugController {
  @Get('headers')
  headers(@Req() req: any) {
    return {
      authorization: req.headers?.authorization || null,
      allHeaders: req.headers,
    };
  }
}
