import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
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

  @IsOptional()
  @IsString()
  wellnessStatus?: 'FIT' | 'LIMITED' | 'UNAVAILABLE';

  @IsOptional()
  @IsBoolean()
  hasInjury?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  readinessScore?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  energyLevel?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  sorenessLevel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  sleepHours?: number;

  @IsOptional()
  @IsString()
  healthNotes?: string;
}

export class UpdateMyPlayerHealthDto {
  @IsOptional()
  @IsString()
  wellnessStatus?: 'FIT' | 'LIMITED' | 'UNAVAILABLE';

  @IsOptional()
  @IsBoolean()
  hasInjury?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  readinessScore?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  energyLevel?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  sorenessLevel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  sleepHours?: number;

  @IsOptional()
  @IsString()
  healthNotes?: string;
}

export class CreatePlayerTrainingLoadDto {
  @IsDateString()
  sessionDate!: string;

  @IsOptional()
  @IsString()
  sessionType?: string;

  @IsInt()
  @Min(1)
  @Max(600)
  durationMinutes!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  rpe!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
