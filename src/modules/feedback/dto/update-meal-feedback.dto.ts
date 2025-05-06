import { PartialType } from '@nestjs/mapped-types';
import { CreateMealFeedbackDto } from './create-meal-feedback.dto';

export class UpdateMealFeedbackDto extends PartialType(CreateMealFeedbackDto) {} 