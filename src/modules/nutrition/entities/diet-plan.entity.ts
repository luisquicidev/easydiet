import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DietGenerationJob } from './diet-generation-job.entity';
import { DietCalculation } from './diet-calculation.entity';
import { DietMeal } from './diet-meal.entity';

@Entity('diet_plans')
export class DietPlan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'integer' }) // Mantido como integer conforme o diagrama
    userId: number;

    @Column({ name: 'job_id' })
    jobId: string;

    @Column({ name: 'calculation_id', nullable: true })
    calculationId: string;

    @Column()
    name: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    tmb: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    get: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    met: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    getd: number;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    })
    activityLevel: number;

    @Column({ nullable: true })
    totalCalories: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    protein: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    carbs: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    fat: number;

    @Column({ nullable: true })
    application: string;

    @Column({ type: 'jsonb', nullable: true })
    planData: Record<string, any>;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relacionamentos
    @ManyToOne(() => User, user => user.dietPlans)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => DietGenerationJob, job => job.dietPlans)
    @JoinColumn({ name: 'job_id' })
    job: DietGenerationJob;

    @ManyToOne(() => DietCalculation, calculation => calculation.plans)
    @JoinColumn({ name: 'calculation_id' })
    calculation: DietCalculation;

    @OneToMany(() => DietMeal, meal => meal.plan)
    meals: DietMeal[];
}