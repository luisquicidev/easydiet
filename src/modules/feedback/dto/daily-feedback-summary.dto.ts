import { IsString, IsNumber, IsDate, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export enum Mood {
  HAPPY = 'happy',
  NEUTRAL = 'neutral',
  SAD = 'sad',
  ANXIOUS = 'anxious',
  STRESSED = 'stressed',
  TIRED = 'tired',
  ENERGIZED = 'energized',
}

export class CreateDailyFeedbackSummaryDto {
  @IsString()
  user_id: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsNumber()
  @Min(0)
  @Max(100)
  overall_adherence: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  average_satisfaction: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  average_energy: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  average_hunger: number;

  @IsString()
  dominant_mood: Mood;

  @IsNumber()
  total_meals_consumed: number;

  @IsNumber()
  total_meals_planned: number;

  @IsNumber()
  total_modifications: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateDailyFeedbackSummaryDto extends PartialType(CreateDailyFeedbackSummaryDto) {} 