// src/modules/nutrition/dto/create-food-preference.dto.ts

import { IsEnum, IsString, IsOptional, IsNumber } from 'class-validator';
import { FoodPreferenceType } from '../entities/user-food-preference.entity';

export class CreateFoodPreferenceDto {
    @IsEnum(FoodPreferenceType)
    type: FoodPreferenceType;

    @IsString()
    description: string;

    @IsOptional()
    @IsNumber()
    externalId?: number;

    @IsOptional()
    @IsNumber()
    calories?: number;

    @IsOptional()
    @IsNumber()
    carbohydrates?: number;

    @IsOptional()
    @IsNumber()
    proteins?: number;

    @IsOptional()
    @IsNumber()
    fats?: number;

    @IsOptional()
    @IsString()
    source?: string;
}