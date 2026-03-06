import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const SORT_BY_VALUES = ['createdAt', 'salary', 'name'] as const;
const SORT_DIR_VALUES = ['asc', 'desc'] as const;

function asNumber(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

export class MarketplaceBrowseQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsIn(SORT_BY_VALUES)
  sortBy?: (typeof SORT_BY_VALUES)[number];

  @IsOptional()
  @IsIn(SORT_DIR_VALUES)
  sortDir?: (typeof SORT_DIR_VALUES)[number];

  @IsOptional()
  @Transform(({ value }) => asNumber(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class UpsertMarketplaceListingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  headline!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  positions?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  nationality?: string;

  @IsOptional()
  @Transform(({ value }) => asNumber(value))
  @IsInt()
  @Min(0)
  expectedSalary?: number;

  @IsOptional()
  @IsBoolean()
  openToOffers?: boolean;
}

export class CreateMarketplaceOfferDto {
  @IsString()
  @MinLength(1)
  clubId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  message!: string;

  @IsOptional()
  @Transform(({ value }) => asNumber(value))
  @IsInt()
  @Min(0)
  offeredSalary?: number;
}

