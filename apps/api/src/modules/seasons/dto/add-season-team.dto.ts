import { IsString, MinLength } from 'class-validator';

export class AddSeasonTeamDto {
  @IsString()
  @MinLength(2)
  name!: string;
}
