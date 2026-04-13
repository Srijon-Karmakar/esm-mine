import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class LineupPlayerDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsInt()
  jerseyNo?: number;

  @IsOptional()
  @IsString()
  position?: string;
}

export class SetLineupDto {
  @IsOptional()
  @IsString()
  formation?: string;

  @IsOptional()
  @IsString()
  captainUserId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LineupPlayerDto)
  starting!: LineupPlayerDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineupPlayerDto)
  bench!: LineupPlayerDto[];
}
