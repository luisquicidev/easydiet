import { IsNotEmpty, IsNumber, IsOptional, IsUUID, IsBoolean, IsString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class MacronutrientsDto {
    @IsNumber()
    protein: number;

    @IsNumber()
    carbs: number;

    @IsNumber()
    fat: number;

    @IsNumber()
    @IsOptional()
    calories?: number;
}

export class MealFoodDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    grams: number;

    @ValidateNested()
    @Type(() => MacronutrientsDto)
    macronutrients: MacronutrientsDto;

    @IsNumber()
    @IsOptional()
    alternativeGroup?: number;

    @IsNumber()
    @IsOptional()
    sortOrder?: number;
}

export class MealAlternativeDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @ValidateNested()
    @Type(() => MacronutrientsDto)
    macronutrients: MacronutrientsDto;

    @IsString()
    @IsOptional()
    howTo?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MealFoodDto)
    foods: MealFoodDto[];

    @IsNumber()
    @IsOptional()
    sortOrder?: number;
}

export class CreateDietMealDto {
    @IsUUID()
    planId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @ValidateNested()
    @Type(() => MacronutrientsDto)
    macronutrients: MacronutrientsDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MealFoodDto)
    foods: MealFoodDto[];

    @IsString()
    @IsOptional()
    howTo?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MealAlternativeDto)
    @IsOptional()
    alternatives?: MealAlternativeDto[];

    @IsNumber()
    @IsOptional()
    sortOrder?: number;
}

export class UpdateDietMealDto {
    @IsString()
    @IsOptional()
    name?: string;

    @ValidateNested()
    @Type(() => MacronutrientsDto)
    @IsOptional()
    macronutrients?: MacronutrientsDto;

    @IsString()
    @IsOptional()
    howTo?: string;

    @IsBoolean()
    @IsOptional()
    isCustomized?: boolean;

    @IsString()
    @IsOptional()
    customizationReason?: string;

    @IsArray()
    @IsOptional()
    availableIngredients?: string[];
}