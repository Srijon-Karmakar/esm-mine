import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class AcceptInvitationDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(1)
  fullName!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class ResendInvitationDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  clubId?: string; // optional if you use tokenHash based resend; else pass clubId
}

export class RevokeInvitationDto {
  @IsEmail()
  email!: string;

  @IsString()
  clubId!: string;
}

export class AcceptAssignedInvitationDto {
  @IsString()
  @MinLength(1)
  invitationId!: string;
}
