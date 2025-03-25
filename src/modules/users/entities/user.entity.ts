import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserBiometrics } from '../../nutrition/entities/user-biometrics.entity';
import { UserActivity } from '../../nutrition/entities/user-activity.entity';
import { UserMetCalculation } from '../../nutrition/entities/user-met-calculation.entity';
import { UserNutritionGoal } from '../../nutrition/entities/user-nutrition-goal.entity';
import { UserFoodPreference } from '../../nutrition/entities/user-food-preference.entity';
import { DietGenerationJob } from '../../nutrition/entities/diet-generation-job.entity';
import { DietPlan } from '../../nutrition/entities/diet-plan.entity';

export enum UserRole {
    USER = 'user',
    NUTRITIONIST = 'nutritionist',
    ADMIN = 'admin',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ nullable: true })
    name: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
        nullable: true
    })
    role: UserRole;

    @Column({ nullable: true, type: 'varchar' })
    refreshToken: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relações com o módulo de nutrição
    @OneToMany(() => UserBiometrics, biometrics => biometrics.user)
    biometrics: UserBiometrics[];

    @OneToMany(() => UserActivity, activity => activity.user)
    activities: UserActivity[];

    @OneToMany(() => UserMetCalculation, metCalculation => metCalculation.user)
    metCalculations: UserMetCalculation[];

    @OneToMany(() => UserNutritionGoal, nutritionGoal => nutritionGoal.user)
    nutritionGoals: UserNutritionGoal[];

    @OneToMany(() => UserFoodPreference, foodPreference => foodPreference.user)
    foodPreferences: UserFoodPreference[];

    @OneToMany(() => DietGenerationJob, dietJob => dietJob.user)
    dietJobs: DietGenerationJob[];

    @OneToMany(() => DietPlan, dietPlan => dietPlan.user)
    dietPlans: DietPlan[];
}