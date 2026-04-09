import { IsArray, ArrayUnique, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ScheduleEventType } from '@prisma/client';

export enum ScheduleTargetGroup {
  Players = 'Players',
  Coaches = 'Coaches',
  Physios = 'Physios',
  Nutritionists = 'Nutritionists',
  PitchManagers = 'Pitch Managers',
  SupportStaff = 'Support Staff',
}

export class CreateScheduleEventDto {
  @IsEnum(ScheduleEventType)
  type!: ScheduleEventType;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsDateString()
  eventAt!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(ScheduleTargetGroup, { each: true })
  targetGroups?: ScheduleTargetGroup[];

}
