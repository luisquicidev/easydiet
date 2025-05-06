import { IsUUID, IsDate, IsEnum, IsInt, IsOptional, IsString, ValidateNested, IsArray, Min, Max, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { FeedbackStatus, Mood } from '../entities/meal-feedback.entity';
import { ModificationType } from '../entities/meal-feedback-modifications.entity';

export class CreateMealFeedbackFoodDto {
  @IsUUID()
  @IsOptional()
  food_id?: string;

  @IsOptional()
  @IsBoolean()
  is_alternative?: boolean;

  @IsOptional()
  @IsBoolean()
  is_custom?: boolean;

  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  protein?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  carbs?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  calories?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  consumption_percentage?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateMealFeedbackModificationDto {
  @IsUUID()
  @IsOptional()
  original_food_id?: string;

  @IsEnum(ModificationType)
  modification_type: ModificationType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  new_quantity?: number;

  @IsOptional()
  @IsUUID()
  replacement_food_id?: string;

  @IsOptional()
  @IsString()
  custom_food_name?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  unit?: string;
}

export class CreateMealFeedbackDto {
  @IsUUID()
  user_id: string;

  @IsUUID()
  meal_id: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsEnum(FeedbackStatus)
  @IsOptional()
  status?: FeedbackStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  satisfaction_rating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  energy_level?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  hunger_level?: number;

  @IsEnum(Mood)
  @IsOptional()
  mood?: Mood;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMealFeedbackFoodDto)
  foods: CreateMealFeedbackFoodDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMealFeedbackModificationDto)
  modifications?: CreateMealFeedbackModificationDto[];

  @IsOptional()
  @IsString()
  notes?: string;
} 