import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MealFeedback } from './meal-feedback.entity';
import { DietMealFood } from '../../nutrition/entities/diet-meal-food.entity';

export enum ModificationType {
  QUANTITY = 'quantity',
  REPLACEMENT = 'replacement',
  CUSTOM = 'custom',
}

@Entity('meal_feedback_modifications')
export class MealFeedbackModifications {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'meal_feedback_id' })
  meal_feedback_id: string;

  @Column({ name: 'original_food_id' })
  original_food_id: string;

  @Column({ name: 'modification_type', length: 50 })
  modification_type: string;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'replacement_food_id', nullable: true })
  replacement_food_id: string;

  @Column({ name: 'quantity', type: 'decimal', precision: 10, scale: 2, nullable: true })
  quantity: number;

  @Column({ name: 'unit', length: 50, nullable: true })
  unit: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => MealFeedback, mealFeedback => mealFeedback.modifications)
  @JoinColumn({ name: 'meal_feedback_id' })
  feedback: MealFeedback;

  @ManyToOne(() => DietMealFood)
  original_food: DietMealFood;

  @ManyToOne(() => DietMealFood)
  replacement_food: DietMealFood;
} 