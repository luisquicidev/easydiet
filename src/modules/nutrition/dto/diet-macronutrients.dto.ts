import { IsNumber, IsString, IsOptional, ValidateNested } from 'class-validator';
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

export class MealMacronutrientsDto {
    @IsString()
    name: string;

    @ValidateNested()
    @Type(() => MacronutrientsDto)
    macronutrients: MacronutrientsDto;
}

export class DietPlanMacronutrientsDto {
    @IsString()
    name: string;

    @IsNumber()
    totalCalories: number;

    @IsString()
    @IsOptional()
    application?: string;

    @ValidateNested()
    @Type(() => MacronutrientsDto)
    macronutrients: MacronutrientsDto;

    @ValidateNested({ each: true })
    @Type(() => MealMacronutrientsDto)
    @IsOptional()
    meals?: MealMacronutrientsDto[];
}

export class DietPlanGenerationDto {
    @ValidateNested({ each: true })
    @Type(() => DietPlanMacronutrientsDto)
    plans: DietPlanMacronutrientsDto[];
}