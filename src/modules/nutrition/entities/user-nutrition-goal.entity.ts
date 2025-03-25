import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DietGoalType {
    WEIGHT_LOSS = 'weightLoss',
    MAINTENANCE = 'maintenance',
    WEIGHT_GAIN = 'weightGain',
}

@Entity('user_nutrition_goals')
export class UserNutritionGoal {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({
        type: 'enum',
        enum: DietGoalType,
        name: 'goalType'
    })
    goalType: DietGoalType;

    @Column({ name: 'calorieAdjustment' })
    calorieAdjustment: number;

    @Column({ name: 'mealsPerDay' })
    mealsPerDay: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, user => user.nutritionGoals)
    @JoinColumn({ name: 'user_id' })
    user: User;
}