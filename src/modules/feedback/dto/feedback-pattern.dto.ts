import { IsString, IsNumber, IsObject, IsBoolean, IsDate, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFeedbackPatternDto {
  @IsString()
  user_id: string;

  @IsString()
  pattern_type: string;

  @IsObject()
  pattern_data: Record<string, any>;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence_score: number;

  @IsBoolean()
  is_active: boolean;

  @IsDate()
  @Type(() => Date)
  last_updated: Date;
}

export class UpdateFeedbackPatternDto extends CreateFeedbackPatternDto {} 