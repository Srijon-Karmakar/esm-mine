import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSquadDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;
}

export class AddSquadMemberDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsInt()
  jerseyNo?: number;

  @IsOptional()
  @IsString()
  position?: string;
}
