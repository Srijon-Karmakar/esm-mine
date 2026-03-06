import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { PrimaryRole, SubRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @IsOptional()
  @IsEnum(PrimaryRole)
  primary?: PrimaryRole;

  @IsOptional()
  @IsArray()
  @IsEnum(SubRole, { each: true })
  subRoles?: SubRole[];
}