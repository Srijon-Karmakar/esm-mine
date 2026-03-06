import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { StatsModule } from '../stats/stats.module';
import { SeasonsModule } from '../seasons/seasons.module';

@Module({
  imports: [PrismaModule, StatsModule, SeasonsModule],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}
