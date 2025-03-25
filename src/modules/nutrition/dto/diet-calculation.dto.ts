import { IsNotEmpty, IsNumber, IsOptional, IsUUID, IsEnum, IsString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CalculationMetDto {
    @IsString()
    @IsNotEmpty()
    met: string;

    @IsNumber()
    factor: number;

    @IsNumber()
    @IsOptional()
    frequencyPerWeek?: number;

    @IsNumber()
    @IsOptional()
    durationMinutes?: number;
}

export class CalculationFormulaDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    value: number;
}

export class DietPlanDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    get: number;

    @IsNumber()
    totalCalories: number;

    @IsString()
    @IsOptional()
    application?: string;
}

export class CreateDietCalculationDto {
    @IsNumber()
    tmb: number;

    @IsNumber()
    ger: number;

    @IsNumber()
    @IsOptional()
    activityLevel?: number;

    @IsNumber()
    objectivePct: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CalculationMetDto)
    @IsOptional()
    mets?: CalculationMetDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CalculationFormulaDto)
    @IsOptional()
    formulas?: CalculationFormulaDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DietPlanDto)
    plans: DietPlanDto[];
}

export class UpdateDietCalculationDto {
    @IsNumber()
    @IsOptional()
    tmb?: number;

    @IsNumber()
    @IsOptional()
    ger?: number;

    @IsNumber()
    @IsOptional()
    activityLevel?: number;

    @IsNumber()
    @IsOptional()
    objectivePct?: number;

    @IsNumber()
    @IsOptional()
    statusPhase?: number;
}