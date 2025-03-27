import { IsString, IsNumber, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class MacronutrientsDto {
    @IsNumber()
    protein: number;

    @IsNumber()
    fat: number;

    @IsNumber()
    carbs: number;
}

class FoodDto {
    @IsString()
    name: string;

    @IsNumber()
    grams: number;

    @ValidateNested()
    @Type(() => MacronutrientsDto)
    macronutrients: MacronutrientsDto;
}

export class MealDetailsDto {
    @IsString()
    name: string;

    @ValidateNested()
    @Type(() => MacronutrientsDto)
    macronutrients: MacronutrientsDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FoodDto)
    foods: FoodDto[];

    @IsString()
    @IsOptional()
    howTo?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MealAlternativeDto)
    @IsOptional()
    alternatives?: MealAlternativeDto[];

    @IsString()
    @IsOptional()
    servingSuggestion?: string;
}

export class MealAlternativeDto {
    @ValidateNested()
    @Type(() => MacronutrientsDto)
    macronutrients: MacronutrientsDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FoodDto)
    foods: FoodDto[];

    @IsString()
    @IsOptional()
    howTo?: string;
}