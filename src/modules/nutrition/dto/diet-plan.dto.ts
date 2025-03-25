import { IsNotEmpty, IsNumber, IsOptional, IsUUID, IsBoolean, IsString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { MacronutrientsDto, CreateDietMealDto } from './diet-meal.dto';

export class CreateDietPlanDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsUUID()
    @IsOptional()
    calculationId?: string;

    @IsNumber()
    @IsOptional()
    tmb?: number;

    @IsNumber()
    @IsOptional()
    get?: number;

    @IsNumber()
    @IsOptional()
    met?: number;

    @IsNumber()
    @IsOptional()
    getd?: number;

    @IsNumber()
    @IsOptional()
    activityLevel?: number;

    @IsNumber()
    totalCalories: number;

    @ValidateNested()
    @Type(() => MacronutrientsDto)
    macronutrients: MacronutrientsDto;

    @IsString()
    @IsOptional()
    application?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateDietMealDto)
    @IsOptional()
    meals?: CreateDietMealDto[];
}

export class UpdateDietPlanDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsNumber()
    @IsOptional()
    totalCalories?: number;

    @ValidateNested()
    @Type(() => MacronutrientsDto)
    @IsOptional()
    macronutrients?: MacronutrientsDto;

    @IsString()
    @IsOptional()
    application?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class DietPlanResponseDto {
    @IsUUID()
    id: string;

    @IsString()
    name: string;

    @IsNumber()
    totalCalories: number;

    @ValidateNested()
    @Type(() => MacronutrientsDto)
    macronutrients: MacronutrientsDto;

    @IsString()
    @IsOptional()
    application?: string;

    @IsBoolean()
    isActive: boolean;

    @IsUUID()
    @IsOptional()
    calculationId?: string;

    @IsUUID()
    jobId: string;
}

export class DietPlanWithMealsResponseDto extends DietPlanResponseDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateDietMealDto)
    meals: CreateDietMealDto[];
}