import { Module } from '@nestjs/common';
import { ClubsController } from './clubs.controller';
import { ClubsService } from './clubs.service';
import { InvitationsModule } from '../invitations/invitations.module';

@Module({
  controllers: [ClubsController],
  providers: [ClubsService],
  imports: [InvitationsModule],
})
export class ClubsModule {}
