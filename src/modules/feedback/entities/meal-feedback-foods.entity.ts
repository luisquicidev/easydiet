import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MealFeedback } from './meal-feedback.entity';
import { DietMealFood } from '../../nutrition/entities/diet-meal-food.entity';

@Entity('meal_feedback_foods')
export class MealFeedbackFoods {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'meal_feedback_id' })
  meal_feedback_id: string;

  @Column({ name: 'food_id', nullable: true })
  food_id?: string;

  @Column({ name: 'is_alternative', default: false })
  is_alternative: boolean;

  @Column({ name: 'is_custom', default: false })
  is_custom: boolean;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'quantity', type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ name: 'unit', length: 50 })
  unit: string;

  @Column({ name: 'protein', type: 'decimal', precision: 10, scale: 2, nullable: true })
  protein?: number;

  @Column({ name: 'carbs', type: 'decimal', precision: 10, scale: 2, nullable: true })
  carbs?: number;

  @Column({ name: 'fat', type: 'decimal', precision: 10, scale: 2, nullable: true })
  fat?: number;

  @Column({ name: 'calories', type: 'decimal', precision: 10, scale: 2, nullable: true })
  calories?: number;

  @Column({ name: 'consumption_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  consumption_percentage?: number;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => MealFeedback, feedback => feedback.foods)
  @JoinColumn({ name: 'meal_feedback_id' })
  feedback: MealFeedback;

  @ManyToOne(() => DietMealFood, { nullable: true })
  @JoinColumn({ name: 'food_id' })
  food?: DietMealFood;
} 