import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdatePlatformClubDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  aiEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  marketplaceEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  socialEnabled?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['FREE', 'PRO', 'ENTERPRISE'])
  billingPlan?: string;

  @IsOptional()
  @IsString()
  @IsIn(['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED'])
  subscriptionStatus?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  subscriptionMonthlyPrice?: number;

  @IsOptional()
  @IsDateString()
  subscriptionStartAt?: string;

  @IsOptional()
  @IsDateString()
  subscriptionNextBillingAt?: string;
}

export class UpdatePlatformAdminDto {
  @IsBoolean()
  isPlatformAdmin!: boolean;
}

export class UpdateRoleSettingDto {
  @IsBoolean()
  isEnabled!: boolean;
}
