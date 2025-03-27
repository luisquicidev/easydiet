import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { DietMeal } from './diet-meal.entity';

@Entity('diet_meal_foods')
export class DietMealFood {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({name: 'meal_id'})
    mealId: string;

    @Column()
    name: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    grams: number;

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

    @Column({ nullable: true })
    alternativeGroup: number;

    @Column()
    sortOrder: number;

    @CreateDateColumn()
    createdAt: Date;

    // Relacionamento

    @ManyToOne(() => DietMeal, meal => meal.foods)
    @JoinColumn({ name: 'meal_id' })
    meal: DietMeal;
}