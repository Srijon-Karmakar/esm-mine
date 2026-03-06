import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class AskAiAssistantDto {
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  question!: string;

  @IsOptional()
  @IsString()
  range?: string;

  @IsOptional()
  @IsString()
  lensRole?: string;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(21)
  days?: number;
}
