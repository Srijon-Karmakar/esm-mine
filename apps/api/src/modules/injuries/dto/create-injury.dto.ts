import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateInjuryDto {
  @IsString()
  userId!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
