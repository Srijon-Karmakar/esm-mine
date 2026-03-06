import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOpponentDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  shortName?: string;
}
