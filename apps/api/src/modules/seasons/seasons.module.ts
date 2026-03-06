import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SeasonsController } from './seasons.controller';
import { SeasonsService } from './seasons.service';
import { StandingsEngineService } from './standings-engine.service';

@Module({
  imports: [PrismaModule],
  controllers: [SeasonsController],
  providers: [SeasonsService, StandingsEngineService],
  exports: [SeasonsService, StandingsEngineService], // used by MatchesService hook
})
export class SeasonsModule {}
