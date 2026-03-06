import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { StatsEngineService } from './stats-engine.service';

@Module({
  imports: [PrismaModule],
  controllers: [StatsController],
  providers: [StatsService, StatsEngineService],
  exports: [StatsEngineService],
})
export class StatsModule {}
