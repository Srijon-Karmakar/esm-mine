import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

function asNumber(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

export class SocialFeedQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(40)
  limit?: number;
}

export class CreateSocialMediaDto {
  @IsIn(['image', 'video'])
  kind!: 'image' | 'video';

  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  url!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  publicId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  format?: string;

  @IsOptional()
  @Transform(({ value }) => asNumber(value))
  @IsInt()
  @Min(1)
  width?: number;

  @IsOptional()
  @Transform(({ value }) => asNumber(value))
  @IsInt()
  @Min(1)
  height?: number;

  @IsOptional()
  @Transform(({ value }) => asNumber(value))
  @Min(0)
  durationSec?: number;

  @IsOptional()
  @Transform(({ value }) => asNumber(value))
  @IsInt()
  @Min(1)
  bytes?: number;
}

export class CreateSocialPostDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  skill!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(1500)
  caption!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];

  @ValidateNested()
  @Type(() => CreateSocialMediaDto)
  media!: CreateSocialMediaDto;
}

export class CreateSocialCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text!: string;
}

export class CreateMediaSignatureDto {
  @IsOptional()
  @IsIn(['auto', 'image', 'video'])
  resourceType?: 'auto' | 'image' | 'video';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  folder?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  transformation?: string;
}
