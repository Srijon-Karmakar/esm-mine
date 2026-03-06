import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOpponentDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  shortName?: string;
}
