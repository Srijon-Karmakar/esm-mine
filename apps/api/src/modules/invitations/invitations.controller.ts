import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import {
  AcceptAssignedInvitationDto,
  AcceptInvitationDto,
  RevokeInvitationDto,
  ResendInvitationDto,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Controller('invitations')
export class InvitationsController {
  constructor(private invitations: InvitationsService) {}

  // public: validate token (for frontend accept-invite page)
  @Get('validate')
  validate(@Query('token') token: string) {
    return this.invitations.getByToken(token);
  }

  // public: accept invite + set password
  @Post('accept')
  accept(@Body() dto: AcceptInvitationDto) {
    return this.invitations.accept(dto);
  }

  // user-facing in-app assignment list
  @UseGuards(JwtAuthGuard)
  @Get('my-pending')
  myPending(@Req() req: any) {
    return this.invitations.getMyPending(req.user.sub);
  }

  // user-facing in-app assignment acceptance
  @UseGuards(JwtAuthGuard)
  @Post('accept-assignment')
  acceptAssignment(@Req() req: any, @Body() dto: AcceptAssignedInvitationDto) {
    return this.invitations.acceptAssignment(req.user.sub, dto.invitationId);
  }

  // admin-only: revoke an active invite
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('invitations.revoke')
  @Post('revoke')
  revoke(@Body() dto: RevokeInvitationDto) {
    return this.invitations.revoke(dto.clubId, dto.email);
  }

  // admin-only: resend = create new token (simple version)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('invitations.resend')
  @Post('resend')
  resend(@Body() dto: ResendInvitationDto) {
    if (!dto.clubId) {
      // keep simple and explicit
      throw new BadRequestException('clubId is required for resend');
    }
    return this.invitations.resend(dto.clubId, dto.email);
  }
}
