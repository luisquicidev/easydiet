import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { DietMeal } from './diet-meal.entity';
import { DietMealAlternativeFood } from './diet-meal-alternative-food.entity';

@Entity('diet_meal_alternatives')
export class DietMealAlternative {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({name: 'original_meal_id'})
    originalMealId: string;

    @Column()
    name: string;

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

    @Column()
    sortOrder: number;

    @CreateDateColumn()
    createdAt: Date;

    // Relacionamentos

    @ManyToOne(() => DietMeal, meal => meal.alternatives)
    @JoinColumn({ name: 'original_meal_id' })
    originalMeal: DietMeal;

    @OneToMany(() => DietMealAlternativeFood, food => food.alternative)
    foods: DietMealAlternativeFood[];
}