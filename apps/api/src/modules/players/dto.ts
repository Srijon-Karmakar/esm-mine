import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpsertPlayerProfileDto {
  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsInt()
  @Min(120)
  @Max(250)
  heightCm?: number;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(200)
  weightKg?: number;

  @IsOptional()
  @IsString()
  dominantFoot?: 'RIGHT' | 'LEFT' | 'BOTH';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  positions?: string[]; // ["ST","CM"]
}
