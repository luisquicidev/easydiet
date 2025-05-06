import { IsEnum, IsString, IsNumber, IsArray, IsObject, IsOptional, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RecommendationType, RecommendationStatus } from '../entities/weekly-feedback-analysis.entity';

export class MacroAdjustmentsDto {
  @IsNumber()
  protein: number;

  @IsNumber()
  carbs: number;

  @IsNumber()
  fats: number;
}

export class DietChangesDto {
  @IsNumber()
  caloric_adjustment: number;

  @ValidateNested()
  @Type(() => MacroAdjustmentsDto)
  macro_adjustments: MacroAdjustmentsDto;

  @IsArray()
  @IsString({ each: true })
  meal_timing: string[];

  @IsArray()
  @IsString({ each: true })
  food_recommendations: string[];
}

export class WorkoutChangesDto {
  @IsString()
  intensity_adjustment: string;

  @IsString()
  frequency_adjustment: string;

  @IsArray()
  @IsString({ each: true })
  exercise_recommendations: string[];
}

export class RecommendedChangesDto {
  @ValidateNested()
  @Type(() => DietChangesDto)
  diet_changes: DietChangesDto;

  @ValidateNested()
  @Type(() => WorkoutChangesDto)
  workout_changes: WorkoutChangesDto;

  @IsArray()
  @IsString({ each: true })
  lifestyle_changes: string[];
}

export class CreateWeeklyFeedbackAnalysisDto {
  @IsString()
  weekly_feedback_id: string;

  @IsString()
  user_id: string;

  @IsEnum(RecommendationType)
  recommendation_type: RecommendationType;

  @IsString()
  analysis_summary: string;

  @IsArray()
  @IsString({ each: true })
  key_insights: string[];

  @ValidateNested()
  @Type(() => RecommendedChangesDto)
  recommended_changes: RecommendedChangesDto;

  @IsNumber()
  @Min(0)
  @Max(100)
  confidence_score: number;

  @IsOptional()
  @IsString()
  implementation_notes?: string;
}

export class UpdateAnalysisStatusDto {
  @IsEnum(RecommendationStatus)
  status: RecommendationStatus;

  @IsOptional()
  @IsString()
  feedback_notes?: string;
}

export class ImplementRecommendationDto {
  @IsString()
  @IsOptional()
  implementation_notes?: string;
} 