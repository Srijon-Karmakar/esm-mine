import { IsOptional, IsString } from 'class-validator';

export class UpdateMatchSquadDto {
  @IsOptional()
  @IsString()
  squadId?: string | null;
}
