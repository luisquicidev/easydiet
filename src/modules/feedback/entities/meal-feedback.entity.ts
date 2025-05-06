import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../../modules/users/entities/user.entity';
import { DietMeal } from '../../nutrition/entities/diet-meal.entity';
import { MealFeedbackFoods } from './meal-feedback-foods.entity';
import { MealFeedbackModifications } from './meal-feedback-modifications.entity';

export enum FeedbackStatus {
  PENDING = 'pending',
  FOLLOWED = 'followed',
  MODIFIED = 'modified',
  CUSTOM = 'custom',
}

export enum Mood {
  GREAT = 'great',
  GOOD = 'good',
  NEUTRAL = 'neutral',
  BAD = 'bad',
  TERRIBLE = 'terrible',
}

@Entity('meal_feedback')
export class MealFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  meal_id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({
    type: 'enum',
    enum: FeedbackStatus,
    default: FeedbackStatus.PENDING,
  })
  status: FeedbackStatus;

  @Column({ type: 'integer', nullable: true })
  satisfaction_rating: number;

  @Column({ type: 'integer', nullable: true })
  energy_level: number;

  @Column({ type: 'integer', nullable: true })
  hunger_level: number;

  @Column({
    type: 'enum',
    enum: Mood,
    nullable: true,
  })
  mood: Mood;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => DietMeal)
  meal: DietMeal;

  @OneToMany(() => MealFeedbackFoods, (foods) => foods.feedback)
  foods: MealFeedbackFoods[];

  @OneToMany(() => MealFeedbackModifications, (modifications) => modifications.feedback)
  modifications: MealFeedbackModifications[];
} 