import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InjuriesController } from './injuries.controller';
import { InjuriesService } from './injuries.service';

@Module({
  imports: [PrismaModule],
  controllers: [InjuriesController],
  providers: [InjuriesService],
  exports: [InjuriesService],
})
export class InjuriesModule {}
