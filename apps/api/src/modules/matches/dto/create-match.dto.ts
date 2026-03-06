import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class CreateMatchDto {
  @IsString()
  title!: string;

  @IsString()
  opponent!: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsISO8601()
  kickoffAt!: string;

  @IsOptional()
  @IsString()
  squadId?: string | null;
}
