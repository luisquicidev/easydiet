import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { DietPlan } from './diet-plan.entity';
import { DietMealFood } from './diet-meal-food.entity';
import { DietMealAlternative } from './diet-meal-alternative.entity';

@Entity('diet_meals')
export class DietMeal {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    planId: string;

    @Column()
    name: string;

    @Column()
    sortOrder: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    protein: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    carbs: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    fat: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    calories: number;

    @Column({ type: 'text', nullable: true })
    howTo: string;

    @Column({ default: false })
    isCustomized: boolean;

    @Column({ type: 'text', nullable: true })
    customizationReason: string;

    @Column({ type: 'text', array: true, nullable: true })
    availableIngredients: string[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relacionamentos

    @ManyToOne(() => DietPlan, plan => plan.meals)
    @JoinColumn({ name: 'plan_id' })
    plan: DietPlan;

    @OneToMany(() => DietMealFood, food => food.meal)
    foods: DietMealFood[];

    @OneToMany(() => DietMealAlternative, alternative => alternative.originalMeal)
    alternatives: DietMealAlternative[];
}