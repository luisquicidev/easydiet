import { IsNotEmpty, IsNumber, IsOptional, IsEnum, IsString, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DietGoalType } from '../entities/user-nutrition-goal.entity';

export class DietProcessBiometricsDto {
    @IsNumber()
    weight: number;

    @IsNumber()
    height: number;

    @IsNumber()
    age: number;

    @IsString()
    gender: string;

    @IsNumber()
    @IsOptional()
    leanMass?: number;
}

export class DietProcessGoalDto {
    @IsEnum(DietGoalType)
    goalType: DietGoalType;

    @IsNumber()
    calorieAdjustment: number;

    @IsNumber()
    mealsPerDay: number;
}

export class DietProcessActivityDto {
    @IsString()
    metCode: string;

    @IsNumber()
    frequencyPerWeek: number;

    @IsNumber()
    durationMinutes: number;
}

export class CreateDietProcessDto {
    @IsUUID()
    @IsOptional()
    biometricsId?: string;

    @ValidateNested()
    @Type(() => DietProcessBiometricsDto)
    @IsOptional()
    biometrics?: DietProcessBiometricsDto;

    @ValidateNested()
    @Type(() => DietProcessGoalDto)
    goal: DietProcessGoalDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DietProcessActivityDto)
    @IsOptional()
    activities?: DietProcessActivityDto[];

    @IsString()
    @IsOptional()
    additionalInstructions?: string;
}

export class DietProcessStatusDto {
    @IsUUID()
    jobId: string;

    @IsString()
    status: string;

    @IsNumber()
    progress: number;

    @IsNumber()
    currentPhase: number;

    @IsString()
    @IsOptional()
    message?: string;

    @IsUUID()
    @IsOptional()
    calculationId?: string;

    @IsUUID()
    @IsOptional()
    planId?: string;
}